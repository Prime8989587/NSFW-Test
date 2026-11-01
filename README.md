# GoonRose 🌹
Adult (18+) stylized dress-up game prototype. Rose is a woman in her 20s who decides what she's comfortable with.

**Run:** open `index.html` in a browser (no build step).

## Core loop
- Interact (wave, compliment, twirl, dance, pose, give a rose) → earns **Trust**.
- Each clothing layer needs a trust threshold, and some layers cover others (`ITEMS` in `game.js`).
- Rose consents → animated removal. Lingerie is her comfort limit.

## Extending
- Add clothing: add a `<g class="cloth" id="c-NAME" data-id="NAME">` in `index.html` and an entry in `ITEMS`.
- Add animations: a `.a-NAME` keyframe block in `style.css` + an entry in `ACTIONS`.
- Swap in real art: replace the SVG layers with PNG/Spine layers using the same ids; game logic is art-agnostic.
