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
| `createCode` | `device` | Creates a code from the device's local data. Later steps use this code by default |
| `connect` | `device`, `code`?, `result`? | Connects with a code. `result` defaults to `connected`, otherwise `unknown_code` |
| `enterName` | `device`, `name` | The student enters a name on this device. Doesn't count as a change the cloud needs |
| `deleteCloudData` | `device`, `result`? | The student deletes the cloud data. `result` defaults to `deleted`, otherwise `unreachable`, or `out_of_step` when the cloud holds data the device never received. That is refused, and the device syncs instead |
| `addGrade` | `device`, `value` | A student's edit: adds a grade to the subject the fixtures name |
| `saveDelayElapsed` | `device` | The save delay after an edit has passed, so the device syncs |
| `focus` | `device` | The student returned to the page or app, so the device syncs |
| `setOffline` | `device`, `offline` | Cuts the device off from the cloud, or lets it through again without it noticing |
| `reconnect` | `device` | The connection returned, so the device notices and syncs |
| `loseNextSaveAnswer` | `device` | The device's next save reaches the cloud, but the device doesn't get the answer and sees a failed call |
| `selectYear` | `device`, `year` | The student switches to another year. This must not count as an edit |
| `reconcile` | `device` | The device brings its stored data in line with its subject lists, as a new app version does. This must not count as an edit |
| `connectedBeforeVersions` | `device` | Makes the device one connected to this code before versions existed: it has the code, no last-seen version, and no record of unsynced changes. Follow it with `open` |
| `keepThisDevice` | `device` | The student chooses "Keep this device" in the conflict prompt: the local data goes to the cloud, and the cloud's version becomes the backup |
| `keepCloud` | `device` | The student chooses "Keep cloud" in the conflict prompt: the cloud's data replaces the local data, which becomes the backup |
| `restoreBackup` | `device` | The student restores the previous version from the data menu: the two versions swap, and this counts as an edit |
| `expectDevice` | `device`, any of `connected`, `status`, `failure`, `version`, `unsynced`, `grades`, `selectedYear`, `name`, `conflict`, `conflictPrompt`, `backupGrades` | Checks the device. Only the named fields are compared |
| `expectCloud` | `code`?, `exists`?, `version`?, `grades`?, `name`?, `division`? | Checks the cloud through the load call |
| `createCall` | `fixture` | Calls `create_account` directly with the fixture's data, as any client could |
| `saveCall` | `code`?, `expectedVersion`, `grades`, `name`?, `result` | Calls the version-checked save directly, sending `name` if given, and checks the fields named in `result` |
| `deleteCall` | `code`?, `result` | Calls the delete directly. `result` is true if a row was removed, otherwise false |
| `parallelSaveCalls` | `expectedVersion`, `grades` (one list per call), `statuses` | Makes several saves at once, and checks their sorted statuses |
| `legacySave` | `code`?, `grades`, `name`?, `result` | Calls `save_data`, as an old cached website copy does |
| `legacyLoad` | `code`?, `grades` or `exists: false` | Calls `load_data`, as an old cached website copy does |

A `name` of `null` in `expectDevice` or `expectCloud` means there is none.

`status` is `idle`, `saving`, `saved` or `error`. `failure` says why a status is `error`: `conflict`,
`unknown_code` or `unreachable`.

`conflict` is `null` when the student isn't being asked, otherwise `{ localGrades, cloudGrades,
localChangeKnown }`: each side's grade count, and whether the device knows when it last changed. The
cloud's last change is always known. `conflictPrompt` is `none`, `pending` or `showing`: `showing` when
`conflict` is set, and `pending` while a connected device has unsynced changes or no version yet, or
hasn't synced since it opened. `backupGrades` is the backup's grades, or `null` if there is none.
