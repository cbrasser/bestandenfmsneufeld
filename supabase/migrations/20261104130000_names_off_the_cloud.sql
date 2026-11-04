-- Names stay on the device, and students can delete their cloud data. Additive only: save_data still
-- takes whatever an old cached website copy sends, and names already uploaded stay, until the launch
-- migration deals with both.

-- ---------------------------------------------------------------------
-- RPC: create an account. As before, but the name never reaches the row.
-- ---------------------------------------------------------------------
create or replace function public.create_account(p_code text, p_data jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if length(p_code) < 12 then
    raise exception 'Code zu kurz';
  end if;
  insert into public.students (code_hash, data)
  values (public.hash_code(p_code), p_data #- '{studentInfo,name}');
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: save, as in 20261104120000_students_version.sql, but the name never reaches the row.
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
     set data = p_data #- '{studentInfo,name}', updated_at = now()
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

-- ---------------------------------------------------------------------
-- RPC: delete the row for a code, after which the code no longer exists.
-- Returns true if a row was removed, false for an unknown code.
-- ---------------------------------------------------------------------
create or replace function public.delete_student(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  n int;
begin
  delete from public.students
   where code_hash = public.hash_code(p_code);
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

revoke all on function public.delete_student(text) from public;
grant execute on function public.delete_student(text) to anon, authenticated;
