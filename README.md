# GoonRose 🌹
Adult (18+) stylized dress-up game prototype. Rose is a red-haired, rose-tattooed woman in her 20s relaxing on a seaside balcony. She decides what she's comfortable with.

**Run:** open `index.html` in a browser (no build step).

## Core loop
- Interact (wave, compliment, twirl, dance, pose, soak up the sun, bring a cocktail, give a rose) to earn **Trust**.
- Each clothing layer (sunglasses → sheer kimono → sandals → denim shorts → crop tee) needs a trust threshold, and some layers cover others (`ITEMS` in `game.js`).
- Once Rose agrees, the item comes off with an animation. Her white-and-red bikini is her comfort limit.

## Look & scene
- Character: messy red bun with a rose clip, gold sunglasses, nose ring, hoops, necklace, bracelet, belly piercing, and rose-and-vine tattoos (`#tat` / `#vine` in `index.html`; reuse them anywhere with `<use>`).
- Scene (`#scene`): sky with drifting clouds, islands, a turquoise sea with generated sparkles/ripples, a sliding glass door, a pillar, a ceiling overhang, and a steel-and-glass railing.

## Rig
Arms are two-bone: `.armL/.armR` pivot at the shoulder and `.foreL/.foreR` at the elbow, so CSS keyframes can bend elbows (see the hands-on-hips `pose`/`sun` animations).

## Extending
- Add clothing: add a `<g class="cloth" id="c-NAME" data-id="NAME">` in `index.html` and an entry in `ITEMS`. Put sleeve parts in `.armL`/`.armR` groups so they follow the arms.
- Add animations: a `.a-NAME` keyframe block in `style.css` plus an entry in `ACTIONS`.
- Swap in real art: replace SVG layers with PNG/Spine layers using the same ids. The game logic doesn't depend on the art.
