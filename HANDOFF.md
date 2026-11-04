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
**Build:** 2 Nov 2026, 19:59 (Ivan: "build for Prototype kit 1.1"). Kit 1.1.0.

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

## Debrief · kit 1.1 (2 Nov 2026)

**How it was built**
- **`SHARED.md`** written as approved, plus a field table for note format v1 that follows the Atlas prototype's notes (`box` as fractions, `px` in points, `element` with `tag`, `cls`, `text`, `path`, `style`), so the Atlas kit can adopt it without renaming. Readers ignore fields they don't know.
- **The page's store:** when `claude.use('db')` answers, the kit keeps the draft in `kit/draft` and one note per changed part in `notes` (ids start `p-`, so they never clash with Atlas notes). It writes half a second after a change, and only what changed. Whichever is newer when the page opens wins (the device's copy or the page's); another device's changes arrive while it's open and go on the undo list as "Changes from another device". Versions and guides stay on the device (not in scope).
- **Statuses:** kept when the kit rewrites a note; a Fixed or Dismissed note reopens if its note or change is edited.
- **Nothing typed is stored:** element text is left empty for text boxes and editable areas (checked by typing into the plain page's search box).
- **Real app:** `real` start option (a file per device, or one string for iPhone) and a "Real app" control: Off, Over with Strength 30/50/80%, Beside (Off and Over on a phone). Show original hides it. The side frame uses padding rather than a border, because browsers round borders to whole device pixels and it sat 1 point off.
- **Copy changes** now starts with the shared header (source, app, screen, prototype, version, kit). The inspector's hint and the panel's last line say where notes are kept.
- **New:** start options `screen`, `version`, `real`, `store`; calls `Kit.notes()`, `Kit.store()`, `Kit.real(src, mode)`, `Kit.push()`. `tools/plain.html` (a plain Notes page with no app name) is now in the repo; `tools/check.py` serves the repo folder for pages inside it.
- **Demo republished** ([Prototype kit demo](https://claude.ai/artifact/WTiCAEY7mAMmD9QgEKWtby), version 1793650230-3126) with the page's store declared (everyone with access reads, only Ivan writes) and a sample "real app" picture (its own starting screen, `assets/demo-real-iphone.png`). Its store is empty and Claude can list it. The rebuilt Suki rate history page was checked on 1.1 but not republished (it isn't part of this kit's scope).

**Tests** (`tools/check.py`, computer 1280 × 900 and phone 402 × 874, all passing)
- Demo: 18 control states (17 on a phone), every editing tool, store and real app.
- Rate history on 1.1: 20 control states, every editing tool, store and real app.
- Plain page: 9 control states, every editing tool, store and real app.
- Starter: 9 control states, store and real app.
- New checks: a note record has every v1 field with the right move, box fractions and kit version; the draft is on the page; typed text is never stored; a status set by Claude is kept and a changed note reopens; the header; another device's change arrives and Undo lists it; a fresh device opens with the page's changes; clearing removes the notes; without the store the panel says "kept on this device"; Over lines up with a test picture at iPhone size (a red line at x 100 lands within a pixel of 100 points); Show original hides it; Beside sits next to the phone at the same size with no sideways scroll; a phone offers Off and Over only.

**For your iPhone**
- Open the demo in the Claude app, tap a part, write a note, then ask in any chat "check my notes on the Prototype kit demo".
- Open the same demo on your Mac: the note and any moves should already be there.
- Real app → Over: drag Strength and check the picture sits exactly on the screen.
- On the Mac, Real app → Beside: the picture should be the same size, next to the phone.

**Left for later**
- Versions and guides on the page's store (only notes and the draft go there now).
- The Atlas reading a prototype's notes: that's Atlas kit 1.0, next.

## Kit 1.2

**Render:** 2 Nov 2026, 20:25. Ivan: "I'm ready to fast track it 1.2, render" (straight from the plan, no preview).
**Render (widened):** 4 Nov 2026, 16:35. Ivan: "fold this the kit 1.2 add to the inspector menu a way to hide guides, also arrange the menu just how adobo illustrator would have it. use tabs if necessary to reduce clutter. render". Adds items 8 to 12 below. The layout details in them are Claude's defaults, set at this Render; Ivan can change any of them before Build.
**Build:** awaiting Ivan's instruction.

Makes the rulers, guides and inspector follow scrolling, so positions read right on long, scrolling screens. Today both rulers measure the screen (0 is always its top), guides are pinned to the screen, and a part far down a list reads its on-screen position. Moves and size changes are stored as differences, so Copy changes is not affected.

Scope:
1. **The left ruler follows the scroll.** When the picked part (or, with nothing picked, the part under the pointer) sits in a scrolling area, the ticks slide as it scrolls and the numbers show its place on the whole page. Fixed bars (such as a top bar or tab bar) keep screen numbers, and their stretch of the ruler is shaded so the scrolling area's start and end show.
2. **A "Ruler" control:** Auto (default; as in 1), Screen (as in 1.1), Page (always from the top of the content).
3. **Guides stick to what they're dropped on:** on scrolling content they scroll with it; on a fixed bar they stay. Saved, so they survive a reload (guides saved by 1.1 stay screen guides).
4. **A scroll marker on the left ruler:** a thin bar for how far down the page it is, and a "Scrolled 240" tag while scrolling.
5. **The inspector's Top box shows both** for a part in a scrolling area, e.g. "Top 120 on screen · 480 on page".
6. **The same for sideways scrolling** (carousels) on the top ruler.
7. When several areas scroll (a sheet over a list), the rulers follow the one holding the picked part.
8. **Hide guides.** A "Show guides" switch, like Illustrator's View › Guides › Hide Guides, with the same shortcut ⌘;. Hidden guides are kept, not cleared: they aren't drawn, can't be grabbed and nothing snaps to them. While hidden, the switch reads "Guides hidden · 3". Dragging a new guide out of a ruler shows them all again. The choice is remembered on the device, like Inspect. This covers your own guides only; the pink snapping lines shown while dragging are Smart snapping.
9. **The inspector in three tabs, named and ordered like Illustrator's panel dock:** Properties · Layers · Changes. Undo and redo stay above the tabs; the status line stays below them. The open tab is remembered on the device. Picking a part doesn't switch tabs (as in Illustrator); Layers highlights it.
10. **Properties, in the order of Illustrator's Properties panel.**
    - With a part picked, top to bottom: its name and path; **Transform** (Left, Top, Width, Height, Corners, and the box sizes); **Appearance** (Fill, Colour with its contrast, Text style); **Align** (the six align buttons, Space out with Gap, Line up with: Key object, Selection, Parent, Screen); **Quick actions** (Group or Ungroup, Lock, Repeat, Select several); **Checks** (VoiceOver, Tap area); **Note**.
    - With nothing picked, as Illustrator's document view: **Rulers and guides** (Ruler: Auto, Screen, Page from item 2; Show guides; Clear guides with its count; Smart snapping), then the shortcuts hint.
    - So the Ruler control from item 2 lives here, not in the controls panel, and Clear guides and Smart snapping move here from Arrange. Smart snapping also gets Illustrator's Smart Guides shortcut, ⌘U, so it can be switched with a part picked.
11. **Layers** is today's Outline, always open in its own tab, with the change numbers beside parts. **Changes** holds Copy changes, Show original, Save as version, Clear, the saved versions count and the text to paste.
12. On a phone, the inspector sheet gets the same tabs, each at least 44 pt tall.
13. `CHANGELOG.md` 1.2, README updated, `Kit.version` `'1.2.0'`, a longer list on `tools/plain.html` so there is something to scroll, and `tools/check.py` covering the above (scroll a long list, read the rulers, guides and Top box; every tab and section reachable on a computer and a phone; hide guides by switch and by ⌘;; hidden guides not drawn, grabbed or snapped to; a new guide showing them again; the switch and the open tab kept after a reload).

Agreed (default taken at Render): Ruler starts on Auto; the control's choice is remembered on the device like Inspect.
Agreed (widened Render): guides start shown; the inspector opens on Properties; tab names and section order as in items 9 to 11; nothing in 1.1's inspector is removed, only moved.
Still universal: no app's name, colours or screens in the kit.
Not in scope: guides on the page's store (they stay on the device); locking guides and hide or lock from the Outline (still under "Left for later" and "Still out"); anything else in "Left for later".

Done when:
- With a part picked in a scrolled list, the left ruler's numbers match its place on the page, and fixed bars keep screen numbers with their stretch shaded.
- A guide dropped on scrolling content scrolls with it, one dropped on a fixed bar doesn't, and both are back after a reload.
- The Top box shows both numbers in a scrolling area, and one number elsewhere.
- Screen mode behaves exactly as 1.1.
- Show guides off hides every guide, by switch or ⌘;, and turning it back on shows them unchanged.
- The inspector has Properties, Layers and Changes tabs, Properties follows Illustrator's order, and every control from 1.1 is still there.
- `tools/check.py` passes on the demo, the starter, the rebuilt rate history and the plain page.

