"""Self-check for any prototype built on the kit.

Usage: python tools/check.py page.html [screenshots_folder]

Opens the page headless on a computer-sized window and a phone-sized one, then:
- goes through every option of every control, one at a time, and in each one checks for
  errors, sideways scroll, and "NaN", "undefined" or "null" on the prototype's screen;
- saves screenshots of light, dark, iPad, Inspect and Skeleton;
- tries the editing tools: pick, nudge, drag, number box, align, group, lock, versions, onion skin,
  copies, guides, Transform Again, deselect, hover tips, undo, redo, copy changes, and reload;
- with a stand-in for the page's own store on claude.ai: notes in note format v1 (SHARED.md), kept
  statuses, nothing typed stored, another device's changes, a fresh device, and the shared header;
- the "Real app" overlay: Over lines up with a screenshot at iPhone size, Beside sits next to the phone.
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


KIT = pathlib.Path(__file__).resolve().parent.parent

# A stand-in for claude.ai's page store (claude.use('db')), kept in sessionStorage so it outlives a reload.
FAKE_STORE = r"""(() => {
  const docs = JSON.parse(sessionStorage.getItem('__fakeDocs') || '{}'), subs = [];
  const persist = () => sessionStorage.setItem('__fakeDocs', JSON.stringify(docs));
  const fire = () => setTimeout(() => subs.forEach(f => f()), 0);
  const copy = v => JSON.parse(JSON.stringify(v));
  const snap = p => ({ id: p.split('/').pop(), exists: p in docs, data: () => copy(docs[p]) });
  const docRef = p => ({
    set: async v => { docs[p] = copy(v); persist(); fire(); },
    update: async v => { docs[p] = Object.assign({}, docs[p], copy(v)); persist(); fire(); },
    delete: async () => { delete docs[p]; persist(); fire(); },
    onSnapshot(cb) { const f = () => cb(snap(p)); subs.push(f); setTimeout(f, 0); return () => {}; } });
  const colRef = n => ({ doc: id => docRef(n + '/' + id),
    onSnapshot(cb) { const f = () => cb({ docs: Object.keys(docs).filter(k => k.startsWith(n + '/') && k.split('/').length === 2).map(snap), metadata: { fromCache: false } }); subs.push(f); setTimeout(f, 0); return () => {}; } });
  window.__store = { docs, set(p, v) { docs[p] = copy(v); persist(); fire(); } };
  window.claude = { use: async n => (n === 'db' ? { doc: docRef, collection: colRef } : null) };
})();"""

# A made-up "real app" screenshot at iPhone size: red lines at x 100 and y 200.
REAL_SVG = "data:image/svg+xml;utf8," + (
    "<svg xmlns='http://www.w3.org/2000/svg' width='402' height='874'>"
    "<rect width='402' height='874' fill='white'/><rect x='100' width='4' height='874' fill='red'/>"
    "<rect y='200' width='402' height='4' fill='red'/></svg>").replace("<", "%3C").replace(">", "%3E").replace("#", "%23")


def store_and_real_checks(browser, url, shots, problems, notes):
    def ready(page):
        page.wait_for_function("window.Kit && document.querySelector('.kit-screen')")
        page.wait_for_function("Kit.store().state !== 'loading'", timeout=5000)
        page.wait_for_timeout(150)

    def parts(page):
        return page.evaluate("""() => [...document.querySelectorAll('.kit-root [data-name]')]
          .filter(e => { const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4 && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName) && !e.closest('[aria-hidden=true]'); })
          .map(e => e.getAttribute('data-name')).filter((n, i, a) => a.indexOf(n) === i && document.querySelectorAll('[data-name="' + CSS.escape(n) + '"]').length === 1).slice(0, 3)""")

    def proto_notes(page):
        return page.evaluate("Object.entries(__store.docs).filter(([k, v]) => k.startsWith('notes/') && v.source === 'prototype').map(([k, v]) => Object.assign({ path: k }, v))")

    # 1. Store on: notes in note format v1
    ctx = browser.new_context(viewport={"width": 1280, "height": 900})
    ctx.add_init_script(FAKE_STORE)
    page = ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(url); ready(page)
    page.evaluate("localStorage.clear(); sessionStorage.removeItem('__fakeDocs')"); page.reload(); ready(page)
    if page.evaluate("Kit.store().state") != "ok":
        problems.append("store: didn't connect to the page's store"); ctx.close(); return
    if "kept on this page" not in page.inner_text(".kit-store"):
        problems.append("store: the panel doesn't say notes are kept on the page")
    names = parts(page)
    if len(names) < 2:
        notes.append("store: fewer than two named parts, store checks skipped"); ctx.close(); return
    a, b = names[0], names[1]
    page.evaluate(f"Kit.tap({json.dumps(a)})"); page.evaluate("Kit.nudge(0, 8)"); page.evaluate("Kit.note('Make this bigger')")
    page.evaluate(f"Kit.tap({json.dumps(b)})"); page.evaluate("Kit.note('Check the wording')")
    page.evaluate("Kit.push()"); page.wait_for_timeout(200)
    recs = {r["part"]: r for r in proto_notes(page)}
    ra = recs.get(a)
    if not ra:
        problems.append(f"store: no note record for {a}")
    else:
        need = ["v", "n", "source", "app", "screen", "part", "name", "text", "kind", "status", "box", "px", "element", "edits", "from", "created", "updated"]
        miss = [k for k in need if k not in ra]
        if miss: problems.append(f"store: record misses {miss}")
        if ra.get("v") != 1 or ra.get("source") != "prototype" or ra.get("status") != "open": problems.append(f"store: wrong v/source/status {ra.get('v')}, {ra.get('source')}, {ra.get('status')}")
        if ra.get("text") != "Make this bigger": problems.append("store: note text wrong")
        if (ra.get("edits") or {}).get("move", {}).get("dy") != 8: problems.append(f"store: move not recorded: {ra.get('edits')}")
        bx = ra.get("box") or {}
        if not all(0 <= bx.get(k, -1) <= 1 for k in "xywh"): problems.append(f"store: box isn't in fractions: {bx}")
        if not (ra.get("element") or {}).get("tag"): problems.append("store: element details missing")
        if (ra.get("from") or {}).get("kit") != "1.1.0": problems.append("store: from.kit isn't 1.1.0")
    draft = page.evaluate("__store.docs['kit/draft']")
    if not draft or not draft.get("model", {}).get("edits"): problems.append("store: draft not kept on the page")
    # nothing typed is ever stored
    has_input = page.evaluate("!!document.querySelector('.kit-root input')")
    if has_input:
        page.evaluate("Kit.inspect(false)"); page.fill(".kit-root input", "secret words typed"); page.evaluate("Kit.inspect(true)")
        page.evaluate("Kit.select(document.querySelector('.kit-root input'))"); page.evaluate("Kit.note('Search note')")
        page.evaluate("Kit.push()"); page.wait_for_timeout(200)
        if "secret words" in json.dumps(page.evaluate("__store.docs")): problems.append("store: text typed into a field was stored")
    # statuses set by Claude are kept; a changed note reopens a fixed one
    if ra:
        path = ra["path"]
        page.evaluate(f"__store.set({json.dumps(path)}, Object.assign({{}}, __store.docs[{json.dumps(path)}], {{ status: 'looking' }}))")
        page.wait_for_timeout(100); page.evaluate("Kit.push()"); page.wait_for_timeout(200)
        if page.evaluate(f"__store.docs[{json.dumps(path)}].status") != "looking": problems.append("store: a status set by Claude wasn't kept")
        page.evaluate(f"__store.set({json.dumps(path)}, Object.assign({{}}, __store.docs[{json.dumps(path)}], {{ status: 'fixed' }}))")
        page.wait_for_timeout(100)
        page.evaluate(f"Kit.tap({json.dumps(a)})"); page.evaluate("Kit.note('Make this bigger still')"); page.evaluate("Kit.push()"); page.wait_for_timeout(200)
        if page.evaluate(f"__store.docs[{json.dumps(path)}].status") != "open": problems.append("store: a changed note didn't reopen")
    # the shared header on Copy changes
    head = page.evaluate("Kit.changesText()").split("\n")
    if not head[0].startswith("Prototype changes · note format v1") or "Source: prototype" not in head[1] or "Kit 1.1.0" not in head[1] or "Version: " not in head[1]:
        problems.append(f"header: not the shared header: {head[:2]}")
    # another device changes the draft: this page picks it up, and Undo puts it back
    page.evaluate(f"""__store.set('kit/draft', {{ v: 1, model: {{ v: 1, edits: {{ {json.dumps('n:' + b)}: {{ name: {json.dumps(b)}, dx: 0, dy: 6 }} }} }}, t: Date.now() + 60000, by: 'other-device' }})""")
    page.wait_for_timeout(300)
    st = page.evaluate("Kit.state()")
    if list(st["edits"].keys()) != ["n:" + b] or (st["undo"] or [None])[-1] != "Changes from another device":
        problems.append(f"store: another device's changes weren't picked up: {list(st['edits'].keys())}, {st['undo'][-1:]}")
    page.wait_for_timeout(700)
    # a fresh device (nothing saved locally) opens with what the page keeps
    page.evaluate("localStorage.clear()"); page.reload(); ready(page); page.wait_for_timeout(200)
    if list(page.evaluate("Kit.state()")["edits"].keys()) != ["n:" + b]: problems.append("store: a fresh device didn't open with the page's changes")
    if len(proto_notes(page)) != 1: problems.append(f"store: notes didn't follow the draft ({len(proto_notes(page))} records)")
    page.evaluate("Kit.clear()"); page.evaluate("Kit.push()"); page.wait_for_timeout(200)
    if proto_notes(page): problems.append("store: notes stayed after the changes were cleared")
    if errors: problems.append(f"store: error: {errors[-1]}")
    ctx.close()

    # 2. Store off: kept on the device, as in 1.0
    ctx = browser.new_context(viewport={"width": 1280, "height": 900}); page = ctx.new_page()
    page.goto(url); ready(page)
    if page.evaluate("Kit.store().state") != "local" or "kept on this device" not in page.inner_text(".kit-store"):
        problems.append("store: without the page's store it should say notes are kept on this device")
    ctx.close()

    # 3. Real app over and beside, computer and phone
    for label, vp, mobile in [("computer", {"width": 1280, "height": 900}, False), ("phone", {"width": 402, "height": 874}, True)]:
        ctx = browser.new_context(viewport=vp, device_scale_factor=2, has_touch=mobile, is_mobile=mobile); page = ctx.new_page(); errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(url); ready(page); page.evaluate("localStorage.clear()"); page.reload(); ready(page)
        page.evaluate(f"Kit.real({json.dumps(REAL_SVG)}, 1); Kit.set('Strength', 2)")
        page.wait_for_function("document.querySelector('.kit-real').complete")
        page.wait_for_timeout(150)
        opts = next((g["options"] for g in page.evaluate("Kit.groups()") if g["name"] == "Real app"), None)
        want = ["Off", "Over"] if mobile else ["Off", "Over", "Beside"]
        if opts != want: problems.append(f"real · {label}: options {opts}, expected {want}")
        g = page.evaluate("""() => { const i = document.querySelector('.kit-real').getBoundingClientRect(), s = document.querySelector('.kit-screen').getBoundingClientRect();
          return { dl: i.left - s.left, dt: i.top - s.top, dw: i.width - s.width, ratio: i.height / i.width, shown: getComputedStyle(document.querySelector('.kit-real')).display, scale: s.width / 402, sl: s.left, st: s.top }; }""")
        if g["shown"] != "block" or abs(g["dl"]) > .5 or abs(g["dt"]) > .5 or (not mobile and abs(g["dw"]) > .5) or abs(g["ratio"] - 874 / 402) > .01:
            problems.append(f"real · {label}: overlay doesn't line up with the screen: {g}")
        if not mobile:
            # the red line at x 100 shows exactly 100 points in from the screen's left edge
            from PIL import Image
            shot = shots / f"{label}_real_over.png"; page.screenshot(path=str(shot))
            im = Image.open(shot).convert("RGB"); dpr = 2
            y = int((g["st"] + 400 * g["scale"]) * dpr)
            reds = [x for x in range(im.width) if (lambda p: p[0] > 180 and p[1] < 120 and p[2] < 120)(im.getpixel((x, y)))]
            x0 = (g["sl"] + 100 * g["scale"]) * dpr
            if not reds or abs(reds[0] - x0) > 2 * dpr: problems.append(f"real · {label}: red line at {reds[:1]}, expected about {x0:.0f}")
            page.evaluate("Kit.original(true)")
            if page.evaluate("getComputedStyle(document.querySelector('.kit-real')).display") != "none": problems.append("real: Show original should hide the overlay")
            page.evaluate("Kit.original(false); Kit.set('Real app', 2)"); page.wait_for_timeout(150)
            sb = page.evaluate("""() => { const a = document.querySelector('.kit-real-side img').getBoundingClientRect(), s = document.querySelector('.kit-screen').getBoundingClientRect(), de = document.documentElement;
              return { left: a.left - s.right, dt: a.top - s.top, dw: a.width - s.width, side: de.scrollWidth > innerWidth + 1, over: getComputedStyle(document.querySelector('.kit-real')).display }; }""")
            if sb["left"] < 10 or abs(sb["dt"]) > .5 or abs(sb["dw"]) > .5 or sb["side"] or sb["over"] != "none":
                problems.append(f"real · {label}: Beside isn't next to the phone at the same size: {sb}")
            page.screenshot(path=str(shots / f"{label}_real_beside.png"))
        else:
            page.screenshot(path=str(shots / f"{label}_real_over.png"))
        if errors: problems.append(f"real · {label}: error: {errors[-1]}")
        ctx.close()
    notes.append("store and real app: checked")


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
    # Serve the kit's own folder when the page lives inside it (so tools/plain.html finds ../kit.js).
    base = KIT if KIT in page_path.parents else page_path.parent
    srv = serve(base)
    url = f"http://127.0.0.1:{srv.server_address[1]}/{page_path.relative_to(base).as_posix()}"
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

            def settle():
                # Wait until the prototype's own transitions (page slides, springs) have finished, so measurements are fair.
                try:
                    page.wait_for_function("!document.getAnimations().some(a => a.playState === 'running' && !(a.effect && a.effect.getComputedTiming().iterations === Infinity))", timeout=5000)
                except Exception:
                    notes.append(f"{label}: something was still moving after 5 s")

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
            # Editing tools (need a few named parts; a blank starter page skips them)
            page.evaluate("Kit.inspect(true)")
            names = page.evaluate("[...document.querySelectorAll('.kit-root [data-name]')].map(e => e.dataset.name)")
            if len(names) < 5:
                notes.append(f"{label}: only {len(names)} named parts, so the editing tools weren't tried")
            else:
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
                settle()
                # Two separate small parts fully on screen, so a simulated tap lands on the part itself and not on something inside it
                leaves = page.evaluate("""() => { const s = document.querySelector('.kit-screen').getBoundingClientRect();
                  return [...document.querySelectorAll('.kit-root [data-name]')].filter(e => !e.querySelector('[data-name]') && !e.closest('[data-kit-dup]')).filter(e => {
                    const r = e.getBoundingClientRect(); return r.width >= 44 && r.height >= 40 && r.left >= s.left && r.right <= s.right && r.top >= s.top + 60 && r.bottom <= s.bottom - 100 && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) !== null; }).map(e => e.dataset.name); }""")
                a, b = (leaves + names[3:5])[:2] if len(leaves) >= 2 else (names[3], names[4])
                page.evaluate("([a, b]) => { Kit.tap(a); Kit.tap(b, true); Kit.setAlignTo('key'); }", [a, b])
                st = page.evaluate("Kit.state()")
                if st["key"] != a:
                    problems.append(f"{label}: key object should be the first picked ({a}), got {st['key']}")
                ra = page.evaluate("n => document.querySelector(`.kit-root [data-name='${n}']`).getBoundingClientRect().left", a)
                page.evaluate("Kit.align('r')")
                settle()
                ra2 = page.evaluate("n => document.querySelector(`.kit-root [data-name='${n}']`).getBoundingClientRect().left", a)
                rb = page.evaluate("([a, b]) => { const q = n => document.querySelector(`.kit-root [data-name='${n}']`).getBoundingClientRect(); return Math.abs(q(a).right - q(b).right); }", [a, b])
                if abs(ra - ra2) > 0.5 or rb > 0.6:
                    problems.append(f"{label}: align to key object moved the key or missed ({ra}->{ra2}, gap {rb})")
                # Lock: can't be nudged; double tap unlocks
                page.evaluate("n => { Kit.select(n); Kit.lock(); }", b)
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
                # Guides from the rulers, live distance while dragging, and Transform Again (computer only)
                if not mobile:
                    page.evaluate("Kit.clearGuides(); Kit.select([])")
                    rt = page.locator(".kit-ruler").first.bounding_box()
                    scr = page.locator(".kit-screen").bounding_box()
                    gx, gy0, gy = rt["x"] + rt["width"] / 2, rt["y"] + rt["height"] / 2, scr["y"] + scr["height"] * 0.4
                    page.mouse.move(gx, gy0)
                    page.mouse.down()
                    for k in range(1, 11):
                        page.mouse.move(gx, gy0 + (gy - gy0) * k / 10)
                    page.mouse.up()
                    gs = page.evaluate("Kit.state().guides")
                    if len(gs) != 1 or not gs[0].startswith("y "):
                        problems.append(f"{label}: dragging from the top ruler didn't make a level guide ({gs})")
                    page.mouse.move(scr["x"] + scr["width"] * 0.7, gy)
                    page.mouse.down()
                    for k in range(1, 11):
                        page.mouse.move(scr["x"] + scr["width"] * 0.7, gy - (gy - rt["y"] + 4) * k / 10)
                    page.mouse.up()
                    if page.evaluate("Kit.state().guides.length"):
                        problems.append(f"{label}: dragging a guide back onto its ruler didn't remove it ({gs})")
                    # live distance tag shows mid-drag
                    page.evaluate("n => Kit.select(n)", names[2])
                    bx = page.locator(f'.kit-root [data-name="{names[2]}"]').bounding_box()
                    cx, cy = bx["x"] + bx["width"] / 2, bx["y"] + bx["height"] / 2
                    page.mouse.move(cx, cy); page.keyboard.down("Alt"); page.mouse.down()
                    for k in range(1, 9):
                        page.mouse.move(cx, cy + k * 5)
                    live = page.evaluate("(document.querySelector('.kit-ov .kit-live') || {}).textContent || ''")
                    page.mouse.up(); page.keyboard.up("Alt")
                    if not live.startswith(("0, +", "+", "−")):
                        problems.append(f"{label}: no live distance while dragging ({live!r})")
                    n0 = page.evaluate("document.querySelectorAll('.kit-root [data-kit-dup]').length")
                    page.keyboard.press("Meta+KeyD")
                    page.keyboard.press("Meta+KeyD")
                    n2 = page.evaluate("document.querySelectorAll('.kit-root [data-kit-dup]').length")
                    st = page.evaluate("Kit.state()")
                    if n2 != n0 + 2 or st["undo"][-1:] != ["Copy again"]:
                        problems.append(f"{label}: ⌘D didn't repeat the copy ({n0} -> {n2}, {st['undo'][-2:]})")
                    check("after transform again")
                    page.screenshot(path=str(shots / f"{label}_repeat.png"))
                    page.evaluate("Kit.undo(); Kit.undo()")
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
        store_and_real_checks(browser, url, shots, problems, notes)
        browser.close()
    srv.shutdown()
    print(json.dumps({"ok": not problems, "problems": problems, "notes": notes, "screenshots": str(shots)}, indent=2))
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
