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
| `addGrade` | `device`, `value` | A student's edit: adds a grade to the subject the fixtures name |
| `saveDelayElapsed` | `device` | The save delay after an edit has passed, so the device syncs |
| `focus` | `device` | The student returned to the page or app, so the device syncs |
| `setOffline` | `device`, `offline` | Cuts the device off from the cloud, or lets it through again without it noticing |
| `reconnect` | `device` | The connection returned, so the device notices and syncs |
| `loseNextSaveAnswer` | `device` | The device's next save reaches the cloud, but the device doesn't get the answer and sees a failed call |
| `selectYear` | `device`, `year` | The student switches to another year. This must not count as an edit |
| `reconcile` | `device` | The device brings its stored data in line with its subject lists, as a new app version does. This must not count as an edit |
| `expectDevice` | `device`, any of `connected`, `status`, `failure`, `version`, `unsynced`, `grades`, `selectedYear` | Checks the device. Only the named fields are compared |
| `expectCloud` | `code`?, `exists`?, `version`?, `grades`? | Checks the cloud through the load call |
| `saveCall` | `code`?, `expectedVersion`, `grades`, `result` | Calls the version-checked save directly, and checks the fields named in `result` |
| `parallelSaveCalls` | `expectedVersion`, `grades` (one list per call), `statuses` | Makes several saves at once, and checks their sorted statuses |
| `legacySave` | `code`?, `grades`, `result` | Calls `save_data`, as an old cached website copy does |
| `legacyLoad` | `code`?, `grades` or `exists: false` | Calls `load_data`, as an old cached website copy does |

`status` is `idle`, `saving`, `saved` or `error`. `failure` says why a status is `error`: `conflict`,
`unknown_code`, `unreachable` or `no_version`.
