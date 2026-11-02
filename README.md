# Prototype kit

![version](https://img.shields.io/badge/version-1.0.0-007aff)

**Current version:** 1.0.0 · 2 Nov 2026 · [changelog](CHANGELOG.md)

One shared kit for clickable app prototypes. Write the screens; the kit brings everything around them: the device frame, the controls panel, an inspector, and editing tools that turn your tweaks into one exact list of changes. It belongs to no app, so any prototype for any app can start from it.

## What's in it

- **Device frame:** iPhone (402 × 874) and iPad (820 × 1180), Mac optional, scaled to fit. On a phone the prototype fills the screen.
- **Controls panel:** Device, Look (Light, Dark), Motion (Normal, Slow, Reduce) and View (Normal, Skeleton), plus the prototype's own states. Folds into a small launcher.
- **Inspect switch** (key: I), on by default. Off, the prototype works normally; on, tapping picks parts.
- **Inspector,** inspired by Safari's Web Inspector: path, Left, Top, Width, Height and Corners boxes, box diagram, text style, colour and contrast, VoiceOver, tap area, notes, and an Outline.
- **Rulers** in points outside the frame. Drag from a ruler to make a guide.
- **Moving and arranging:** drag, nudge with arrows, smart snapping, alignment to a key object, spacing, groups, locks, Option-drag copies, Shift-drag straight lines, a live distance tag, and Transform Again (⌘D).
- **Undo and redo** for every step, **Copy changes** for a numbered list in points, **versions** saved on the device, and **onion skin** ghosts when switching between versions.
- Changes, copies, versions and guides are kept on the device through reloads.

Try it: [Prototype kit demo](https://claude.ai/artifact/WTiCAEY7mAMmD9QgEKWtby). The demo's screen is a sample (a currency rate history page); the kit itself has no app's screens, names or colours.

## Start a new prototype

1. Copy `starter.html`, give it a new name, and change its `id` so its saved changes stay separate.
2. Put the screens inside `<div id="app">`. Keep their styles under `#app`.
3. Give each part a `data-name` in plain words ("Save button", "Total"). The inspector, Outline and Copy changes use these names.
4. Add the prototype's own states to `controls`, each with an `onChange` that redraws the screen.
5. Run `python tools/bundle.py my_prototype.html out.html` to make one self-contained file (needed where pages can't load other files, such as the Claude artifact viewer).
6. Run `python tools/check.py out.html shots` before sharing it.

## Hooking a screen into the kit

```js
Kit.start({
  app: 'Your app',          // optional; heads the Copy changes list
  title: 'settings screen', // optional
  id: 'your-app-settings-v1',
  root: '#app',             // the default
  controls: [
    { name: 'Signal', options: ['Online', 'Offline'], onChange: i => redraw({ offline: i === 1 }) }
  ]
});
window.addEventListener('kit:change', e => {
  // e.detail: { device: 'iphone' | 'ipad' | 'mac', look: 0 | 1, motion: 0 | 1 | 2, inspect, skeleton, custom }
});
```

The screen gets Apple's base colours as variables (`--bg`, `--surface`, `--fg`, `--fg2`, `--fg3`, `--sep`, `--fill`, `--accent`), switched for Dark. `--k` is the motion speed (1 normal, 4 slow). The screen element also gets the classes `dark`, `is-iphone`, `is-ipad` or `is-mac`, and `motion-reduced`. An app with its own tokens can define them on its own root instead.

Other calls (all on `window.Kit`): `get`, `set(name, i)`, `select(name)`, `tap(name, add)`, `nudge(dx, dy)`, `field(key, value)`, `align(side)`, `distribute(axis)`, `group`, `ungroup`, `lock`, `note(text)`, `again`, `undo`, `redo`, `saveVersion(name)`, `view(i)`, `makeDraft`, `onion(mode, layers)`, `inspect(on)`, `deselect`, `clearGuides`, `changesText`, `original(on)`, `clear`, `state`.

## Keys

| Key | Does |
|---|---|
| I | Inspect on or off |
| Arrows · Shift + arrows | Nudge by 1 · by 10 |
| ⌘Z · ⇧⌘Z | Undo · Redo |
| ⌘D | Repeat the last move or copy |
| ⌘G · ⇧⌘G | Group · Ungroup |
| ⇧⌘L | Lock or unlock |
| Esc · ⇧⌘A | Deselect |
| Delete | Remove a copy |
| Shift-drag · Option-drag · ⌘-drag | Straight line · Copy · No snapping |
| Double-click | Unlock |

## Tools

- `tools/bundle.py` swaps the page's `kit.css` link and `kit.js` script for the kit's own text.
- `tools/check.py` opens the page headless at computer and phone sizes, goes through every control, and tries the editing tools. It reports errors, sideways scroll, and "NaN", "undefined" or "null" on screen. Needs Python and Playwright (`pip install playwright`, then `playwright install chromium`).

## Files

- `kit.css`, `kit.js`: the kit.
- `starter.html`: a blank prototype to copy.
- `demo.html`: the kit with a sample screen.
- `HANDOFF.md`: what was approved and built.
- `docs/blueprint.md`: the full plan and the decisions behind it.

## Licence

MIT. See [LICENSE.txt](LICENSE.txt).
