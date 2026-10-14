---
name: Noten-Tracker (bestandenfmsneufeld)
description: A grade tracker for FMS students. yaft's design language, one full-strength hue per school year, the verdict as the page title.
colors:
  ink: "#15161a"
  ink-2: "#3a3d46"
  ink-3: "#5c606b"
  paper: "#ffffff"
  ground: "#e6eaef"
  ground-wash: "#f3f5f8"
  ground-tint: "#dde3ea"
  ink-hover: "#2c2e36"
  hairline: "rgb(21 22 26 / 0.12)"
  on-hue: "#15161a"
  danger: "#c8262b"
  danger-tint: "#ffe3e1"
  year-1: "#ffc93c"
  year-2: "#2ec4b6"
  year-3: "#b49af8"
  year-4: "#ff8cc3"
  dark-ink: "#f1f2f5"
  dark-ink-2: "#c3c7d0"
  dark-ink-3: "#9a9eaa"
  dark-paper: "#1c1e24"
  dark-ground: "#101115"
  dark-ground-wash: "#262931"
  dark-ground-tint: "#343843"
  dark-danger: "#ff8a8c"
  dark-danger-tint: "#47191c"
typography:
  display:
    fontFamily: "Bricolage Grotesque Variable, Avenir Next, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 2rem + 3.2vw, 4.75rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Bricolage Grotesque Variable, Avenir Next, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Bricolage Grotesque Variable, Avenir Next, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Manrope Variable, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
    fontFeature: "\"ss01\", \"tnum\""
  label:
    fontFamily: "Manrope Variable, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.2
  caption:
    fontFamily: "Manrope Variable, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.01em"
  number:
    fontFamily: "Manrope Variable, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  number-large:
    fontFamily: "Manrope Variable, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
rounded:
  leaf: "14px"
  tab: "12px"
  control: "10px"
  bar: "8px"
  pill: "999px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "24px"
  s-6: "32px"
  s-7: "48px"
  s-8: "64px"
  tap: "44px"
  dock: "56px"
  gutter: "clamp(16px, 3vw, 40px)"
components:
  leaf:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.leaf}"
    padding: "24px"
  button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    height: "44px"
  button-quiet:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  segmented-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 10px"
    height: "26px"
  year-tab:
    backgroundColor: "{colors.year-1}"
    textColor: "{colors.on-hue}"
    typography: "{typography.label}"
    rounded: "{rounded.tab}"
    padding: "8px 16px 10px"
    height: "44px"
  year-tab-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  meter:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    height: "14px"
  slot:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.bar}"
    height: "14px"
  picker-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "64px"
  dock-item:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    height: "56px"
---

# Design System: Noten-Tracker

## Overview

**Creative North Star: "The school year as a section of the manual"**

This project speaks yaft's design language. That is the owner's decision (2026-10-14), and yaft's record at `/Users/cbradev/code/yaft/DESIGN.md` is the parent of this one; wgly (`/Users/cbradev/code/shared-flat-app/DESIGN.md`) is its sibling. Content sits on opaque paper leaves with 2px ink outlines and short, hard ink shadows. Bricolage Grotesque names things, Manrope says and counts them. Each school year owns one full-strength hue, and that hue is the page.

What this project adds is its own signature. The verdict is the page title: "Bestanden", "Nicht bestanden" or "Noch keine Noten" stands in the display face on the year's hue. Under it the three years are divider tabs joined to one leaf, and that leaf draws the three promotion conditions as meters against their limits. The refused alternative is a neutral dashboard with a status card and green and red numbers.

Every token lives in `src/index.css`. Components use the classes defined there; Tailwind is kept for layout utilities only, and `tailwind.config.js` names the tokens without holding values.

Where this project departs from yaft:
- **Years, not categories.** `data-year` on `<html>` binds `--hue` (yaft uses `data-category`). Three hues.
- **The tabs switch years.** The tab rail survives as three year tabs on top of the conditions leaf; they are not sized by duration.
- **A dark theme exists** (owner's decision). yaft and wgly are light only.
- **Four languages**, German first. Layouts hold the longer German and French strings.
- **No hatching, no map, no numbers sheet.** Label and value rows are used for the statistics summary only.

## Colors

### Primary
The year hues, taken from yaft's category hues. Each is the page ground of its year, the fill of the average meter, the checked direction card and the radar shape in the statistics.
- **Year 1 Marigold** (`year-1`, #ffc93c).
- **Year 2 Lagoon Teal** (`year-2`, #2ec4b6).
- **Year 3 Lilac** (`year-3`, #b49af8).
- **Year 4 Flamingo** (`year-4`, #ff8cc3): the Gymnasium's fourth year only.

Two tints are derived wherever `data-year` is set: **wash** (14% hue in paper) for hover fills and note boxes, **tint** (30%) in reserve. Without a year (onboarding, loading) the page is Fog Ground and Pale Wash stands in.

### Neutral
Ink, Slate Ink, Muted Slate, Paper, Fog Ground, Pale Wash, Pale Tint, Ink Hover and Hairline, as in yaft. **On-hue** (#15161a) is this project's addition: the text colour on a full-strength hue, the same in both themes.

### Tertiary
- **Signal Red** (`danger`): a Fach or Teilfach grade under 4, a failed condition (its figure, icon and meter fill), an invalid input and an error box.
- **Blush** (`danger-tint`): the ground of an error box.

### Dark theme
Ink and paper swap: ink becomes #f1f2f5 and paper #1c1e24, so outlines, shadows and the primary button turn light. The page ground is the year's hue mixed 24% into the dark ground, so the year is still recognisable and light text holds its contrast. Wherever the hue is a fill (tabs, the average meter, a checked card, the radar shape) it stays full strength and carries On-hue text. Signal Red lightens to #ff8a8c.

### Named Rules
**The Hue Is The Page Rule.** A year hue is a ground or a fill, never text and never a thin accent on paper. On the hue ground text is Ink only.

**The Always Named Rule.** Colour never carries a year alone: each tab and the line under the title say "Jahr 1", "Jahr 2" or "Jahr 3".

**The Red Means Failing Rule.** Red marks a grade under 4, a failed condition or an error. Passing is ink; there is no green. A failed condition also changes its icon from a check to a cross, and the title says "Nicht bestanden". Destructive buttons (delete a grade, reset) are plain ink buttons.

## Typography

**Display Font:** Bricolage Grotesque (variable, self-hosted via Fontsource), 800 used.
**Body Font:** Manrope (variable, self-hosted via Fontsource), 500 to 800. Stylistic set 01 and tabular figures are on for the whole page.

### Hierarchy
- **Display** (Bricolage 800, fluid 2.5 to 4.75rem, 0.95): the verdict, one per page. Long words may break anywhere.
- **Headline** (Bricolage 800, 1.75rem): "Fächer" and "Statistiken" on the hue.
- **Title** (Bricolage 800, 1.375rem): leaf and dialog titles; a subject's name is 1.25rem.
- **Body** (Manrope 500, 1rem). Ledes are 600 in Slate Ink, max 62ch.
- **Label** (Manrope 700, 0.875rem): buttons, tabs, segments. At 800 over a 2px ink rule it is a group title; a Teilfach's name is the same at 1rem.
- **Caption** (Manrope 700, 0.75rem): field labels, "Endnote", dates, chart ticks. Hints are 600 in Muted Slate. Sentence case, never uppercase.
- **Number** (Manrope 800, 1.125rem, tabular): single grades, a Teilfach's grade, the figures of the three conditions.
- **Number large** (Manrope 800, 1.75rem, tabular): a Fach's final grade.

### Named Rules
**The Two Voices Rule.** Bricolage names things; Manrope says and counts them. Numbers never use the display face.

**The Tabular Rule.** Every number is tabular.

## Layout

A centred page (max 1180px) with yaft's fluid gutter and 4px spacing scale. The app bar (wordmark tile, menu button) and the page head (title, then year, direction, name and division separated by ink dots) sit on the hue.

- **Below 960px:** one column: year tabs and the conditions leaf, then the subjects or the statistics.
- **From 960px:** a 360px side column (tabs, conditions, in year 3 the direction picker) that stays 16px from the top, beside the main column. Subject and statistics leaves fill the main column in columns of at least 340px, each as tall as its content.
- **Subjects / Statistics:** a segmented control at the right of the page head from 700px; below that a dock on the bottom edge, 56px tall, with the same two items.

Leaves pad 24px (16px under 600px) and stand 24px apart. Every tap target is at least 44px; 36px buttons are the edit and delete icons in a grade row on wide screens and the calendar's arrows.

**The Longer German Rule** (from wgly) holds: buttons never wrap, rows do. Subject names break after a slash and hyphenate in the document's language.

## Elevation & Depth

As in yaft: depth is drawn. Small (2px) ink shadows on controls, medium (4px) on leaves, large (6px) on dialogs. Divider tabs cast up and to the right (`3px -3px 0`). Controls press into their shadow over 120ms. No blurred shadows, no gradients, no translucent surfaces except the scrim behind a dialog or the menu.

## Shapes

Leaves 14px, controls 10px, tabs 12px on their top corners only, bars 8px, chips and meter tracks are pills. Every outline is 2px ink; only row dividers are 1px hairlines. The focus ring is a 3px ink outline offset 2px.

## Components

### Year tabs (signature)
Three tabs above the conditions leaf, inset 16px from its left edge. An unselected tab is filled with its own year's hue, sits 6px low so the leaf covers its foot, and slides up 4px on hover over 200ms. The selected tab is paper, has no shadow and covers the leaf's outline, so tab and leaf read as one sheet. Switching year changes the page hue over 320ms.

### Promotion conditions (signature)
One leaf of three rows separated by hairlines. Each row has a check, cross or dash icon, the label (700), a Muted Slate note with the limit, the figure in number type on the right and a drawing underneath:
- **Grades under 4:** one outlined slot per allowed failure, filled ink for each one used.
- **Average:** a pill track from 1 to 6 filled with the year's hue up to the average, and a 2px ink mark at the minimum.
- **Deficit:** a pill track from 0 to the maximum, filled ink.
- **Ausgleich** (Gymnasium, instead of average and deficit): two tracks on one shared scale, the plus points in the year's hue and twice the minus points in ink, each with its figure, so the longer bar shows which side wins.

The Gymnasium has four slots for grades under 4. In its last year a footnote under a hairline says that no promotion follows.

A failed condition turns its figure, icon and fill red. Without grades the average shows a dash and an empty track.

### Subject leaf
Head row: the subject's name, "Endnote" over the final grade (red under 4), and a 44px square add button. Then one row per grade: the grade, its label over its date, the weight ("×2") and a semester chip. On wide screens the row ends in quiet edit and delete icon buttons; on phones the row is swiped left to show them. Last, the oral adjustment: label and hint on the left, a 96px right-aligned input on the right. A subject without grades says so in Muted Slate.

A Fach made of Teilfächer is one leaf. Each Teilfach is a titled group inside it, its name in 800 over a 2px ink rule with its own grade and add button, never a card in a card.

### Subject choices (Gymnasium)
A leaf titled "Deine Fächerwahl" in the side column with four native selects: Schwerpunktfach, third language, Bildnerisches Gestalten or Musik, Ergänzungsfach (with a hint that it counts from year 3). With a language Schwerpunktfach the third-language select is disabled and shows that language. Until the choices are made, a Slate Ink line asks for them. A Schwerpunktfach or Ergänzungsfach leaf carries a chip with that word under its name.

### Picker cards
Outlined cards with a round swatch, a name in 800 and a line under it. The checked card fills with the hue, lifts 2px onto a medium shadow and its swatch turns ink. Used for the year 3 direction and for the division in onboarding (where a disabled card is drawn in Muted Slate with an "In Arbeit" chip).

### Dialogs
A leaf up to 460px wide with a large shadow on a scrim: title, quiet close button, fields in pairs that stack when narrow, then a quiet Cancel and one primary Save at the right. The date field is a button that reads like an input and opens a calendar in a small outlined popover; the selected day is ink, today is outlined.

### Menu
A paper panel from the right edge (380px, at most 90% of the width) with a 2px ink line on its left, sliding in over 320ms. Groups are titled in 800 over an ink rule: theme (a three-part segmented control), language (a native select), cloud sync, data. The access code is set in Manrope 800 spaced 0.14em, not in a monospace face.

### Statistics
Paper leaves with Bricolage titles. Charts are drawn in ink from the tokens: outlined bars (ink, red under 4), a dashed ink line at 4, a 2.5px ink line with paper dots for the development over time, the year's hue with an ink outline for the profile. Grid lines are hairlines; ticks are caption type in Slate Ink. The summary is label and value rows.

### Footer
A band in Fog Ground under a 2px ink rule: the storage notice in a paper box with a small export button, the disclaimer in Slate Ink, then copyright and contact.

### Icon
A check mark in ink on the year 1 marigold, in a rounded tile with a 4px ink outline (`public/icon.svg`).

## Do's and Don'ts

### Do:
- **Do** keep the verdict as the display title of the page.
- **Do** put content on opaque paper leaves with a 2px ink outline and a 4px hard ink shadow.
- **Do** use Ink text on the hue ground and On-hue text on a full-strength hue fill.
- **Do** set every number in Manrope with tabular figures.
- **Do** define colours as tokens in `src/index.css` and redefine them under `.dark`.
- **Do** keep motion quick: 120ms presses, 200ms tabs, 320ms for the page hue, the meters and the menu; reduced motion removes all of it.

### Don't:
- **Don't** use green for passing, or red for anything that is not failing or an error.
- **Don't** use a year hue as text colour or as a thin accent on paper.
- **Don't** use blurred or coloured shadows (the red shadow on an invalid input is the only coloured one).
- **Don't** nest a card in a card; a Teilfach is a titled group.
- **Don't** use uppercase labels, eyebrow text over headings, or monospace type.
- **Don't** write a hex value into a component.
