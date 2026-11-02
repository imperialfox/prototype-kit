# Prototype kit · Handoff

One shared kit for every clickable prototype of Ivan's apps: device frame, controls panel and launcher, Inspect switch and inspector, rulers and guides, smart snapping, alignment, lock, copies, Transform Again, undo, notes, Copy changes, versions and onion skin. Universal: it belongs to no app, so it has no Q number and isn't in any app's queue.

Plan: [`docs/blueprint.md`](docs/blueprint.md) (first planned in the Suki project as `claude/prototype_kit_blueprint.md`; this repo is its home now). Approved prototype: [Prototype kit demo](https://claude.ai/artifact/WTiCAEY7mAMmD9QgEKWtby), version 1793641901-293e; built as 1793642735-726e.

## Kit 1.0

**Render:** 2 Nov 2026, 17:49. Ivan: "im happy with this now, render!"
Scope, as in the blueprint's "What the build touches", with the four defaults taken:
1. New public repo `imperialfox/prototype-kit` holding `kit.css`, `kit.js`, `demo.html`, `starter.html`, `tools/bundle.py`, `tools/check.py`, `README.md`, `CHANGELOG.md` (starting at 1.0), `LICENSE.txt` (MIT) and this `HANDOFF.md`.
2. The rate history prototype rebuilt on the kit as the proof, published as a new version of the same artifact.
3. A skill card for `ivan-app-look` section 2 ("Start from the prototype kit"; "change prototypes by editing, not redrawing"), saved only if Ivan saves it.

Universal (17:50, Ivan: "this prototype kit should be universal and not limited to just this app."): no app's name, colours or screens in `kit.css`, `kit.js` or the tools; each prototype brings its own; README and `starter.html` written for any app; the Suki rate history screen is only the demo and the proof. Checked on a plain Notes page with no app name.
Settled with the defaults: kit lives in its own public repo; launcher is a circle on a computer and an edge tab on a phone; kit starts at 1.0 with its own changelog and this handoff; proof prototype is rate history.
Not in scope: the four Illustrator ideas still offered, and everything under the blueprint's "Still out".

**Build:** 2 Nov 2026, 17:53 (Ivan: "build"). Kit 1.0.0.

## Debrief (2 Nov 2026)

**How it was built**
- The approved prototype's `kit.css` and `kit.js` became the kit as they were, plus three fixes found while building:
  - the kit's button reset beat app styles (the rate history Refresh button lost its blue); it now has the lowest priority, so any app's own rule wins;
  - with no app name the kit said "App"; it now says "the prototype" and "not part of the app";
  - Copy changes always said "iPhone points"; it now names the device shown.
- `Kit.version` is `'1.0.0'`; `kit.js` starts with the version, licence and repo link.
- `starter.html` is a blank prototype naming no app, with comments for each step. The README explains starting a prototype, hooking a screen in, the keys and the tools.
- `tools/check.py` now waits for the prototype's own motion to finish before measuring, picks two small on-screen parts for the key object test, picks the locked part directly, and skips the editing tests on a page with fewer than five named parts (the starter).
- **Rate history rebuilt on the kit** ([Suki rate history prototype](https://claude.ai/artifact/PMTmqDCE7i2cXavLkqYekA), version 1793642745-fdc9). Its own frame, controls panel and skeleton inspector were removed; the kit runs Device, Look, Motion and View, and its own states (Signal, When, Saved rate from, Trip, News) are kit controls. Its old list of part names now names the parts for the kit's inspector. Screens, data and wording are unchanged.
- The four defaults were used: own public repo, circle and edge tab launcher, version 1.0 with this handoff, rate history as the proof.

**Tests** (`tools/check.py`, computer 1280 × 900 and phone 402 × 874, all passing)
- Demo: 15 control states and every editing tool.
- Rebuilt rate history: 20 control states and every editing tool.
- A plain Notes page with no app name: 9 control states and every editing tool.
- Starter: 9 control states; frame, panel and empty screen open with no errors.
- Looked at side by side with the old rate history: Convert and Rate history on a phone and a computer, iPad in dark, and Skeleton. Same look; on a phone it now fills the screen.

**For your iPhone**
- The rebuilt rate history: swipe back from Rate history to Convert, and open a news row's sheet.
- Inspect on the phone: the edge tabs, picking a part with a finger, and the inspector sheet.
- Pulling a guide from the thin ruler strip with a finger.
- Copy changes in the Claude app: copies, or shows the select-all box.

**Left for later**
- The four Illustrator ideas still offered (Option + arrows, Shift/Option resize, Option-hover measuring, hide and lock from the Outline).
- Everything under "Still out" in the blueprint.
- With the history page open, Skeleton outlines the page underneath too, because both pages are on screen. Harmless; could hide covered pages later.

## Kit 1.1

**Render:** 2 Nov 2026, 19:50. Ivan: "Render. This is how I want things to be. Building system in place to be more optimal."
**Build:** awaiting Ivan's instruction.

Makes the Prototype kit work in tandem with the Atlas kit (`imperialfox/atlas-kit`, its own repo, no Q number), so notes from a prototype and notes from a real app's Atlas come back together when Ivan says "check my notes". Plan: Ivan's project notes, `claude/atlas_kit_prototype_kit_tandem_blueprint.md` (ask him to attach it).

**Build order:** this first, then Atlas kit 1.0 (its own repo and handoff), then Vocal Sessions Q31 (moves its Atlas onto the Atlas kit).

Scope:
1. **`SHARED.md`** (new): the basics kept identical in both kits, so changing it means changing both in the same sitting.
   - Devices: iPhone 402 × 874, iPad 820 × 1180, Mac 1440 × 900.
   - Looks: Light and Dark; Reduce Motion.
   - Text styles by size: 34 Large title, 28 Title 1, 22 Title 2, 20 Title 3, 17 Body, 16 Callout, 15 Subhead, 13 Footnote, 12 Caption 1, 11 Caption 2.
   - **Note format v1:** number, source (`atlas` or `prototype`), app, screen, part name (`data-name` when there is one), marked area (as fractions and in points), element details (tag, classes, text, path, key styles), the note, kind, status (Open · Looking into it · Fixed · Dismissed), where it came from (scan id and app version, or prototype id and version), edits (prototype only: moves, sizes, corners), created and updated.
   - Never stored: anything typed in a field, real user data.
2. **Notes and edits in note format v1,** saved to the page's own store when the prototype is published on claude.ai, so Claude can read them and they reach Ivan's phone and Mac. Elsewhere they stay on the device, as in 1.0.
3. **"Real app" overlay:** show the Atlas's screenshot of the real screen over or beside the prototype, using the existing onion-skin controls, to check the prototype against the live app.
4. **Copy changes** gains a short header in the shared format (app, screen, prototype version), so pasted changes and stored notes read the same.
5. `CHANGELOG.md` 1.1, README updated, `Kit.version` `'1.1.0'`, `tools/check.py` covering the above.

Agreed (defaults taken at Render): prototype notes on a page not published on claude.ai stay on that device; "check my notes" covers both kits; each kit version gets its own Render and Build in its own `HANDOFF.md`, with no Q number.
Still universal: no app's name, colours or screens in the kit.
Not in scope: the four Illustrator ideas still offered; everything under the blueprint's "Still out"; the Atlas kit itself.

Done when:
- A note made in a published prototype is stored in note format v1 and Claude can list it from a chat.
- The "Real app" overlay lines up with an Atlas screenshot at iPhone size.
- Copy changes starts with the shared header.
- `tools/check.py` passes on the demo, the starter, the rebuilt rate history and a plain page with no app name.
