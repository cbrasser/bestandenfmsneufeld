# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

FMS students at Gymnasium Neufeld (Bern) who track their own grades, mostly on a phone, and check after each new grade whether they will be promoted. Confirmed by the owner on 2026-10-14.

Teachers and the school are not users. Gymnasium students are not served yet: the division exists in onboarding but is marked "under construction".

## Product Purpose

A personal grade tracker that answers one question: am I passing this year? The student enters grades per subject and the app applies the official FMS promotion rules. Success means a student can see at a glance whether they pass, and which of the three conditions is at risk.

## Positioning

It applies the canton's promotion rules for the FMS exactly (Fächer, Teilfächer and the three conditions from "Promotionsbestimmungen FMS ab 24"), per school year and, in year 3, per Berufsfeld. A generic grade average app cannot say whether a student is promoted.

## Operating Context

- Three school years. Years 1 and 2 have fixed subjects; year 3 depends on the Berufsfeld: Gesundheit, Soziale Arbeit or Pädagogik.
- Grades run from 1 to 6, 4 is sufficient. A subject's grade is rounded to a half; a Fach made of Teilfächer is the rounded mean of its rounded Teilfach grades.
- Promotion needs all three: average of the Fach grades at least 4.0; sum of how far Fach grades are below 4 at most 2; at most three grades under 4, counted per Teilfach.
- The interface exists in German (default, Swiss style without ß), French, English and Italian.
- A personal project, free to use. The result is unofficial and the app says so.

## Capabilities and Constraints

- Grades per subject with weight, optional label, date and semester, plus an oral-grade adjustment applied before rounding.
- Promotion status with the three conditions, per year.
- Statistics per year: grade per subject, development over time, profile, distribution, summary.
- Data lives in the browser (localStorage). Export and import as JSON. Optional anonymous cloud sync by access code (Supabase), with no name or email stored.
- Installable as a PWA.
- Stack: Vite, React, TypeScript, Tailwind; deployed on Vercel.
- Not included: the non-promotion subjects, and the FMS-Ausweis and exam grades.

## Brand Commitments

- The site uses the same design system as the owner's other sites, yaft and wgly (owner's decision, 2026-10-14). yaft's record at `/Users/cbradev/code/yaft/DESIGN.md` is the parent.
- Each school year has its own page hue.
- A dark theme exists and stays (owner's decision, 2026-10-14). It is this project's own extension of the shared system.
- Red marks failing grades and failed conditions. Passing is shown in ink; there is no green.

## Evidence on Hand

- The official document "FMS 21+ / Promotionsbestimmungen, Fächer, Teilfächer" (2021.BKD.19263/859597) is the source for subjects and rules.

## Product Principles

- The verdict comes first: whether the student passes is the first thing on the page.
- Follow the official rules to the letter, and say plainly that the result is unofficial.
- The student's data is theirs: local first, no account, export always at hand.
- Built for a phone, used in passing.
