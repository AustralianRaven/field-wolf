---
name: FieldWolf
description: Name the plant or animal in your photo, on your own device, read like a field guide plate.
colors:
  shell: "#2b1747"
  shell-ink: "#f3eefa"
  shell-muted: "#c3b7d8"
  violet: "#6b3fa0"
  violet-strong: "#57308a"
  violet-soft: "#ece6f5"
  lime: "#c6e03a"
  lime-ink: "#1c1726"
  ground: "#f6f5fa"
  plate: "#ffffff"
  ink: "#1c1726"
  muted: "#5e5770"
  line: "#dedae8"
  line-strong: "#c9c3d8"
  empty: "#e3dfec"
  warn-bg: "#fff6d6"
  warn-line: "#e5c55a"
  warn-ink: "#5a4400"
  bad: "#a3253a"
typography:
  display:
    fontFamily: "'Source Serif 4 Variable', 'Source Serif 4', Georgia, serif"
    fontSize: "clamp(32px, 4.6vw, 56px)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Source Serif 4 Variable', 'Source Serif 4', Georgia, serif"
    fontSize: "clamp(30px, 2.9vw, 42px)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Source Serif 4 Variable', 'Source Serif 4', Georgia, serif"
    fontSize: "clamp(28px, 3.4vw, 40px)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  scientific:
    fontFamily: "'Source Serif 4 Variable', 'Source Serif 4', Georgia, serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.5
  tool-title:
    fontFamily: "'Public Sans', system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "'Public Sans', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'tnum'"
  button:
    fontFamily: "'Public Sans', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.5
  label:
    fontFamily: "'Public Sans', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "20px"
    letterSpacing: "0.08em"
rounded:
  plate: "0px"
  control: "6px"
  round: "50%"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  xxl: "32px"
  section: "56px"
  gutter: "clamp(16px, 3.4vw, 48px)"
components:
  button-primary:
    backgroundColor: "{colors.violet}"
    textColor: "{colors.plate}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.violet-strong}"
    textColor: "{colors.plate}"
  button-secondary:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.violet}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.violet-soft}"
    textColor: "{colors.violet-strong}"
  button-ghost:
    textColor: "{colors.violet}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.violet-soft}"
  select:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 36px 0 12px"
    height: "40px"
  input-search:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "40px"
  plate:
    backgroundColor: "{colors.plate}"
    rounded: "{rounded.plate}"
    padding: "16px"
  chip-confident:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.lime-ink}"
    padding: "2px 8px"
  chip-hedged:
    backgroundColor: "{colors.empty}"
    textColor: "{colors.ink}"
    padding: "2px 8px"
  shell-bar:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-ink}"
    height: "60px"
  tool-bar:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    height: "68px"
---

# Design System: FieldWolf

## Overview

**Creative North Star: "The Field Guide Plate"**

Every answer reads like a plate in a printed field guide: the visitor's own photo is the plate, framed in white on a cool lavender ground, and the species name faces it across the gutter. A deep violet shell bar holds the brand and the Flora/Fauna halves; below it, the work happens on white plates and ruled columns, the way a guide sets a figure against its text. The world refuses the category default of a drop zone and a rounded result card with a progress bar.

Proof sits beside the claim. The area the model analysed is marked in chartreuse on the photo, repeated as a crop thumbnail beside the name, and joined to it by chartreuse leader lines that draw in when a result lands. Confidence is a fixed five-step ramp, never a free-floating colour. Names carry the serif voice (common name upright, scientific name italic); everything that operates speaks in a plain grotesque. Density is calm: one plate, one facing column, generous gutters.

**Key Characteristics:**
- Photo as plate, name on the facing column, joined by leader lines.
- Deep violet shell, violet controls, chartreuse as the marking colour.
- Source Serif 4 for names, Public Sans for UI; tabular figures throughout.
- Square plates, 6px controls, hairline lavender rules, a 2px ink rule heading each data column.
- One soft plate shadow; depth is otherwise tonal.

## Colors

A violet night-and-day palette on cool lavender paper, with one acid chartreuse used as a marker.

### Primary
- **Field Violet** (violet): the operating colour. Primary button fill, secondary button stroke and text, links, filled confidence steps, the download progress fill, the Fauna art panel, the species-list switch.
- **Pressed Violet** (violet-strong): hover and pressed state of every violet control and link.
- **Violet Wash** (violet-soft): hover fill for secondary and ghost buttons, the drop zone and family rows.

### Secondary
- **Night Shell** (shell): the 60px top bar, the Flora art panel, the dialog backdrop tint, and the outer ring of the focus indicator.
- **Shell Ink** (shell-ink) and **Shell Mist** (shell-muted): active and resting text on the shell bar.

### Tertiary
- **Marker Chartreuse** (lime): the selection box and its handles on the photo, the crop thumbnail frame, leader lines and their end dots, the active tab underline, the Confident chip, the "model ready" dot, the home guide-card arrow disc and kingdom glyphs, the focus ring, and text selection. Text on it is always **Lime Ink** (lime-ink).

### Neutral
- **Lavender Ground** (ground): the page.
- **Plate White** (plate): plates, the tool bar, inputs, the dialog.
- **Ink** (ink): text, and the 2px rule that heads a data column.
- **Field Grey** (muted): secondary text, captions, runner-up figures, labels.
- **Hairline** (line): plate borders, row dividers, the tool bar's bottom edge.
- **Strong Hairline** (line-strong): input and select strokes, the dashed empty-plate border, the scrollbar thumb.
- **Unfilled** (empty): empty confidence steps, the hedged chip, the progress track, the spinner track.
- **Notice** (warn-bg, warn-line, warn-ink): the set-up-the-model banner and dialog border only.
- **Fault** (bad): error headings and messages.

### Named Rules
**The Marker Rule.** Chartreuse marks what was analysed and what is live: strokes, handles, dots, a chip, a small disc. It is never body text on a light ground and never fills a field larger than a 40px disc or a glyph. On a photo it always carries an ink keyline so it holds on any image.

**The Five Steps Rule.** Confidence is five fixed violet steps with the percent beside it and a chip after. Never a continuous bar, a gradient, or a traffic-light colour scale.

## Typography

**Display Font:** Source Serif 4 Variable (with Source Serif 4, Georgia)
**Body Font:** Public Sans (with system-ui)

**Character:** A bookish optical-size serif names things, the way a guide sets its species headings; a sober civic grotesque does every job that operates. Figures are tabular everywhere so percents and counts line up.

### Hierarchy
- **Display** (600, clamp(32px, 4.6vw, 56px), 1.05, -0.02em): the home page statement only. Guide-card titles (Flora, Fauna) use the same face at clamp(40px, 4.4vw, 64px), line-height 1.
- **Headline** (600, clamp(30px, 2.9vw, 42px), 1.08): the species name on the facing column. The empty-state question uses the same voice at clamp(28px, 2.8vw, 40px).
- **Title** (600, clamp(28px, 3.4vw, 40px)): page titles on Setup and Species list (Species list runs to 44px).
- **Scientific** (italic 400, 20px under the headline; 15px in runner-up rows and lists): binomials and genus names, always italic.
- **Tool title** (Public Sans 600, 18px): the identify page's tool-bar heading.
- **Body** (Public Sans 400, 15px, 1.5): running text; lead paragraphs at 17px; intros capped at 60 to 70ch.
- **Button** (Public Sans 600, 14px; 16px on the large Setup action).
- **Label** (Public Sans 600, 12px, 0.08em, uppercase): the taxonomy guide-word run only. Figure captions use 11px, 0.06em, uppercase.

### Named Rules
**The Two Voices Rule.** The serif is for names: species, kingdoms, page titles and the plate numeral. Controls, labels, counts and messages stay in Public Sans.

**The Guide-Word Rule.** The only tracked uppercase line is the taxonomy run (Class › Order › Family › Genus), which carries data; the genus ends it in serif italic, sentence case. Don't add uppercase labels above headings.

## Layout

A centred page capped at 1440px with a fluid gutter (clamp(16px, 3.4vw, 48px)). On the identify page a 60px shell bar sits over a 68px white tool bar (page title, Region, Change photo, Clear or Add a box), then the work area: the photo plate on the left (1.12fr) and the facing column on the right (min 320px, 1fr), with a clamp(24px, 4.4vw, 64px) gutter the leader lines cross. Below 900px the columns stack and the leader lines are not drawn; below 600px the tool bar becomes a grid and the action buttons share the row. The shell bar wraps its tabs to a full-width scrolling row below 760px.

Home and setup inherit the plate: home is a statement plus two guide cards side by side (one column below 820px), each a shell or violet art panel beside a white caption; setup is one plate up to 720px wide. The spacing rhythm is 4, 8, 12, 16, 20, 24, 32, with 56px closing a page.

## Elevation & Depth

Mostly flat and tonal: white plates on a lavender ground, divided by hairlines. One soft plate shadow lifts the photo plate, the setup plate and the guide cards; guide cards lift a further 2px on hover with a deeper shadow. The set-up dialog carries the only heavy shadow, over a translucent shell backdrop. Inside the photo, the selection box dims everything outside it with a wide ink veil rather than adding depth.

### Shadow Vocabulary
- **Plate** (`box-shadow: 0 1px 2px rgb(28 23 38 / 6%), 0 8px 24px -12px rgb(43 23 71 / 18%)`): every plate at rest.
- **Plate lifted** (`box-shadow: 0 2px 4px rgb(28 23 38 / 8%), 0 18px 40px -18px rgb(43 23 71 / 35%)`): a linked plate (home guide card) on hover, with translateY(-2px).
- **Dialog** (`box-shadow: 0 24px 60px -20px rgb(28 23 38 / 45%)`): the modal notice only.
- **Selection veil** (`box-shadow: 0 0 0 1px rgb(28 23 38 / 55%), inset 0 0 0 1px rgb(28 23 38 / 35%), 0 0 0 9999px rgb(28 23 38 / 28%)`): the chartreuse box on the photo.

### Named Rules
**The One Lift Rule.** Plates share one resting shadow. Only a plate that is itself a link lifts on hover.

## Shapes

Plates are square (0px): photo plate, guide cards, setup plate, crop thumbnail, confidence steps and the progress track. Controls take a gentle 6px corner: buttons, selects, the search input, the species-list switch, banners and the dialog. Circles are reserved for status dots, the spinner, the home arrow disc and leader-line ends. Rules do the structural work: 1px hairlines between rows and around plates, a 2px ink rule heading the taxonomy run, the species bar and the setup facts.

## Components

### Buttons
One family, three weights; confident and plain.
- **Shape:** gently curved corners (6px), 40px tall, 16px side padding, 600 weight at 14px.
- **Primary:** Field Violet fill, white text. The one main action per view (Go to setup, Download the ID model).
- **Hover / Focus:** fill deepens to Pressed Violet over 160ms on the shared ease-out; focus is a 3px chartreuse outline with a 5px shell ring outside it.
- **Secondary:** white fill, 1px violet stroke, violet text; hover adds the violet wash (Change photo).
- **Ghost:** violet text, no fill; hover adds the violet wash (Clear box, Not now).
- **Disabled:** 55% opacity, not-allowed cursor.

### Chips
- **Style:** 12px bold, 2px 8px padding, small corner.
- **State:** Confident is chartreuse with lime ink; Likely genus, Likely family and Not sure sit on the Unfilled tone with ink text.

### Cards / Containers
- **Corner Style:** square (0px).
- **Background:** Plate White on Lavender Ground.
- **Shadow Strategy:** the Plate shadow (see Elevation & Depth).
- **Border:** 1px Hairline.
- **Internal Padding:** 16px on the photo plate; clamp(20px, 4vw, 40px) on the setup plate.

### Inputs / Fields
- **Style:** white fill, 1px Strong Hairline stroke, 6px corner, 40px tall; selects carry an ink caret 14px from the right.
- **Focus:** the global chartreuse-and-shell focus ring; selects shift their stroke to violet on hover.
- **Error / Disabled:** errors are Fault-coloured text beside the control; no red strokes.

### Navigation
The shell bar: logo and wordmark (white, 700, 18px) left, tabs centre-left, model status right. Tabs are Public Sans 500 in Shell Mist with a drawn kingdom glyph; hover turns them white; the active tab is white with a 3px chartreuse underline flush to the bar's bottom edge. The status shows a chartreuse dot with its text, or a link to set up the model. On narrow screens the tabs drop to their own scrolling row and the status text hides.

### Photo Plate (signature)
The visitor's photo on a pale lavender mat inside a white plate, captioned "Plate 1 · your photo" with the analysis state on the right. Dragging draws a chartreuse box with ink keylines, two square handles and the selection veil; keyboard users press B, then arrows and Shift+arrows. With no photo, the plate holds a dashed Strong Hairline drop area on the ground tone that washes violet on hover or drag.

### Facing Column (signature)
Top to bottom: the taxonomy guide-word run over a 2px ink rule; the serif numeral 1, a 112px crop of the analysed area framed in chartreuse with an ink outline and an uppercase caption, then the common name (headline), the scientific name (italic) and a link to compare photos; the five-step ramp (40px by 10px steps), bold percent and chip; then "Other close matches" as hairline-ruled rows with a small ramp (18px by 6px). A newer result fades the old one to 45% while it works.

### Leader Lines (signature)
2px chartreuse lines with a faint ink drop-shadow run from the box's right edge to the crop and to the confidence ramp, with ink-stroked chartreuse dots at both ends. They draw in over 560ms (staggered 120ms) when a result lands, follow the box as it moves, and are not drawn when the layout stacks.

### Notice
A Notice-toned banner on home (icon, title, line, primary button) and a modal dialog on identify pages, both 6px corners with the warn-line stroke.

## Do's and Don'ts

### Do:
- **Do** frame the visitor's photo as a square white plate with a 1px Hairline and the Plate shadow, and set the answer on the facing column.
- **Do** keep chartreuse to marks: the analysed area, leader lines, the active tab, the Confident chip, status dots, focus and selection.
- **Do** give chartreuse an ink keyline wherever it sits on a photo.
- **Do** show confidence as five fixed violet steps, the percent, then a chip.
- **Do** set species and kingdom names in Source Serif 4, binomials always italic, and everything operational in Public Sans with tabular figures.
- **Do** head a data column with a 2px ink rule and divide rows with 1px hairlines.
- **Do** use 6px corners on controls and 0px on plates.
- **Do** run transitions at 160 to 240ms on the shared ease-out (cubic-bezier(0.16, 1, 0.3, 1)) and collapse them under reduced motion.

### Don't:
- **Don't** wrap the result in a rounded card or show confidence as a continuous progress bar or traffic-light colours.
- **Don't** set text in chartreuse on a light ground or flood large areas with it.
- **Don't** round plates or thumbnails.
- **Don't** set controls, labels or messages in the serif.
- **Don't** add uppercase tracked labels above headings; the taxonomy run is the only one, and it carries data.
- **Don't** add new shadows beyond the four in the vocabulary.
