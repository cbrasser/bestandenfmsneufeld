-- Version-checked sync, additive only: old cached website copies keep working through load_data and
-- save_data, and their writes raise the version too, so newer clients notice them.

alter table public.students add column if not exists version integer not null default 1;

-- ---------------------------------------------------------------------
-- The version belongs to the database: whatever a writer sends is ignored
-- ---------------------------------------------------------------------
create or replace function public.raise_student_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.version := 1;
  else
    new.version := old.version + 1;
  end if;
  return new;
end;
$$;

revoke all on function public.raise_student_version() from public, anon, authenticated;

drop trigger if exists students_raise_version on public.students;
create trigger students_raise_version
  before insert or update on public.students
  for each row execute function public.raise_student_version();

-- ---------------------------------------------------------------------
-- RPC: load. Returns { data, version, updated_at }, or NULL for an unknown code.
-- ---------------------------------------------------------------------
create or replace function public.load_student(p_code text)
returns jsonb
language sql
security definer
set search_path = public, extensions
as $$
  select jsonb_build_object('data', data, 'version', version, 'updated_at', updated_at)
  from public.students
  where code_hash = public.hash_code(p_code);
$$;

-- ---------------------------------------------------------------------
-- RPC: save, only if the row is still at the expected version. Returns one of
--   { status: 'saved',    version, updated_at }  version is the new one
--   { status: 'conflict', version, updated_at }  the current ones; nothing was written
--   { status: 'unknown_code' }
-- The version check is part of the UPDATE, so of two parallel saves only one can match.
-- ---------------------------------------------------------------------
create or replace function public.save_student(p_code text, p_data jsonb, p_expected_version integer)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_version integer;
  v_updated_at timestamptz;
begin
  update public.students
     set data = p_data, updated_at = now()
   where code_hash = public.hash_code(p_code)
     and version = p_expected_version
  returning version, updated_at into v_version, v_updated_at;

  if found then
    return jsonb_build_object('status', 'saved', 'version', v_version, 'updated_at', v_updated_at);
  end if;

  select version, updated_at into v_version, v_updated_at
    from public.students
   where code_hash = public.hash_code(p_code);

  if not found then
    return jsonb_build_object('status', 'unknown_code');
  end if;

  return jsonb_build_object('status', 'conflict', 'version', v_version, 'updated_at', v_updated_at);
end;
$$;

revoke all on function public.load_student(text)                  from public;
revoke all on function public.save_student(text, jsonb, integer)  from public;

grant execute on function public.load_student(text)                 to anon, authenticated;
grant execute on function public.save_student(text, jsonb, integer) to anon, authenticated;
