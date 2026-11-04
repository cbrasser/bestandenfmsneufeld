# Launch steps

How the database changes reach production, in the order the launch needs them. Nothing in this folder runs by itself: `supabase db reset` and `npm run test:sync` only apply `supabase/migrations/`.

| File | What it does |
| --- | --- |
| `../migrations/20261104120000_students_version.sql` and `../migrations/20261104130000_names_off_the_cloud.sql` | The additive changes. The live site ignores them |
| `launch.sql` | Stops `save_data` writing, and removes names |
| `rollback.sql` | Restores `save_data` |
| `check.sql` | Shows where the database stands. Changes nothing |
| `rehearsal.ts` | Proves all of this on local Supabase, with made-up rows |

## Which steps you must approve

These reach students or change production, so they only happen when you say go, one at a time. If an agent is helping, it asks before each and never takes one approval to cover the next.

| Step | Needs your go-ahead |
| --- | --- |
| 1.2 Additive changes to production | Yes |
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

**1.1 Back up the database.** See [Taking a backup](#taking-a-backup), using a folder such as `~/bestanden-backups/before-additive`.

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

Now you can pilot with the test APK and the Vercel preview, for as long as you like.

## Part 2: the launch

Do these within minutes, in this order. Have the APK, the guide and the website ready before you start. Between 2.3 and 2.4 the live site shows "sync failed", and students' edits stay safe on their devices.

**2.1 Back up the database.** See [Taking a backup](#taking-a-backup), using a new folder such as `~/bestanden-backups/launch`.

**2.2 Publish the APK and guide. Needs your go-ahead.** Run the app repo's release script.

**It worked if** the release page of `cbrasser/bestanden-releases` shows the new version and its APK downloads.

**2.3 Run the launch migration. Needs your go-ahead.** In the SQL Editor:

1. Run `check.sql` and keep the result.
2. Paste the whole of `launch.sql` and run it.
3. Run `check.sql` again.

**It worked if** the second result differs from the first only like this:

| Fact | Expect after the launch |
| --- | --- |
| `students_with_name` | `0` |
| `save_data` | `disabled` |
| `students` | Unchanged |
| `content_fingerprint` | Unchanged, unless `version_total` rose |
| `version_total` | Unchanged, unless someone with the new app saved in those seconds |
| `last_change` | Unchanged, under the same condition |
| `version_trigger` | `enabled` |

If `content_fingerprint` changed and `version_total` did not, something is wrong: go to [Rollback](#rollback).

If `launch.sql` shows an error, part 2 has changed nothing, but `save_data` may already be disabled. Running it again is safe. If it fails again, go to [Rollback](#rollback).

Then open `/#admin`. The users and grades totals should match what you saw before, and "active" should not have jumped.

**2.4 Deploy the website. Needs your go-ahead.** Merge `android-launch` into `main` and push, which deploys to production.

**It worked if**, on both `bestandenfms.cbradev.ch` and `bestandenfmsneufeld.vercel.app`, after a reload, a throwaway code shows "synced" after an edit, and the pop-up and `/#app` guide appear.

Keep the backup somewhere safe and private: it holds every student's grades and name. Delete it once you're sure you won't roll back, since it's then the only copy of those names you control. Supabase's own scheduled backups also hold names, until they age out.

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

Choose a folder outside the repo, so the backup can't be committed by accident:

```bash
export BACKUP_DIR=~/bestanden-backups/launch && mkdir -p "$BACKUP_DIR"
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

**Needs your go-ahead.** Only for damaged data, not to get names back. **Every row returns to how it was at backup time, so everything students saved since then is lost.** Take a new backup first, in another folder, so that this can be undone too.

```bash
(echo 'begin; truncate public.students, public.admin_keys;'; cat "$BACKUP_DIR/data.sql"; echo 'commit;') | docker run --rm -i postgres:17 psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -f -
```

It's all or nothing: if it fails, nothing has changed.

**It worked if** `check.sql` shows the `students` and `version_total` you'd expect from that backup, and the app's `/#admin` page shows the old totals.

## Why the launch migration works as it does

- **`version` and `updated_at` stay as they are.** The launch migration turns the version trigger off during its update, in a transaction, so it's on again the moment it commits.
  - A raised version would refuse a device's next save. Since the data then differs from what the device holds, the student would get a conflict prompt for a change nobody made.
  - A newer `updated_at` would show a false "last change" in that prompt. `admin_stats` counts anyone with an `updated_at` in the last 30 days as active, so every account would look active. `admin_stats` reads no names.
- **Odd rows are left alone.** Removing a path raises an error on some shapes of data, and one such row would stop the launch. So it only touches rows where the data and `studentInfo` are both objects holding a `name`, and the rehearsal compares rows of each odd shape byte for byte.
- **`save_data` raises an error instead of returning false.** Old website copies show "sync failed" for both, and an error is plainly a refusal when you read the logs.
- **`save_data` stops before names go, in separate transactions.** Otherwise a save from an old copy could wait for the name removal to finish, and then write its name back.
- **`load_data` is untouched.** Old copies can still load, and they cope with data that has no name.
