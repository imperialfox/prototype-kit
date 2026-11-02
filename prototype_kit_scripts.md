# Prototype kit · scripts (2 Nov 2026)

Kept here until the kit has its own repo. `kit.css` and `kit.js` live inside the published [Prototype kit demo](https://claude.ai/artifact/WTiCAEY7mAMmD9QgEKWtby) (version 1793640713-dd85): its `<style id="kit-css">` and `<script id="kit-js">` blocks are the two files, word for word. The demo page is the same page with those two blocks swapped for `<link rel="stylesheet" href="kit.css">` and `<script src="kit.js"></script>`.

## tools/bundle.py

```python
"""Copy the prototype kit into a prototype page, so it works as one file in the artifact viewer.

Usage: python tools/bundle.py my_prototype.html out.html

The prototype links the kit the normal way while it's being written:
    <link rel="stylesheet" href="kit.css">   and   <script src="kit.js"></script>
This swaps those two tags for the kit's own text. Nothing else in the page changes.
"""
import pathlib
import re
import sys

KIT = pathlib.Path(__file__).resolve().parent.parent


def bundle(html: str) -> str:
    css = (KIT / "kit.css").read_text(encoding="utf-8")
    js = (KIT / "kit.js").read_text(encoding="utf-8").replace("</script", "<\\/script")
    html, n_css = re.subn(r'<link[^>]*href="[^"]*kit\.css"[^>]*>', lambda m: '<style id="kit-css">\n' + css + "\n</style>", html)
    html, n_js = re.subn(r'<script[^>]*src="[^"]*kit\.js"[^>]*>\s*</script>', lambda m: '<script id="kit-js">\n' + js + "\n</script>", html)
    if n_css != 1 or n_js != 1:
        raise SystemExit(f"Expected one kit.css link and one kit.js script, found {n_css} and {n_js}.")
    return html


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    src, out = map(pathlib.Path, sys.argv[1:])
    out.write_text(bundle(src.read_text(encoding="utf-8")), encoding="utf-8")
    print(f"Bundled {src.name} → {out} ({out.stat().st_size // 1024} KB)")
```

## tools/check.py

```python
"""Self-check for any prototype built on the kit.

Usage: python tools/check.py page.html [screenshots_folder]

Opens the page headless on a computer-sized window and a phone-sized one, then:
- goes through every option of every control, one at a time, and in each one checks for
  errors, sideways scroll, and "NaN", "undefined" or "null" on the prototype's screen;
- saves screenshots of light, dark, iPad, Inspect and Skeleton;
- tries the editing tools: pick, nudge, drag, number box, align, group, undo, redo, copy changes.
Prints a short report and exits with 1 if anything failed.
"""
import functools
import http.server
import json
import pathlib
import re
import sys
import threading

from playwright.sync_api import sync_playwright

BAD = re.compile(r"\b(NaN|undefined|null)\b")


def serve(folder: pathlib.Path):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    handler = functools.partial(Quiet, directory=str(folder))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def main():
    page_path = pathlib.Path(sys.argv[1]).resolve()
    shots = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else "kit-check").resolve()
    shots.mkdir(parents=True, exist_ok=True)
    srv = serve(page_path.parent)
    url = f"http://127.0.0.1:{srv.server_address[1]}/{page_path.name}"
    problems, notes = [], []

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for label, vp, mobile in [("computer", {"width": 1280, "height": 900}, False), ("phone", {"width": 402, "height": 874}, True)]:
            ctx = browser.new_context(viewport=vp, device_scale_factor=2, has_touch=mobile, is_mobile=mobile)
            page = ctx.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.goto(url)
            page.wait_for_function("window.Kit && document.querySelector('.kit-screen')")
            page.evaluate("localStorage.clear()")
            page.reload()
            page.wait_for_function("window.Kit && document.querySelector('.kit-screen')")
            page.wait_for_timeout(200)

            def check(state):
                r = page.evaluate("""() => {
                  const de = document.documentElement, root = document.querySelector('.kit-root');
                  return { side: de.scrollWidth > innerWidth + 1, text: root ? root.innerText : '' };
                }""")
                if r["side"]:
                    problems.append(f"{label} · {state}: sideways scroll")
                m = BAD.search(r["text"])
                if m:
                    problems.append(f"{label} · {state}: '{m.group(0)}' on screen")
                if errors:
                    problems.append(f"{label} · {state}: error: {errors[-1]}")
                    errors.clear()

            groups = page.evaluate("Kit.groups()")
            for g in groups:
                if g["name"].startswith("Launcher"):
                    continue
                for i, opt in enumerate(g["options"]):
                    page.evaluate("([n, i]) => Kit.set(n, i)", [g["name"], i])
                    page.wait_for_timeout(120)
                    check(f"{g['name']} {opt}")
                    if (g["name"], opt) in [("Look", "Dark"), ("Device", "iPad"), ("View", "Skeleton")] or (g["name"] == "Look" and opt == "Light"):
                        page.screenshot(path=str(shots / f"{label}_{g['name']}_{opt}.png".replace(" ", "_")))
                page.evaluate("([n]) => Kit.set(n, 0)", [g["name"]])

            # Inspect is its own switch: on by default, can be turned off and back on
            if not page.evaluate("Kit.get().inspect"):
                problems.append(f"{label}: Inspect should start on")
            for v, name in [(False, "Inspect off"), (True, "Inspect on")]:
                page.evaluate("v => Kit.inspect(v)", v)
                page.wait_for_timeout(120)
                check(name)
                page.screenshot(path=str(shots / f"{label}_{name.replace(' ', '_')}.png"))
            # Editing tools
            page.evaluate("Kit.inspect(true)")
            names = page.evaluate("[...document.querySelectorAll('.kit-root [data-name]')].map(e => e.dataset.name)")
            target = names[2] if len(names) > 2 else names[0]
            ok = page.evaluate("n => Kit.select(n)", target)
            if not ok:
                problems.append(f"{label}: couldn't pick {target}")
            for _ in range(8):
                page.evaluate("Kit.nudge(0, 1)")
            st = page.evaluate("Kit.state()")
            if st["undo"].count("Nudge") != 1:
                problems.append(f"{label}: eight quick nudges should be one undo step, got {st['undo']}")
            txt = page.evaluate("Kit.changesText()")
            if "move down 8" not in txt:
                problems.append(f"{label}: changes text missing 'move down 8': {txt!r}")
            page.evaluate("Kit.field('x', '+4')")
            page.evaluate("Kit.field('w', '120')")
            page.evaluate("Kit.field('r', '12')")
            txt = page.evaluate("Kit.changesText()")
            for want in ["right 4", "width", "corners"]:
                if want not in txt:
                    problems.append(f"{label}: changes text missing '{want}'")
            page.evaluate("Kit.undo(); Kit.undo(); Kit.undo(); Kit.undo()")
            if page.evaluate("Kit.changesText()"):
                problems.append(f"{label}: four undos should leave no changes")
            page.evaluate("Kit.redo()")
            if "move down 8" not in page.evaluate("Kit.changesText()"):
                problems.append(f"{label}: redo didn't bring the move back")
            # Several at once: align, space out, group
            many = names[3:6] if len(names) >= 6 else names[:3]
            page.evaluate("ns => Kit.select(ns)", many)
            page.evaluate("Kit.setAlignTo('selection'); Kit.align('l'); Kit.group()")
            st = page.evaluate("Kit.state()")
            if "Group" not in st["undo"]:
                problems.append(f"{label}: grouping didn't make an undo step ({st['undo']})")
            if "Grouped:" not in page.evaluate("Kit.changesText()"):
                problems.append(f"{label}: changes text doesn't list the group")
            # A real drag with the mouse (computer only)
            if not mobile:
                page.evaluate("n => Kit.select(n)", target)
                box = page.locator(f'.kit-root [data-name="{target}"]').bounding_box()
                cx, cy = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
                page.mouse.move(cx, cy)
                page.mouse.down()
                for k in range(1, 11):
                    page.mouse.move(cx + k * 3, cy + k * 2)
                page.mouse.up()
                st = page.evaluate("Kit.state()")
                if st["undo"][-1:] != ["Move"]:
                    problems.append(f"{label}: dragging didn't make a Move step ({st['undo'][-3:]})")
                page.screenshot(path=str(shots / f"{label}_editing.png"))
            # Key object: the first picked stays put, the others line up to it
            page.evaluate("Kit.clear()")
            a, b = names[3], names[4]
            page.evaluate("([a, b]) => { Kit.tap(a); Kit.tap(b, true); Kit.setAlignTo('key'); }", [a, b])
            st = page.evaluate("Kit.state()")
            if st["key"] != a:
                problems.append(f"{label}: key object should be the first picked ({a}), got {st['key']}")
            ra = page.evaluate("n => document.querySelector(`.kit-root [data-name='${n}']`).getBoundingClientRect().left", a)
            page.evaluate("Kit.align('r')")
            ra2 = page.evaluate("n => document.querySelector(`.kit-root [data-name='${n}']`).getBoundingClientRect().left", a)
            rb = page.evaluate("([a, b]) => { const q = n => document.querySelector(`.kit-root [data-name='${n}']`).getBoundingClientRect(); return Math.abs(q(a).right - q(b).right); }", [a, b])
            if abs(ra - ra2) > 0.5 or rb > 0.6:
                problems.append(f"{label}: align to key object moved the key or missed ({ra}->{ra2}, gap {rb})")
            # Lock: can't be nudged; double tap unlocks
            page.evaluate("n => { Kit.tap(n); Kit.lock(); }", b)
            before = page.evaluate("Kit.changesText()")
            page.evaluate("Kit.nudge(0, 5)")
            if page.evaluate("Kit.changesText()") != before:
                problems.append(f"{label}: a locked part moved when nudged")
            page.evaluate("n => { Kit.tap(n); Kit.tap(n); }", b)
            page.evaluate("Kit.nudge(0, 5)")
            if page.evaluate("Kit.changesText()") == before:
                problems.append(f"{label}: double tap didn't unlock")
            # Versions: save, change, view, make draft, undo
            page.evaluate("Kit.saveVersion('First try')")
            page.evaluate("Kit.nudge(0, 3)")
            draft = page.evaluate("Kit.changesText()")
            page.evaluate("Kit.view(0)")
            v = page.evaluate("Kit.changesText()")
            if 'version “First try”' not in v or v.split("\n")[3:] == draft.split("\n")[3:]:
                problems.append(f"{label}: viewing a version didn't show its own changes")
            page.evaluate("Kit.nudge(0, 3)")
            if page.evaluate("Kit.changesText()") != v:
                problems.append(f"{label}: a viewed version could be changed")
            check("viewing a version")
            page.evaluate("Kit.makeDraft()")
            if page.evaluate("Kit.state()")["viewing"] != -1 or page.evaluate("Kit.changesText()").split("\n")[3:] != v.split("\n")[3:]:
                problems.append(f"{label}: make this the draft didn't copy the version")
            page.evaluate("Kit.undo()")
            if page.evaluate("Kit.changesText()").split("\n")[3:] != draft.split("\n")[3:]:
                problems.append(f"{label}: undo didn't bring the old draft back")
            if page.evaluate("Kit.versions()") != ["First try"]:
                problems.append(f"{label}: versions list wrong")
            # Onion skin: ghosts of the version before (and after), and a glide when switching
            page.evaluate("Kit.view(-1)")
            page.wait_for_function("!Kit.state().tweening")
            page.evaluate("n => { Kit.select(n); Kit.nudge(0, 10); Kit.nudge(12, 0); }", names[2])
            page.evaluate("Kit.onion(1)")
            if not page.evaluate("document.querySelectorAll('.kit-ov .kit-ghost').length"):
                problems.append(f"{label}: onion skin Before shows no ghost on Draft")
            page.evaluate("Kit.onion(0)")
            if page.evaluate("document.querySelectorAll('.kit-ov .kit-ghost').length"):
                problems.append(f"{label}: onion skin Off still shows ghosts")
            page.evaluate("Kit.onion(2); Kit.view(0)")
            if not page.evaluate("Kit.state().tweening"):
                problems.append(f"{label}: switching versions didn't glide")
            page.wait_for_timeout(600)
            if page.evaluate("Kit.state().tweening"):
                problems.append(f"{label}: the glide didn't finish")
            if not page.evaluate("document.querySelectorAll('.kit-ov .kit-ghost').length"):
                problems.append(f"{label}: onion skin Both shows no ghost of the draft after this version")
            page.screenshot(path=str(shots / f"{label}_onion.png"))
            check("onion skin")
            # Two layers: the version before that shows too, fainter
            page.evaluate("Kit.view(-1)")
            page.wait_for_function("!Kit.state().tweening")
            page.evaluate("n => { Kit.saveVersion('Second try'); Kit.select(n); Kit.nudge(0, 14); }", names[2])
            page.evaluate("Kit.onion(1, 2)")
            two = page.evaluate("[document.querySelectorAll('.kit-ov .kit-ghost-1').length, document.querySelectorAll('.kit-ov .kit-ghost-2').length]")
            if not two[0] or not two[1]:
                problems.append(f"{label}: two onion layers should both show ghosts, got {two}")
            fade = page.evaluate("(() => { const a = document.querySelector('.kit-ov .kit-ghost-1'), b = document.querySelector('.kit-ov .kit-ghost-2'); return a && b ? [+a.getAttribute('stroke-opacity'), +b.getAttribute('stroke-opacity')] : [0, 0]; })()")
            if not fade[1] < fade[0]:
                problems.append(f"{label}: the second onion layer isn't fainter ({fade})")
            page.evaluate("Kit.onion(1, 1)")
            if page.evaluate("document.querySelectorAll('.kit-ov .kit-ghost-2').length"):
                problems.append(f"{label}: one layer still shows a second ghost")
            page.evaluate("Kit.onion(1, 2)")
            page.screenshot(path=str(shots / f"{label}_onion_two_layers.png"))
            check("onion skin, two layers")
            # Shift-drag moves straight; Option-drag makes a copy; Delete removes a copy (computer only)
            if not mobile:
                def drag_part(n, dx, dy, hold=None):
                    page.evaluate("n => Kit.select(n)", n)
                    bx = page.locator(f'.kit-root [data-name="{n}"]').bounding_box()
                    cx, cy = bx["x"] + bx["width"] / 2, bx["y"] + bx["height"] / 2
                    page.mouse.move(cx, cy)
                    if hold: page.keyboard.down(hold)
                    page.mouse.down()
                    for k in range(1, 13):
                        page.mouse.move(cx + dx * k / 12, cy + dy * k / 12)
                    page.mouse.up()
                    if hold: page.keyboard.up(hold)
                tgt = names[1]
                y0 = page.locator(f'.kit-root [data-name="{tgt}"]').bounding_box()["y"]
                drag_part(tgt, 60, 14, "Shift")
                y1 = page.locator(f'.kit-root [data-name="{tgt}"]').bounding_box()["y"]
                if abs(y1 - y0) > 0.6:
                    problems.append(f"{label}: Shift-drag moved up or down ({y0} -> {y1})")
                drag_part(tgt, 10, 70, "Alt")
                st = page.evaluate("Kit.state()")
                copies = page.evaluate("document.querySelectorAll('.kit-root [data-kit-dup]').length")
                if st["undo"][-1:] != ["Duplicate"] or copies < 1:
                    problems.append(f"{label}: Option-drag didn't make a copy ({st['undo'][-2:]}, {copies} copies)")
                if "add a copy of" not in page.evaluate("Kit.changesText()"):
                    problems.append(f"{label}: changes text doesn't list the copy")
                if abs(page.locator(f'.kit-root [data-name="{tgt}"]').bounding_box()["y"] - y1) > 0.6:
                    problems.append(f"{label}: Option-drag moved the original")
                check("with a copy")
                page.screenshot(path=str(shots / f"{label}_copy.png"))
                page.keyboard.press("Delete")
                if page.evaluate("document.querySelectorAll('.kit-root [data-kit-dup]').length") != copies - 1:
                    problems.append(f"{label}: Delete didn't remove the copy")
                page.evaluate("Kit.undo()")
                if page.evaluate("document.querySelectorAll('.kit-root [data-kit-dup]').length") != copies:
                    problems.append(f"{label}: undo didn't bring the copy back")
                page.evaluate("n => Kit.select(n)", tgt)
                page.keyboard.press("Delete")
                if page.evaluate("Kit.state().sel.length") == 0:
                    problems.append(f"{label}: Delete on an original part did something")
            # Deselect: a click outside the phone, Esc, or Shift+Cmd+A
            if not mobile:
                page.evaluate("n => Kit.select(n)", names[1])
                pt = page.evaluate("""() => { const r = document.querySelector('.kit-canvas').getBoundingClientRect(); const x = r.right + 8, y = r.top + r.height / 2; const e = document.elementFromPoint(x, y); return { x, y, ok: !!(e && e.classList.contains('kit-stage')) }; }""")
                if pt["ok"]:
                    page.mouse.click(pt["x"], pt["y"])
                    if page.evaluate("Kit.state().sel.length"):
                        problems.append(f"{label}: clicking outside the phone didn't deselect")
                else:
                    notes.append(f"{label}: no empty background found to click")
                for keys in ["Escape", "Shift+Meta+KeyA", "Shift+Control+KeyA"]:
                    page.evaluate("n => Kit.select(n)", names[1])
                    page.keyboard.press(keys)
                    if page.evaluate("Kit.state().sel.length"):
                        problems.append(f"{label}: {keys} didn't deselect")
                # A click on the inspector keeps the selection
                page.evaluate("n => Kit.select(n)", names[1])
                page.locator(".kit-insp .kit-sh").first.click()
                if not page.evaluate("Kit.state().sel.length"):
                    problems.append(f"{label}: clicking the inspector cleared the selection")
            # Hover tips: appear after a pause, mouse only
            if not mobile:
                btn = page.locator(".kit-insp [data-tip]").first
                btn.hover()
                page.wait_for_timeout(200)
                early = page.evaluate("!!document.querySelector('.kit-tip.on')")
                page.wait_for_timeout(700)
                late = page.evaluate("(document.querySelector('.kit-tip.on') || {}).textContent || ''")
                if early or not late:
                    problems.append(f"{label}: hover tip timing wrong (early={early}, text={late!r})")
                page.screenshot(path=str(shots / f"{label}_tip.png"))
                page.mouse.move(5, 5)
            check("editing")
            page.evaluate("Kit.original(true)")
            check("show original")
            page.evaluate("Kit.original(false)")
            # A note shows as a bubble even with Inspect off
            page.evaluate("n => { Kit.select(n); Kit.note('Make this bolder'); }", names[1])
            page.evaluate("Kit.inspect(false)")
            if not page.evaluate("!!document.querySelector('.kit-ov .kit-bubble')"):
                problems.append(f"{label}: no note bubble with Inspect off")
            page.screenshot(path=str(shots / f"{label}_note_bubble_inspect_off.png"))
            check("note bubble, inspect off")
            page.evaluate("Kit.inspect(true)")
            page.evaluate("Kit.set('View', 1)")
            page.wait_for_timeout(100)
            page.screenshot(path=str(shots / f"{label}_skeleton_with_changes.png"))
            check("skeleton with changes")
            # Saved on the device: reload keeps the changes
            before = page.evaluate("Kit.changesText()")
            page.reload()
            page.wait_for_function("window.Kit && document.querySelector('.kit-screen')")
            after = page.evaluate("Kit.changesText()")
            if before.split("\n")[3:] != after.split("\n")[3:]:
                problems.append(f"{label}: changes weren't kept after a reload")
            check("after reload")
            page.evaluate("Kit.clear()")
            page.evaluate("localStorage.clear()")
            notes.append(f"{label}: {sum(len(g['options']) for g in groups)} control states checked")
            ctx.close()
        browser.close()
    srv.shutdown()
    print(json.dumps({"ok": not problems, "problems": problems, "notes": notes, "screenshots": str(shots)}, indent=2))
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
```
