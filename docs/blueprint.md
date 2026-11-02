# Prototype kit · Blueprint (2 Nov 2026)

**Stage:** Rendered 2 Nov 2026, 17:49 · Built 2 Nov 2026 as kit 1.0.0 · live state: [`HANDOFF.md`](../HANDOFF.md) in `imperialfox/prototype-kit`.
**Prototype:** [Prototype kit demo](https://claude.ai/artifact/WTiCAEY7mAMmD9QgEKWtby) (version 1793642735-726e, kit 1.0.0; approved as 1793641901-293e; earlier 1793641362-2856, 1793640713-dd85, 1793640186-8757, 1793639334-5bce, 1793638940-90e6, 1793638630-3f11, 1793638198-6571 and 1793637040-f3ec). The kit's files, scripts included, live in this repo.
**From:** the workflow audit's C05 "Prototype starter" (`claude/suki_workflow_skills_audit_2026-11-02.md`) and the rate history chat (2 Nov, 15:42): "build the prototype tools once, as a shared kit".

## Goal

Every clickable prototype, for any of Ivan's apps, starts from one shared kit. The kit is universal: it belongs to no app. Suki was only the first place it was planned, and its rate history screen is only the demo and the proof. Each prototype only adds its own screens and its own states. The kit also lets Ivan inspect and adjust a prototype himself, then hand back one exact list of changes.

## Agreed (Ivan, 2 Nov)

- **Wireframes first** (15:47), then "code the tools now" (16:16), taken as the go-ahead for the prototype.
- **Controls panel collapses into a small launcher** (15:49). Four shapes and four button styles were compared inline.
- **Safari's Web Inspector as inspiration** (15:57).
- **A faint ruler just outside the iPhone frame**, counting points, that moves with the pointer and shows the picked box's edges (16:00).
- **Smart snapping like Illustrator, and typing exact numbers** (16:03).
- **Alignment: top, middle, bottom, left, centre, right, plus group alignment** (16:05).
- **A working undo** (16:10).
- **The finishing five** (16:16): Copy changes, notes on any box, width/height/corner boxes with resize handles, before and after, edits kept on the device.
- **Reuse, not redraw** (16:34): change prototypes by editing only what differs; keep versions as differences, not copies.
- **Key object, lock, versions** (16:40): the first box picked is the key object the others line up to; locking with double-click to unlock; Save as version and flick between versions. Wireframe approved: "works great" (16:43).
- **Hover tips after a short pause** (16:43), then "lets update that prototype kit demo" (16:45).
- **A visible bubble on any part with a note** (16:54).
- **Inspect out of View, as its own switch next to the folded launcher, always available and on by default** (16:54).
- **Tapping outside the phone deselects, plus a keyboard shortcut** (17:01).
- **Onion skin when switching between versions, inspired by animation** (17:06).
- **Up to two onion layers, the second fainter** (17:21).
- **Shift-drag moves only across or down; Option-drag duplicates, like established programs** (17:28).
- **Illustrator ideas 1–3: guides pulled from the rulers, a live distance tag while dragging, Transform Again (⌘D)** (17:35), straight into the prototype with no wireframe this time.
- **Render** (17:49): "im happy with this now, render!"
- **Universal, not limited to Suki** (17:50): "this prototype kit should be universal and not limited to just this app." So: nothing in `kit.css`, `kit.js` or the tools names an app or uses an app's own colours; each prototype passes its own name, screens, tokens and controls; with no name given the kit says "the prototype" and "not part of the app"; Copy changes measures in the device shown (iPhone, iPad or Mac points); the README and `starter.html` are written for any app; the kit's records live in its own repo, not in Suki's queue or handoff.

## Defaults used where Ivan didn't pick (can be changed)

- **Launcher:** a circle on a computer, an edge tab on a phone. The demo keeps a "Launcher (pick one)" toggle so he can still compare: Circle · Capsule · Edge tab · Square.
- **Buttons inside the panel:** segmented, like iOS.
- **Inspector:** all of the Safari-inspired details (box colours, box diagram, distances, path, text style, colour token and contrast, VoiceOver, tap area), plus an Outline list. Safari's Layers 3D view is left for later.
- **View:** Normal · Skeleton. Inspect is a separate switch, so Skeleton can be used with it on or off.
- **Inspect remembers its last setting on the device;** the very first time it's on. In the open panel it's a small icon button beside Minimise.
- **Note bubble:** yellow speech bubble with the change number, at the end of the part's text; shown in every view, Inspect on or off. Parts that only moved keep the dark numbered pin, shown with Inspect on.
- **Deselect:** clicking the empty background or the phone's bezel; Esc; ⇧⌘A (Illustrator's Deselect All). Clicks on the panel, inspector and launcher keep the selection.
- **Onion skin:** versions in order, then Draft, like frames on a timeline. Off · Before · Both, starting on Before. Layers 1 · 2, starting on 2. Both remembered on the device. Before is red, after is green, as in animation software. The nearest layer is a faint dashed outline; the second is about half as strong with a finer dash. A thin path joins each part's ghosts to where it is now. Each layer's version name sits on its first ghost. Parts glide into place when switching (Slow slows it; Reduce skips the glide); ghosts appear once the glide lands.
- **Modifier keys while dragging:** Shift keeps to whichever direction the drag started (an "Across only" or "Down only" tag shows; snapping keeps working along that line). Option drags a copy and leaves the original. ⌘ skips snapping (it was Option before Option became duplicate; Figma uses a similar key).
- **Copies:** named "<part> copy" (then "copy 2"…); listed in Copy changes as "add a copy of <part>, placed down 40 from it"; Delete removes a copy you made (undoable); original parts can't be deleted here, so a note asks for a removal instead. A copy is a picture of the part: its own buttons don't respond.
- **Guides:** blue, so they don't get mixed up with the pink snapping lines. Dragging down from the top ruler makes a level guide; dragging across from the left ruler makes an upright one. While dragging, a dark tag shows "y 120" or "x 120", and dashed grey with "Let go to remove" once off the phone. Picked parts win over guides, so a guide through a part never stops it being dragged; anywhere else, pressing on a guide moves it. Guides are kept on the device with the prototype, aren't part of Copy changes or versions, and show only with Inspect on. Parts snap to them. "Clear guides · 2" in the inspector removes them all.
- **Live distance:** a small dark tag beside the pointer while dragging: "+12, +40" from where the drag started (or "0, +63.7" with Shift), and "370 × 36" while resizing.
- **Transform Again:** ⌘D (Illustrator's key), or "Repeat move" / "Repeat copy" in the inspector. It repeats the last drag, Option-drag copy, arrow nudge or typed Left/Top. After an Option-drag, each ⌘D copies the newest copy by the same distance, so one drag and two ⌘D make three evenly spaced copies. Each repeat is its own undo step ("Copy again", "Move again").
- **Term:** "key object", as in Illustrator.
- **Locks are not listed in Copy changes,** because a lock helps editing and isn't a change to the app.
- **Double-click unlocks;** picking the smallest part moved to ⌘-click and the path's "inside" step.

## What the prototype does

1. **Frame:** iPhone 402×874 and iPad 820×1180 (Mac optional), dark bezel, scaled to fit. On a phone it fills the screen with no frame.
2. **Controls panel:** outside the frame; minimises into the launcher. Always Device, Look, Motion, View, plus Version, Onion skin and Layers once a version is saved; each prototype adds its own groups in one short list.
3. **Inspect switch:** beside the folded launcher (a capsule on a computer, a second edge tab under the launcher on a phone) and as an icon button in the panel's header when open. Blue when on. Key: I. Off, the prototype works normally; on, taps pick parts.
4. **Look and Motion** set Apple's base colour tokens and a speed number for the screens to follow.
5. **Inspect:** hover shows a name tag (mouse); tap picks the nearest named part, ⌘-click picks the smallest part. Picked parts get Safari's margin/padding/content colours, red distance lines to their parent and the part above, and resize handles.
6. **Inspector panel:** path (tap a step to pick it), Left · Top · Width · Height · Corners boxes (24, +8 or −8), box diagram, text style with a tick if on Apple's scale, colour token and contrast, fill, roughly what VoiceOver says, tap area against 44. For a copy, where it sits compared with its original.
7. **Rulers:** faint, outside the frame, in points; pointer marker; picked part's edges and numbers. On a phone they show as strips only with Inspect on. Drag out of either ruler for a guide.
8. **Moving:** drag (a mouse picks and drags in one go; a finger scrolls unless the part is already picked), arrows by 1, Shift + arrows by 10. Shift-drag moves straight; Option-drag makes a copy; ⌘-drag skips snapping. A live distance tag follows the pointer.
9. **Deselecting:** click outside the phone, Esc, or ⇧⌘A.
10. **Smart snapping:** to other parts' edges and centres, the parent's edges, the screen edges and centre, the 16-point margins, a 16-point gap, and your own guides. Pink labelled guides. ⌘ drags freely; a switch turns it off.
11. **Guides:** pulled from the rulers, moved by dragging, removed by dragging back off the phone or with Clear guides. Kept on the device.
12. **Key object:** the first part picked, with a thick outline and a "Key object" tag; the others are tinted blue and are what moves. Tap a blue one to make it the key instead.
13. **Arrange:** align left, centre, right, top, middle, bottom; space out across or down, evenly or by a typed gap; line up with Key object (default), Selection, Parent or Screen. Group and Ungroup (⌘G, ⇧⌘G). Select several, or Shift-click. Repeat move or Repeat copy (⌘D).
14. **Lock:** padlock badge and dotted outline; can be picked and inspected, but not dragged, nudged, aligned or resized, and the kit says so. Double-click (or double-tap) unlocks. ⇧⌘L locks or unlocks.
15. **Copies:** Option-drag makes them, ⌘D makes more at the same spacing; Delete removes them; they come back with undo, versions and reloads, sitting in the same place.
16. **Undo and redo:** every change is a named step ("Undo Duplicate", "Undo Copy again"), ⌘Z and ⇧⌘Z; quick nudges count as one step.
17. **Notes** on any part, shown as a yellow numbered bubble that stays visible with Inspect off; numbered pins on every other changed part, matching the list.
18. **Changes:** Copy changes gives a numbered list in points ("1. Range pill: move down 8"), with copies, notes and groups. Where copying is blocked, the list shows in a box to select.
19. **Versions:** Save as version names the current changes; flick between Draft and saved versions under Version. A saved version can only be looked at; "Make this the draft" brings it back, and Undo reverses that. Copy changes copies the version being viewed. Up to 30, kept on the device.
20. **Onion skin:** ghosts of up to two versions before (red) and, on Both, up to two after (green), the second layer fainter, with a key in the panel naming each layer. Shown with Inspect on or off; hidden while Show original is on.
21. **Hover tips** (mouse and trackpad only): the first after 0.6 s, the next straight away while gliding along a row; name, what it does here, and the shortcut. Boxes on the screen and the two rulers get one too.
22. **Show original** compares before and after; **Clear** is undoable.
23. **Kept on the device** through reloads: changes, copies, versions, guides, and the Inspect, Onion skin and Layers settings.

## Illustrator ideas offered (2 Nov, 17:32), not yet chosen

1. **Option + arrow keys:** copy and nudge in one press.
2. **Shift-resize keeps the shape; Option-resize grows from the centre.**
3. **Option-hover to measure:** with one part picked, hovering another shows the gaps between them.
4. **Hide and lock from the Outline:** eye and padlock buttons on each row, like Illustrator's Layers panel; ⌘3 hides the picked part to see behind it.

(Ideas 1–3 of the first list, guides, live distance and Transform Again, were chosen at 17:35 and are in the prototype.)

## Still out

- Turning the live app's own code into a prototype automatically (the bigger half of C05). Parked until a prototype-heavy idea needs it, such as the till game.
- App screens or components. Those stay in each prototype, matched to its app.
- Free colour or font editing. If wanted later, only from the app's own tokens and text sizes.
- Safari's Layers 3D view. A history list of steps. Snapping to a grid. Deleting a saved version. More than two onion layers each side. Copies with working buttons. Haptics and sound. Locking guides, and guides in versions.

## What the build touches (after render)

- **A new public repo, `imperialfox/prototype-kit`:** `kit.css`, `kit.js`, `demo.html`, `starter.html`, `tools/bundle.py`, `tools/check.py`, `README.md`, `CHANGELOG.md`, `LICENSE.txt` (MIT), and a short `HANDOFF.md` with the Render and Build stamps.
- **The rate history prototype,** rebuilt on the kit as the proof, published as a new version of the same artifact.
- **A skill card for `ivan-app-look` section 2:** "Start from the prototype kit", and "change prototypes by editing, not redrawing". Saved only if Ivan saves it.

## Done when

- `tools/check.py` passes on the demo and on the rebuilt rate history prototype, on a computer and a phone. On 2 Nov it already passes on the demo: every control state, Inspect off and on (and on by default), nudge, number boxes, align, group, drag, key object, lock and double-tap unlock, versions (save, view read-only, make draft, undo), onion skin (Off, Before and Both; two layers with the second fainter; one layer hiding the second; the glide starting and finishing), Shift-drag staying level, Option-drag making a copy without moving the original, Delete removing a copy and undo bringing it back, Delete leaving an original alone, a guide dragged from the top ruler and dragged back off to remove it, the live distance tag mid-drag, ⌘D twice making two more copies as "Copy again", deselect (click outside, Esc, ⇧⌘A, and the inspector keeping the selection), hover tip timing, undo, redo, copy, show original, the note bubble with Inspect off, and reload keeping copies in the same place.
- The rebuilt rate history prototype looks and behaves the same as before, side by side.
- `starter.html` opens with the frame, panel and an empty screen, and names no app.
- `tools/check.py` passes on a plain page from another app with no app name given. On 2 Nov it passes on a sample Notes screen (9 control states, computer and phone).
- No part in the Outline or inspector is named "Element".

## Checked on the prototype (2 Nov)

- 402 px and 1280 px, light and dark, iPad, Inspect on and off, Skeleton. No errors, no sideways scroll, no "NaN", "undefined" or "null".
- Fixed after looking (first version): a 44 × 44 tap area wrongly marked under 44; the launcher options cut off; the left ruler's numbers clipped; the phone inspector sheet at the top instead of the bottom; VoiceOver text run together; the demo's range pill knob invisible in dark mode.
- Fixed after looking (second version): a hover tip stayed on screen after the inspector changed under it.
- Fixed after looking (third version): the note bubble sat at the far edge of a full-width title; it now sits at the end of the text. The launcher's focus ring was heavy; it's now a thin blue ring for the keyboard only.
- Fixed after looking (fifth version): the ghosts' tint was too strong over the chart, so they're now faint outlines; the Inspect switch squeezed the panel's title onto two lines, so it's an icon button in the header.
- Looked at (sixth version): a back button moved across three versions shows its path through both layers on Draft, and on Both from a middle version.
- Fixed after looking (seventh version): the inspector said "Moved right 88" for a copy; it now says where the copy sits compared with its original.
- Fixed for universal use (ninth version): with no app name the panel said "not part of App" and Copy changes said "the App prototype"; it now says "not part of the app" and "the prototype". Copy changes always said "iPhone points"; it now names the device shown.
- Fixed after testing (eighth version): a copy could come back in a slightly different place after a reload; copies are now re-seated on their original every time the screen updates. A guide running through the middle of a picked part grabbed the press instead of the part; picked parts now win.

## Decisions (settled at Render, 2 Nov 17:49, with the defaults)

1. **Where the kit lives.** *Default if unanswered:* its own public repo, `imperialfox/prototype-kit`.
2. **Launcher shape.** *Default if unanswered:* circle on a computer, edge tab on a phone.
3. **Version and record.** *Default if unanswered:* the kit starts at 1.0 with its own changelog and a short `HANDOFF.md`. It isn't a Suki queue item, so it has no Q number.
4. **Proof prototype.** *Default if unanswered:* the rate history one.

## Effort and cost to push

- **Build: medium.** Most of the code exists now; the build moves it into the repo, adds the starter page, and rebuilds the rate history prototype on it.
- **After that:** each new prototype gets every tool for free. Paste the copied changes list to get many tweaks done in one pass; save versions on the device instead of asking for redraws.

## Only his phone can tell

- Whether the two edge tabs (controls and Inspect) are easy to find and tell apart.
- Whether the inspector sheet leaves enough of the screen visible.
- Whether dragging, picking, scrolling and double-tap to unlock feel right with a finger.
- Whether the yellow note bubble and the red and green ghosts, including the fainter second layer, are easy to see in daylight.
- Whether the glide between versions feels smooth.
- Whether Copy changes copies in the Claude app, or shows the select-all box.
- Whether pulling a guide out of the thin ruler strips works with a finger (only tested with a mouse), and whether the distance tag sits clear of the finger.
