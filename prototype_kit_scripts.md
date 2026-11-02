# Prototype kit · scripts (2 Nov 2026)

Kept here until the kit has its own repo. `kit.css` and `kit.js` live inside the published [Prototype kit demo](https://claude.ai/artifact/WTiCAEY7mAMmD9QgEKWtby) (version 1793637040-f3ec): its `<style id="kit-css">` and `<script id="kit-js">` blocks are the two files, word for word. The demo page is the same page with those two blocks swapped for `<link rel="stylesheet" href="kit.css">` and `<script src="kit.js"></script>`.

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
                    if (g["name"], opt) in [("Look", "Dark"), ("Device", "iPad"), ("View", "Inspect"), ("View", "Skeleton")] or (g["name"] == "Look" and opt == "Light"):
                        page.screenshot(path=str(shots / f"{label}_{g['name']}_{opt}.png".replace(" ", "_")))
                page.evaluate("([n]) => Kit.set(n, 0)", [g["name"]])

            # Editing tools
            page.evaluate("Kit.set('View', 1)")
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
            check("editing")
            page.evaluate("Kit.original(true)")
            check("show original")
            page.evaluate("Kit.original(false)")
            page.evaluate("Kit.set('View', 2)")
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
