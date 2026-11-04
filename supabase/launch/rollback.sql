-- The launch rollback. Run it only with the owner's go-ahead: see README.md in this folder.
-- It restores save_data exactly as it is in the historical schema.sql, so that old website copies can
-- save again. Grants were never touched. Everything else from the launch stays, because the additive
-- calls do no harm, and the names stay removed: they return only from the backup.

create or replace function public.save_data(p_code text, p_data jsonb)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  n int;
begin
  update public.students
     set data = p_data, updated_at = now()
   where code_hash = public.hash_code(p_code);
  get diagnostics n = row_count;
  return n > 0;
end;
$$;
