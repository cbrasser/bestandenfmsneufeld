-- The launch migration. Run it only at launch, with the owner's go-ahead: see README.md in this folder.
-- It stops old website copies from saving, and removes the names already uploaded. It can safely run
-- again. Undo with rollback.sql, except for the names, which return only from the backup.

-- ---------------------------------------------------------------------
-- First, save_data stops writing. This commits before the names go, so that an old copy's save can't
-- wait behind the name removal and bring a name back. Only a save already under way at this moment
-- still could, which leaves a window of milliseconds. check.sql shows it, and running this again fixes it.
--
-- It raises an error rather than returning false: an old copy shows "sync failed" for both, but the
-- error makes it plain in the logs that the call was refused. Signature, attributes and grants stay
-- as they were, so only the body changes and rollback.sql only has to restore the body.
-- ---------------------------------------------------------------------
begin;

create or replace function public.save_data(p_code text, p_data jsonb)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  raise exception 'save_data is disabled, please reload the page';
end;
$$;

commit;

-- ---------------------------------------------------------------------
-- Second, names go, and nothing else changes. All or nothing.
--
-- The version trigger is off for this update, so neither version nor updated_at moves. Removing a name
-- is not a change a student made, and clients ignore names when comparing data:
--   * A raised version would refuse a device's next save, and since the data then really differs from
--     what it holds, the student would get a conflict prompt for a change nobody made.
--   * A newer updated_at would show every student a false "last change", and admin_stats counts
--     updated_at in its last 30 days as active, so every account would look active.
--
-- The filter is exact because #- raises an error on data of other shapes: an array or scalar as the
-- whole value, or an array as studentInfo. One such row would otherwise stop the whole launch.
-- ---------------------------------------------------------------------
begin;

-- Also waits for saves in progress, and makes new ones wait until the commit
alter table public.students disable trigger students_raise_version;

update public.students
   set data = data #- '{studentInfo,name}'
 where jsonb_typeof(data) = 'object'
   and jsonb_typeof(data->'studentInfo') = 'object'
   and data->'studentInfo' ? 'name';

alter table public.students enable trigger students_raise_version;

do $$
begin
  if exists (
    select 1 from public.students
    where jsonb_typeof(data) = 'object'
      and jsonb_typeof(data->'studentInfo') = 'object'
      and data->'studentInfo' ? 'name'
  ) then
    raise exception 'Names are left after removing them, so nothing was changed';
  end if;
end;
$$;

commit;
