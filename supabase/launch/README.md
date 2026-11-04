# Launch steps

How the database changes reach production, in the order the launch needs them. Nothing in this folder runs by itself: `supabase db reset` and `npm run test:sync` only apply `supabase/migrations/`.

| File | What it does |
| --- | --- |
| `../migrations/20261104120000_students_version.sql` and `../migrations/20261104130000_names_off_the_cloud.sql` | The additive changes. The live site ignores them, except that new accounts no longer store a name when created |
| `launch.sql` | Stops `save_data` writing, and removes names |
| `rollback.sql` | Restores `save_data` |
| `check.sql` | Shows where the database stands. Changes nothing |
| `rehearsal.ts` | Proves all of this on local Supabase, with made-up rows |

## Which steps you must approve

These reach students or change production, so they only happen when you say go, one at a time. If an agent is helping, it asks before each and never takes one approval to cover the next.

| Step | Needs your go-ahead |
| --- | --- |
| 1.2 Additive changes to production | Yes |
| Creating the `cbrasser/bestanden-releases` repo, if it doesn't exist yet | Yes |
| 2.2 Publish the APK and guide | Yes |
| 2.3 Launch migration | Yes |
| 2.4 Deploy the website | Yes |
| Rollback | Yes |
| Restore from backup | Yes, and read its warning first |

You run the backups yourself, because they need the database password and hold student grades. Never paste that password into a chat.

## Before anything: rehearse

On the commit you're about to launch:

```bash
npm run rehearse:launch
```

**It worked if** the last lines say all tests passed.

## Part 1: additive changes

Do this once, before your pilot. The live site carries on as normal.

**1.1 Back up the database.** See [Taking a backup](#taking-a-backup).

**1.2 Apply the additive changes. Needs your go-ahead.** In the Supabase dashboard, open the SQL Editor. Paste the whole of `20261104120000_students_version.sql` and run it. Then do the same with `20261104130000_names_off_the_cloud.sql`. If the editor warns about a destructive operation, that's the `drop trigger if exists` line: confirm it.

Use the SQL Editor, not `supabase db push`: production has no migration history, so `push` would try to run the baseline files as well.

**It worked if** `check.sql`, run in the SQL Editor, shows:

| Fact | Expect |
| --- | --- |
| `students` | The same as the row count from your backup |
| `save_data` | `original` |
| `version_trigger` | `enabled` |

If `save_data` says `changed`, **stop here**. Production's `save_data` differs from `schema.sql`, so `rollback.sql` wouldn't restore what's really there, and it needs correcting before launch.

Then open the live site with a throwaway code, edit a grade, and see "synced".

**1.3 Check that the SQL Editor handles transactions.** `launch.sql` commits twice in one run, which the rehearsal could only imitate. Run this in the SQL Editor. It changes nothing:

```sql
begin; select 1; commit; begin; select 2; commit;
```

**It worked if** it runs without an error. If it fails, tell whoever is helping with the launch: `launch.sql` then has to run in two pieces.

Now you can pilot with the test APK and the Vercel preview, for as long as you like.

## Part 2: the launch

Do these within minutes, in this order. Have the APK, the guide and the website ready before you start. Between 2.3 and 2.4 the live site shows "sync failed", and students' edits stay safe on their devices.

**2.1 Back up the database.** See [Taking a backup](#taking-a-backup). Note the folder it prints, because that's the launch backup.

**2.2 Publish the APK and guide. Needs your go-ahead.** Run the app repo's release script.

**It worked if** the release page of `cbrasser/bestanden-releases` shows the new version and its APK downloads.

**2.3 Run the launch migration. Needs your go-ahead.** In the SQL Editor:

1. Run `check.sql` and keep the result.
2. Paste the whole of `launch.sql` and run it.
3. Run `check.sql` again.

**It worked if** the second result shows:

| Fact | Expect after the launch |
| --- | --- |
| `students_with_name` | `0`. If it's higher, an old copy's save got in at the last moment: run `launch.sql` again |
| `save_data` | `disabled` |
| `version_trigger` | `enabled` |

The other facts tell you that nothing else changed. Students can still sign up, save with the new app and delete their data during these seconds, so:

- If `students` and `version_total` are both unchanged, `content_fingerprint` and `last_change` must be unchanged too. If they aren't, something is wrong: go to [Rollback](#rollback).
- If `students` or `version_total` moved, someone was using the service, which is normal. Rely on `/#admin` below.

If `launch.sql` shows an error, its name removal has changed nothing, but `save_data` may already be disabled. Running it again is safe. If it fails again, go to [Rollback](#rollback).

Then open `/#admin`. The users and grades totals should match what you saw before, give or take anyone active in those seconds, and "active" should not have jumped.

**2.4 Deploy the website. Needs your go-ahead.** Merge `android-launch` into `main` and push, which deploys to production.

**It worked if**, on both `bestandenfms.cbradev.ch` and `bestandenfmsneufeld.vercel.app`, after a reload, a throwaway code shows "synced" after an edit, and the pop-up and `/#app` guide appear.

Keep every backup somewhere safe and private: they hold each student's grades and name. Delete them all once you're sure you won't roll back, since they're then the only copies of those names you control. Supabase's own scheduled backups also hold names, until they age out.

**Afterwards:** add `launch.sql` to `supabase/migrations/` as a normal reviewed change, so that local databases match production, and update the sync scenarios that still expect `save_data` to write.

## Rollback

**Needs your go-ahead.** Do these in this order, because both the old and the new website work against the restored database, so nothing fails along the way.

1. In the SQL Editor, paste the whole of `rollback.sql` and run it.

   **It worked if** `check.sql` shows `save_data` as `original`.

2. In Vercel, open Deployments and use Instant Rollback on the deployment from before the launch.

   **It worked if** the site shows the previous version after a reload, and a throwaway code shows "synced" after an edit. Vercel then stops promoting new pushes by itself, so you'll need to promote the deployment when you launch again.

Published APKs keep working, because the additive calls stay. If the app itself is the problem, take the release down from `cbrasser/bestanden-releases`.

**Names don't come back.** That's normally fine: they're still on students' devices, and nothing needs them in the cloud. An old website copy uploads its name again on its next save, and running `launch.sql` again later removes those too.

## Taking a backup

Run these from the repo root. You need Docker running, and the connection string from the dashboard's **Connect** button, under **Session pooler**, with your database password filled in. Any special characters in the password must be percent-encoded.

This asks for the connection string without showing it or saving it in your shell history:

```bash
read -rs DB_URL && export DB_URL
```

This makes a new folder outside the repo, named by the time, so a backup can't be committed by accident or overwrite an earlier one:

```bash
export BACKUP_DIR=~/bestanden-backups/$(date +%Y-%m-%d-%H%M%S) && mkdir -p "$BACKUP_DIR" && echo "$BACKUP_DIR"
```

```bash
supabase db dump --db-url "$DB_URL" --data-only --schema public -f "$BACKUP_DIR/data.sql"
```

```bash
supabase db dump --db-url "$DB_URL" --schema public -f "$BACKUP_DIR/schema.sql"
```

**It worked if** this prints the same number as `students` in `check.sql`, or as `select count(*) from public.students` before part 1:

```bash
awk '/^INSERT INTO "public"."students"/{f=1;next} /^$/{f=0} f' "$BACKUP_DIR/data.sql" | wc -l
```

## Restore from backup: last resort

**Needs your go-ahead.** Only for damaged data, not to get names back. **Every row returns to how it was at backup time, so everything students saved since then is lost.**

First [take a new backup](#taking-a-backup), so that this can be undone too. It goes in its own folder, so it can't replace the one you're restoring.

Then name the backup to go back to, which is usually the launch backup from step 2.1:

```bash
export RESTORE_FROM=~/bestanden-backups/the-folder-of-that-backup
```

```bash
(echo 'begin; truncate public.students, public.admin_keys;'; cat "$RESTORE_FROM/data.sql"; echo 'commit;') | docker run --rm -i postgres:17 psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -f -
```

It's all or nothing: if it fails, nothing has changed.

**It worked if** `check.sql` shows the `students` and `version_total` you'd expect from that backup, and the app's `/#admin` page shows the old totals.

## Why the launch migration works as it does

- **`version` and `updated_at` stay as they are.** The launch migration turns the version trigger off during its update, in a transaction, so it's on again the moment it commits.
  - A raised version would refuse a device's next save. Since the data then differs from what the device holds, the student would get a conflict prompt for a change nobody made.
  - A newer `updated_at` would show a false "last change" in that prompt. `admin_stats` counts anyone with an `updated_at` in the last 30 days as active, so every account would look active. `admin_stats` reads no names.
- **Odd rows are left alone.** Removing a path raises an error on some shapes of data, and one such row would stop the launch. So it only touches rows where the data and `studentInfo` are both objects holding a `name`, and the rehearsal compares rows of each odd shape byte for byte. A row whose whole value is an array has no `studentInfo.name` to remove, so anything inside it stays. No client has ever sent one: the rehearsal only includes it to prove the launch survives it.
- **`save_data` raises an error instead of returning false.** Old website copies show "sync failed" for both, and an error is plainly a refusal when you read the logs.
- **`save_data` stops before names go, in separate transactions.** Otherwise a save from an old copy could wait for the name removal to finish, and then write its name back. A save already under way as `save_data` stops could still do that, in a window of milliseconds, which is why step 2.3 checks `students_with_name`.
- **`load_data` is untouched.** Old copies can still load, and they cope with data that has no name.
