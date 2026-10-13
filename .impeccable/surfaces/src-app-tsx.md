---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# Surface: the grade tracker (src/App.tsx)

Mode: Operate. A student opens it on a phone after a new grade, enters it, and reads whether they still pass.

Constraints: all existing functions stay (grades, oral adjustment, statistics, import/export, cloud sync, four languages, light and dark). The visual world is pinned by the owner: yaft's design system, as wgly uses it. Build path: code-led (no image generation here).

## Direction contract

THESIS: The verdict is the page title. "Bestanden" or "Nicht bestanden" stands in the display face on the year's hue, and the three promotion conditions are drawn as meters against their limits. Refused: a neutral dashboard with a status card and green/red numbers.

OWN-WORLD: yaft's tabbed manual. One full-strength hue per school year as the page ground (marigold, teal, lilac); opaque paper leaves with 2px ink outlines and hard ink shadows; Bricolage Grotesque 800 names things, Manrope says and counts them in tabular figures; red only for failing. The three years are divider tabs joined to the first leaf. Dark theme: ink and paper swap, the hue deepens into the ground and stays full strength in fills.

STORY: The student sees the verdict, sees which condition is close to its limit, then adds a grade to a subject and watches the verdict hold or change.

FIRST VIEWPORT: App bar on the hue (wordmark tile left, menu button right). Display title with the verdict, then a line with year, name and division. Under it the year tabs, the selected one in paper and joined to the conditions leaf: three rows, each a label, its limit, a drawn meter and the figure. The first subject leaves begin below. On phones the Subjects/Statistics switch is docked at the bottom.

FORM: Pinned by the owner (existing design system); no concept roll. Seed key: none (pinned direction).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
