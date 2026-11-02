# Changelog

## 1.1.0 · 2 Nov 2026

*Works with the Atlas kit: notes Claude can read, the real app beside the prototype, one shared format*

**Notes Claude can read**
- On claude.ai, with the page's store declared, every note and change is saved on the page in note format v1 (one document per changed part in `notes`, the draft in `kit/draft`), so "check my notes" in a Claude chat finds them, and they reach every device.
- Statuses set by Claude or Ivan (Open, Looking into it, Fixed, Dismissed) are kept; a fixed or dismissed note reopens when it's edited.
- Changes made on another device arrive while the prototype is open; Undo puts them back. When it opens, the newer of the device's copy and the page's copy wins.
- Nothing typed into a field is stored. Elsewhere, notes stay on the device, as in 1.0. The panel says where they're kept.

**Real app**
- New "Real app" control: Off, Over (with Strength 30, 50 or 80%) or Beside, showing the Atlas's screenshot of the real screen. On a phone: Off or Over.

**Handing back**
- Copy changes starts with the shared header: source, app, screen, prototype, version and kit version.

**Shared basics**
- `SHARED.md`: devices, looks, text styles and note format v1, kept identical in the Atlas kit.

**Tools**
- New start options `screen`, `version`, `real` and `store`; new calls `notes`, `store`, `real` and `push`.
- `tools/check.py` also checks the page's store (with a stand-in), note format v1, kept statuses, another device's changes, a fresh device, the header, and the Real app overlay lining up at iPhone size. `tools/plain.html` is the plain page it uses to prove the kit stays universal.

## 1.0.0 · 2 Nov 2026

*First release of the prototype kit: one shared kit for any app's prototypes*

**Frame and controls**
- iPhone and iPad frames (Mac optional), scaled to fit; full screen on a phone.
- Controls panel with Device, Look, Motion and View, plus each prototype's own states; folds into a small launcher (circle on a computer, edge tab on a phone).
- Inspect switch beside the launcher, on by default and remembered on the device.

**Inspecting**
- Safari-inspired inspector: path, Left, Top, Width, Height and Corners boxes, box diagram, text style, colour and contrast, VoiceOver, tap area, Outline.
- Hover tips after a short pause. Skeleton view.

**Editing**
- Drag, nudge, smart snapping, rulers in points, guides pulled from the rulers, live distance while dragging.
- Align and space out, lined up with the key object (the first part picked), the selection, the parent or the screen. Group, lock (double-click to unlock).
- Option-drag copies, Shift-drag straight lines, ⌘-drag without snapping, Transform Again (⌘D).
- Notes on any part, with a bubble that stays visible. Undo and redo for every step.

**Handing back**
- Copy changes: one numbered list in points, measured on the device shown.
- Versions kept on the device, read-only when viewed, with onion skin (up to two layers each side) and a glide between them.

**Tools**
- `starter.html` for new prototypes, `tools/bundle.py` for one-file pages, `tools/check.py` for the self-check.
