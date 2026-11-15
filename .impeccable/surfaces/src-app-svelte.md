---
version: 1
slug: "src-app-svelte"
primary_target: "src/App.svelte"
related_targets: ["src/routes"]
---

# FieldWolf app surface

Scope: the whole app shell and its routes: home (`/`), identify (`/flora`, `/fauna`), setup (`/setup`). Visitor mode: Operate.

Audience and job: a curious member of the public with a photo of a plant or animal who wants its name. Task: pick Flora or Fauna, add a photo, box the subject, optionally narrow the region, read the answer.

Chosen direction: Field Guide Plate (seed:6fc680c515c35b3a). Chosen sketch: `.impeccable/mocks/decision/assigned.html`.

Sketch corrections owed by the build: drop the "field marks" description line (the product has no such data) and the "Oceania pack" footer label (no per-region model packs exist). Replace the placeholder brand glyph with the sleeping-wolf-under-a-tree logo (`.impeccable/mocks/logo/fieldwolf-mark.svg`, draft).

Unresolved: final logo refinement (heavier muzzle, wolf-only favicon crop); home and setup page compositions inherit this world.

## Direction contract

THESIS: Every answer reads like a field guide plate: the visitor's photo is the plate and the species name faces it. Refuses the category default of a drop zone plus a rounded result card with a progress bar.

OWN-WORLD: Deep violet #2B1747 shell bar; violet #6B3FA0 for controls, filled ramp steps and links; chartreuse #C6E03A reserved for the selection box, leader lines, active tab underline and the Confident chip; cool lavender-white #F6F5FA ground, white plate panels with hairline #DEDAE8 borders, ink #1C1726. Source Serif 4 for species names (common upright, scientific italic); Public Sans for UI. Square corners on plates, 6px on controls.

STORY: The visitor sees their own photo framed as a plate, sees exactly which area was analysed, and reads the name on the facing column with an honest confidence. They believe it because the proof crop sits beside the answer. They retry by redrawing the box or widening the region.

FIRST VIEWPORT: Identify page at 1440: 56px violet bar (logo, FieldWolf, Flora/Fauna tabs, model status right); 64px white tool bar (page title, Region select, Change photo, Clear box); photo plate left ~53% width with the chartreuse box; facing column right: taxonomy guide-word rule (Class › Order › Family › Genus), No. 1 with analysed-crop thumbnail, common name 40px serif, scientific italic, five-step ramp with percent and chip, then two runner-up rows. Signature interaction: chartreuse leader lines draw from the box to the facing name when results land, and redraw as the box moves.

FORM: Field guide plate, position 3 on the ordered grounded list; raised with Cassette (hard Flora/Fauna halves), Monochrome (answer beside its proof), Lexicon (guide-word taxonomy rule), Exposure (fixed five-step confidence ramp). seed:6fc680c515c35b3a

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
