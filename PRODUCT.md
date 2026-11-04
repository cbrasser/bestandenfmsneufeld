# Product

<!-- impeccable:product-schema 1 -->

## Platform

web and Android. The website is the origin of the rules and data format; the native Android app mirrors them. There is no native iPhone app: iPhone students add the website to their home screen.

## Users

FMS and Gymnasium students at Gymnasium Neufeld (Bern) who track their own grades, mostly on a phone, and check after each new grade whether they will be promoted. Confirmed by the owner on 2026-10-14; the Gymnasium was added the same day.

Teachers and the school are not users. The Sportklasse (five-year Gymnasium) is not modelled.

## Product Purpose

A personal grade tracker that answers one question: am I passing this year? The student enters grades per subject and the app applies the official FMS promotion rules. Success means a student can see at a glance whether they pass, and which of the three conditions is at risk.

## Positioning

It applies the official promotion rules exactly, per school year: for the FMS the Fächer, Teilfächer and three conditions from "Promotionsbestimmungen FMS ab 24" (in year 3 per Berufsfeld); for the Gymnasium the two conditions from the school's "Auszug aus den Promotionsbestimmungen" with the subjects of its Lektionentafel and the student's own choices. A generic grade average app cannot say whether a student is promoted.

## Operating Context

- FMS: three school years. Years 1 and 2 have fixed subjects; year 3 depends on the Berufsfeld: Gesundheit, Soziale Arbeit or Pädagogik.
- Gymnasium: four school years (GYM1 to GYM4). The student chooses a Schwerpunktfach (from year 1), a third language, Bildnerisches Gestalten or Musik, and an Ergänzungsfach (chosen at the end of year 2, graded in years 3 and 4). Which Grundlagenfächer are graded in which year follows Gymnasium Neufeld's Lektionentafel (Lehrplan 17, from 2022/23); the canton leaves that split to each school. There is no promotion at the end of the last year.
- Grades run from 1 to 6, 4 is sufficient. A subject's grade is rounded to a half; a Fach made of Teilfächer is the rounded mean of its rounded Teilfach grades.
- FMS promotion needs all three: average of the Fach grades at least 4.0; sum of how far Fach grades are below 4 at most 2; at most three grades under 4, counted per Teilfach.
- Gymnasium promotion needs both: twice the sum of how far grades are below 4 no larger than the sum of how far they are above 4; at most four grades under 4. Each Schwerpunktfach has one grade (owner's decision, 2026-10-14).
- The interface exists in German (default, Swiss style without ß), French, English and Italian.
- A personal project, free to use. The result is unofficial and the app says so.

## Capabilities and Constraints

- Grades per subject with weight, optional label, date and semester, plus an oral-grade adjustment applied before rounding.
- Promotion status with the three conditions, per year.
- Statistics per year: grade per subject, development over time, profile, distribution, summary.
- Data lives on the device (localStorage on the website, app-private storage in the app). Export and import as JSON, in the same format on both. Optional anonymous cloud sync by access code (Supabase), with no name or email stored; names stay on each device, and students can delete their cloud data.
- Sync never overwrites newer data silently: when both sides really changed, the student chooses, and the discarded version can be restored once per device.
- Importing asks first, and the replaced data can be restored. Data or a file from a newer version is only shown, with a request to update, and is never written back, because an outdated version would drop subjects it doesn't know.
- A native Android app (Android 8 or newer, Kotlin and Compose) does what the website does, fully offline. It comes from the public release repo `cbrasser/bestanden-releases`, by hand or through Obtainium, and is not in the Play Store.
- A shareable guide at `/#app`, also in the menu, covers the Android install, code setup, and adding the website to an iPhone home screen. Export and import is the one-time alternative.
- Installable as a PWA, named Bestanden.
- Two addresses: `bestandenfms.cbradev.ch` is primary; `bestandenfmsneufeld.vercel.app` stays live without a redirect, because its browser storage is separate.
- Stack: Vite, React, TypeScript, Tailwind; deployed on Vercel.
- Not included: the non-promotion subjects, the FMS-Ausweis and exam grades, and a native iPhone app.

## Brand Commitments

- The site uses the same design system as the owner's other sites, yaft and wgly (owner's decision, 2026-10-14). yaft's record at `/Users/cbradev/code/yaft/DESIGN.md` is the parent.
- Each school year has its own page hue.
- A dark theme exists and stays (owner's decision, 2026-10-14). It is this project's own extension of the shared system.
- Red marks failing grades and failed conditions. Passing is shown in ink; there is no green.

## Evidence on Hand

- The official document "FMS 21+ / Promotionsbestimmungen, Fächer, Teilfächer" (2021.BKD.19263/859597) is the source for FMS subjects and rules.
- Gymnasium Neufeld's "Auszug aus den Promotionsbestimmungen" (July 2023), its Lektionentafel (Lehrplan 17, from 2022/23) and its Wegleitung 2025/26 are the sources for the Gymnasium.

## Product Principles

- The verdict comes first: whether the student passes is the first thing on the page.
- Follow the official rules to the letter, and say plainly that the result is unofficial.
- The student's data is theirs: local first, no account, export always at hand.
- Built for a phone, used in passing.
