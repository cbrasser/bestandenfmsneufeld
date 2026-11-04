-- Read-only: shows where the database stands, one fact per row. It changes nothing, so it can run at any
-- time after the additive migrations. README.md in this folder says what to expect at each step.
--
--   students             how many rows there are
--   students_with_name   how many still hold a name
--   content_fingerprint  changes if anything but a name changes in any row
--   version_total        rises with every save, and not because of the launch migration
--   last_change          the newest updated_at; the launch migration doesn't move it either
--   save_data            original, disabled, or changed: someone edited it, so rollback.sql would not
--                        restore what was there
--   version_trigger      enabled, or disabled, which is wrong outside the launch migration itself

with student_rows as (
  select
    id,
    version,
    updated_at,
    jsonb_typeof(data) = 'object' and jsonb_typeof(data->'studentInfo') = 'object' and data->'studentInfo' ? 'name' as has_name,
    data
  from public.students
)
select 'students' as fact, count(*)::text as value from student_rows
union all
select 'students_with_name', count(*) filter (where has_name)::text from student_rows
union all
select 'content_fingerprint', md5(coalesce(string_agg(
  id::text || ':' || (case when has_name then data #- '{studentInfo,name}' else data end)::text, ',' order by id
), '')) from student_rows
union all
select 'version_total', coalesce(sum(version), 0)::text from student_rows
union all
select 'last_change', max(updated_at)::text from student_rows
union all
select 'save_data', case
    when trim(regexp_replace(prosrc, '\s+', ' ', 'g')) =
      'declare n int; begin update public.students set data = p_data, updated_at = now() where code_hash = public.hash_code(p_code); get diagnostics n = row_count; return n > 0; end;'
      and prosecdef
      and has_function_privilege('anon', oid, 'execute')
    then 'original'
    when prosrc like '%save_data is disabled%' then 'disabled'
    else 'changed'
  end
  from pg_proc where oid = 'public.save_data(text,jsonb)'::regprocedure
union all
select 'version_trigger', case tgenabled when 'O' then 'enabled' else 'disabled' end
  from pg_trigger where tgrelid = 'public.students'::regclass and tgname = 'students_raise_version';
