# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Svelte 5 + Vite + TypeScript, with onnxruntime-web running the model in a Web Worker. Builds to a static folder. GitHub Pages is the eventual host; the repo is private for now, so Pages is out of scope until it goes public.

## Users

Anyone curious, with no expertise assumed: a person on a walk, in the garden or on holiday who has a photo of a plant or an animal and wants to know what it is. They are usually on a phone or a laptop, after the fact, looking at a photo they already took.

## Product Purpose

FieldWolf names the plant or animal in a photo. The person uploads a photo, drags a box around the living thing, optionally narrows the search to a part of the world, and gets the most likely species with an honest confidence. Success is a correct name, or an honest "not sure, but it is a kind of X" instead of a confident wrong answer.

## Positioning

Everything runs in the visitor's own browser. No photo ever leaves their machine, there is no account, and there is no server to pay for. The species lists cover the whole known animal and plant kingdoms, not a curated few hundred, because the lookup is hierarchical: family first, then only the matching family's species are fetched.

## Operating Context

- Two halves, chosen from the home page: Flora (plants, at `/flora`) and Fauna (animals, at `/fauna`).
- A one-time setup at `/setup` downloads the model (about 290 MB) into the browser's cache. Without a cached model, home shows a warning and each identify page a popup, both linking to `/setup`. When the download finishes, the visitor returns home and sees "Your setup is done".
- The region filter defaults to "Everywhere". A visitor can narrow it to a continent, then optionally a country (for example Australia).
- Identification is per photo, after the fact. The visitor may draw a box around the subject; without a box, the whole photo is analysed.

## Capabilities and Constraints

- Model: BioCLIP 2, image encoder, INT8 ONNX (`mahan-ym/bioclip-2-quantized`, MIT), proven in RoamWolf's BirdUp.
- Species tables: built offline with BioCLIP 2's text encoder, split into one family table plus per-family shards. Committed to this repo and served by GitHub Pages; the app depends on no external API at runtime except the one-time model download.
- Region lists: built offline from iNaturalist research-grade records, per country, with continents as their union (Antarctica as everything south of 60°S).
- Results show the top three species with common and scientific names. Below the confidence bar, the result falls back to the genus or family.
- Display name is "FieldWolf"; the repo is `field-wolf`.
- Self-reliance: all data lives in the repo. Only the model comes from Hugging Face.

## Brand Commitments

- Name: FieldWolf.
- Purple is Kat's favourite colour and must be the brand colour.

## Evidence on Hand

None yet. No photos, testimonials, accuracy figures or user counts exist. Do not invent any. BirdUp's spike measured 5 of 5 correct on five Australian bird photos; that is too small a sample to quote as an accuracy claim.

## Product Principles

1. Private by construction: the photo never leaves the device.
2. Honest over confident: a family-level answer beats a wrong species.
3. One clear path: pick a kingdom, add a photo, box it, read the answer.
4. Whole kingdoms, not a curated list.

## Accessibility & Inclusion

Public audience on phones and desktops. Meet WCAG 2.2 AA. The region box needs a keyboard-usable alternative.
