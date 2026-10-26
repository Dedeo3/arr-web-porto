# Dedeo's World

An interactive 3D portfolio: a cozy low-poly island with four houses (About, Projects, Skills, Contact), each with an explorable interior.

## Run

```bash
npm install
npm run dev -- -p 3105   # http://localhost:3105
npm run build            # stop the dev server first, both use .next
```

Append `?hq` to the URL to lock the highest quality (disables the adaptive quality controller).

## Edit the content

All portfolio text (bio, journey, skills, projects, contact links) lives in `lib/content.ts`.

## Layout

- `lib/game/` the engine: store, input, audio, world data and physics, scenes (select, city, room), characters
- `components/game/` HTML overlay (HUD, panels, touch controls, circle wipe) and the single `<Canvas>`

Controls: WASD / arrows, Shift run, Space jump, click the ground to walk, drag to rotate the camera, scroll to zoom, E to interact. On phones: floating joystick plus Jump / Enter buttons.
