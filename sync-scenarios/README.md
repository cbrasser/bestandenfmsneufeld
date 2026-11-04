# Sync scenarios

`scenarios.json` describes how sync must behave, as plain data. Each platform runs the same table
against its own sync module and real database calls on local Supabase, with a thin runner:

- Website: `npm run test:sync`, which runs `src/sync/sync.scenarios.ts`
- Android: the app repo holds a copy of this folder

To add a scenario, add an entry here. Each one uses a fresh code, and steps run in order. A new kind
of step needs a case in every runner, so reuse the existing ones where you can.

## Steps

`device` names a device: its own local data and sync state, created on first use.

| Action | Fields | What it does |
| --- | --- | --- |
| `open` | `device`, `fixture`? | Starts or restarts the device, which then syncs. `fixture` sets its local data first. Sync state survives a restart |
| `createCode` | `device`, `refused`? | Creates a code from the device's local data. Later steps use this code by default. `refused: true` means it must fail and change nothing |
| `connect` | `device`, `code`?, `result`? | Connects with a code. `result` defaults to `connected`, otherwise `unknown_code`, or `newer_data` when the device is read-only or the cloud's data is in a newer format. That is refused, changing nothing |
| `enterName` | `device`, `name` | The student enters a name on this device. Doesn't count as a change the cloud needs |
| `deleteCloudData` | `device`, `result`? | The student deletes the cloud data. `result` defaults to `deleted`, otherwise `unreachable`, or `out_of_step` when the cloud holds data the device never received. That is refused, and the device syncs instead. `newer_data` when the device is read-only or the cloud's data is in a newer format: that is refused too |
| `disconnect` | `device` | The student disconnects. Local and cloud data stay. A read-only device stays connected: follow it with `expectDevice` |
| `addGrade` | `device`, `value`, `counted`? | A student's edit: adds a grade to the subject the fixtures name. `counted` says whether the cloud needs it, and defaults to `true`. It is `false` on a device without a code |
| `importFile` | `device`, `grades`, `dataVersion`?, `result`?, `counted`? | The student confirms importing a file holding these grades, made from the `fms-student` fixture. `result` defaults to `imported`: the replaced data becomes the backup, and this counts as an edit (`counted` as for `addGrade`). `newer` means the file's `dataVersion` is higher than supported: the file is only shown, and the device is read-only until `closeNewerFile` |
| `closeNewerFile` | `device` | The student leaves a newer file's read-only view, so the device syncs |
| `saveDelayElapsed` | `device` | The save delay after an edit has passed, so the device syncs |
| `focus` | `device` | The student returned to the page or app, so the device syncs |
| `setOffline` | `device`, `offline` | Cuts the device off from the cloud, or lets it through again without it noticing |
| `reconnect` | `device` | The connection returned, so the device notices and syncs |
| `loseNextSaveAnswer` | `device` | The device's next save reaches the cloud, but the device doesn't get the answer and sees a failed call |
| `selectYear` | `device`, `year` | The student switches to another year. This must not count as an edit |
| `reconcile` | `device` | The device brings its stored data in line with its subject lists, as a new app version does. This must not count as an edit |
| `connectedBeforeVersions` | `device` | Makes the device one connected to this code before versions existed: it has the code, no last-seen version, and no record of unsynced changes. Follow it with `open` |
| `keepThisDevice` | `device`, `result`? | The student chooses "Keep this device" in the conflict prompt: the local data goes to the cloud, and the cloud's version becomes the backup. `result` defaults to `true`; `false` means it was refused, changing nothing |
| `keepCloud` | `device`, `result`? | The student chooses "Keep cloud" in the conflict prompt: the cloud's data replaces the local data, which becomes the backup. `result` as for `keepThisDevice` |
| `restoreBackup` | `device` | The student restores the previous version from the data menu: the two versions swap, and this counts as an edit |
| `expectDevice` | `device`, any of `connected`, `status`, `failure`, `version`, `unsynced`, `grades`, `selectedYear`, `name`, `conflict`, `conflictPrompt`, `backupGrades`, `readOnly`, `shownGrades` | Checks the device. Only the named fields are compared |
| `expectCloud` | `code`?, `exists`?, `version`?, `grades`?, `name`?, `division`?, `dataVersion`? | Checks the cloud through the load call |
| `createCall` | `fixture` | Calls `create_account` directly with the fixture's data, as any client could |
| `saveCall` | `code`?, `expectedVersion`, `grades`, `name`?, `dataVersion`?, `result` | Calls the version-checked save directly, sending `name` and `dataVersion` if given, and checks the fields named in `result`. This is how a scenario plays a newer client: without `dataVersion` the saved data has none, which means 1 |
| `deleteCall` | `code`?, `result` | Calls the delete directly. `result` is true if a row was removed, otherwise false |
| `parallelSaveCalls` | `expectedVersion`, `grades` (one list per call), `statuses` | Makes several saves at once, and checks their sorted statuses |
| `legacySave` | `code`?, `grades`, `name`?, `result` | Calls `save_data`, as an old cached website copy does |
| `legacyLoad` | `code`?, `grades` or `exists: false` | Calls `load_data`, as an old cached website copy does |

A `name` of `null` in `expectDevice` or `expectCloud` means there is none.

`status` is `idle`, `saving`, `saved` or `error`. `failure` says why a status is `error`: `conflict`,
`unknown_code`, `unreachable` or `newer_data`.

`conflict` is `null` when the student isn't being asked, otherwise `{ localGrades, cloudGrades,
localChangeKnown }`: each side's grade count, and whether the device knows when it last changed. The
cloud's last change is always known. `conflictPrompt` is `none`, `pending` or `showing`: `showing` when
`conflict` is set, and `pending` while a connected device has unsynced changes or no version yet, or
hasn't synced since it opened, unless the device is read-only, which is `none`. `backupGrades` is the backup's grades, or `null` if there is none.

## Read-only

A `dataVersion` of 999 stands for a format newer than any client supports, so these scenarios stay true
when the format is raised. A missing `dataVersion` means 1.

`readOnly` is `null`, or says what the device found in a newer format: `cloud`, `local` (already in its
own storage) or `file`. While it is set, the device writes nothing to its storage or the cloud: retries
and pushes stop, and `disconnect`, `deleteCloudData`, `connect`, `createCode` and the conflict choices are
refused. The app must also offer no edit, import, restore or reset, which no step checks because they are
screen behaviour. With `cloud`, it still checks the cloud on open, focus and reconnect, and carries on
normally once the cloud's data is readable again. With `file` or `local`, it makes no calls at all. `shownGrades` is the grades of the newer
cloud data on show, or `null`; the device's own data stays in `grades`, untouched.
