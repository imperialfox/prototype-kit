/* Prototype kit 1.0 · shared frame, controls, inspector and editing tools for Ivan's app prototypes.
   Prototype-only: nothing here is ever built into an app.
   Use: put the app in one element (e.g. <div id="app">), then call Kit.start({ app: 'Suki', root: '#app', controls: [...] }). */
(function () {
  'use strict';

  const DEV = {
    iphone: { w: 402, h: 874, r: 54, b: 10, label: 'iPhone' },
    ipad: { w: 820, h: 1180, r: 30, b: 14, label: 'iPad' },
    mac: { w: 1440, h: 900, r: 12, b: 3, label: 'Mac' }
  };
  const STY = { 68: 'Big numeral', 56: 'Big numeral', 44: 'Big numeral', 34: 'Large title', 28: 'Title 1', 22: 'Title 2', 20: 'Title 3', 17: 'Body', 16: 'Callout', 15: 'Subhead', 13: 'Footnote', 12: 'Caption 1', 11: 'Caption 2' };
  const PINK = '#e0457b', BLUE = '#007aff', RED = '#ff3b30', NS = 'http://www.w3.org/2000/svg';
  const AN = { l: 'Align left', c: 'Align centre', r: 'Align right', t: 'Align top', m: 'Align middle', b: 'Align bottom' };

  const S = {
    opts: null, root: null, el: {}, device: 'iphone', look: 0, motion: 0, view: 0, custom: {},
    phone: false, open: true, launcher: 'circle', scale: 1,
    sel: [], key: null, multi: false, snap: true, alignTo: 'selection', original: false,
    model: { v: 1, edits: {} }, undo: [], redo: [], lastNudge: 0, nextGroup: 1,
    hover: null, ptr: null, guides: [], cursor: null, err: '', status: '', showText: false, copied: null,
    inspShut: true, tok: new Map(), touched: new Set(), raf: 0, lsKey: ''
  };

  /* ---------- small helpers ---------- */
  const r1 = v => Math.round(v);
  const fmt = v => { const n = Math.round(v * 10) / 10; return String(Number.isInteger(n) ? n : n.toFixed(1)); };
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const k in (attrs || {})) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'style') e.style.cssText = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    kids.flat(Infinity).forEach(c => { if (c == null || c === false) return; e.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c))); });
    return e;
  }
  function sv(tag, attrs, txt) {
    const e = document.createElementNS(NS, tag);
    for (const k in (attrs || {})) e.setAttribute(k, attrs[k]);
    if (txt != null) e.textContent = txt;
    return e;
  }
  function icon(k) {
    const s = sv('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' });
    const L = (a, b, c, d) => s.appendChild(sv('line', { x1: a, y1: b, x2: c, y2: d }));
    const R = (x, y, w, hh) => s.appendChild(sv('rect', { x, y, width: w, height: hh, rx: 1 }));
    const P = d => s.appendChild(sv('path', { d }));
    switch (k) {
      case 'sliders': L(2, 4, 14, 4); L(2, 8, 14, 8); L(2, 12, 14, 12);
        [[5, 4], [11, 8], [7, 12]].forEach(([x, y]) => s.appendChild(sv('circle', { cx: x, cy: y, r: 1.8, fill: 'currentColor' }))); break;
      case 'chev': P('M6 3l5 5-5 5'); break;
      case 'min': P('M9.5 2.5v4h4M6.5 13.5v-4h-4'); break;
      case 'l': L(2, 2, 2, 14); R(4, 4, 9, 3); R(4, 9, 6, 3); break;
      case 'c': L(8, 2, 8, 14); R(3, 4, 10, 3); R(5, 9, 6, 3); break;
      case 'r': L(14, 2, 14, 14); R(3, 4, 9, 3); R(6, 9, 6, 3); break;
      case 't': L(2, 2, 14, 2); R(4, 4, 3, 9); R(9, 4, 3, 6); break;
      case 'm': L(2, 8, 14, 8); R(4, 3, 3, 10); R(9, 5, 3, 6); break;
      case 'b': L(2, 14, 14, 14); R(4, 3, 3, 9); R(9, 6, 3, 6); break;
      case 'dx': L(2, 2, 2, 14); L(14, 2, 14, 14); R(5, 5, 2, 6); R(9, 5, 2, 6); break;
      case 'dy': L(2, 2, 14, 2); L(2, 14, 14, 14); R(5, 5, 6, 2); R(5, 9, 6, 2); break;
      case 'undo': P('M5 3.5L2 6.5l3 3M2 6.5h8a4 4 0 010 8H8'); break;
      case 'redo': P('M11 3.5l3 3-3 3M14 6.5H6a4 4 0 000 8h2'); break;
    }
    return s;
  }
  const store = (() => { try { const t = '__kit_t'; localStorage.setItem(t, '1'); localStorage.removeItem(t); return localStorage; } catch (e) { return null; } })();

  /* ---------- keys, names, geometry ---------- */
  function pathOf(el) {
    const parts = []; let e = el;
    while (e && e !== S.root) { const p = e.parentElement; if (!p) return null; parts.unshift([...p.children].indexOf(e)); e = p; }
    return parts.join('.');
  }
  function keyOf(el) {
    const n = el.getAttribute && el.getAttribute('data-name');
    if (n && S.root.querySelectorAll('[data-name="' + CSS.escape(n) + '"]').length === 1) return 'n:' + n;
    return 'p:' + pathOf(el);
  }
  function elOf(k) {
    if (!k) return null;
    if (k.startsWith('n:')) return S.root.querySelector('[data-name="' + CSS.escape(k.slice(2)) + '"]');
    let e = S.root;
    for (const i of k.slice(2).split('.')) { if (i === '') continue; e = e && e.children[+i]; }
    return e && e !== S.root ? e : null;
  }
  function nameOf(el) {
    if (!el) return '';
    const n = el.getAttribute('data-name'); if (n) return n;
    const al = el.getAttribute('aria-label');
    const tag = el.tagName.toLowerCase(), role = el.getAttribute('role');
    const txt = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
    const short = txt.length > 24 ? txt.slice(0, 23) + '…' : txt;
    const near = () => { const p = el.parentElement && el.parentElement.closest('[data-name]'); return p && S.root.contains(p) ? p.getAttribute('data-name') : 'screen'; };
    if (tag === 'button' || role === 'button' || role === 'tab') return 'Button: ' + (al || short || 'icon');
    if (tag === 'a') return 'Link: ' + (al || short || 'link');
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return 'Text box' + (el.placeholder ? ': ' + el.placeholder : '');
    if (/^h[1-6]$/.test(tag)) return 'Heading: ' + (short || 'empty');
    if (tag === 'img') return 'Image' + (el.alt ? ': ' + el.alt : '');
    if (tag === 'svg') return al ? 'Icon: ' + al : 'Icon in ' + near();
    if (el instanceof SVGElement) return tag === 'text' ? 'Chart text: ' + short : 'Shape in ' + near();
    if (tag === 'li' || role === 'listitem') return 'Row: ' + (short || 'empty');
    if (tag === 'ul' || tag === 'ol') return 'List in ' + near();
    const own = [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
    if (own && short) return 'Text: ' + short;
    return 'Box in ' + near();
  }
  const scr = () => S.el.screen;
  function sRect() { return scr().getBoundingClientRect(); }
  function sc() { const r = sRect(); return (r.width / (scr().offsetWidth || 1)) || 1; }
  function rectOf(el) { const a = el.getBoundingClientRect(), b = sRect(), s = sc(); return { x: (a.left - b.left) / s, y: (a.top - b.top) / s, w: a.width / s, h: a.height / s }; }
  function pt(cx, cy) { const b = sRect(), s = sc(); return { x: (cx - b.left) / s, y: (cy - b.top) / s }; }
  function bounds(list) {
    const rs = list.map(o => (o.nodeType ? rectOf(o) : o));
    const x = Math.min(...rs.map(r => r.x)), y = Math.min(...rs.map(r => r.y));
    return { x, y, w: Math.max(...rs.map(r => r.x + r.w)) - x, h: Math.max(...rs.map(r => r.y + r.h)) - y };
  }
  function contentBox(el) {
    const r = rectOf(el), cs = getComputedStyle(el), n = p => parseFloat(cs[p]) || 0;
    const l = n('borderLeftWidth') + n('paddingLeft'), t = n('borderTopWidth') + n('paddingTop');
    return { x: r.x + l, y: r.y + t, w: r.w - l - n('borderRightWidth') - n('paddingRight'), h: r.h - t - n('borderBottomWidth') - n('paddingBottom') };
  }
  function scrollable(el) {
    let e = el;
    while (e && e !== scr()) {
      if (e.nodeType === 1) { const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowY + cs.overflowX) && (e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1)) return e; }
      e = e.parentElement;
    }
    return null;
  }
  const liveSel = () => { S.sel = S.sel.filter(e => e.isConnected && S.root.contains(e)); return S.sel; };

  /* ---------- the edit model ---------- */
  function E(el) { const k = keyOf(el); return S.model.edits[k] || (S.model.edits[k] = { name: nameOf(el) }); }
  function peek(el) { return S.model.edits[keyOf(el)] || null; }
  function prune() {
    const ed = S.model.edits;
    for (const k in ed) {
      const e = ed[k];
      if (e.dx && Math.abs(e.dx) < 0.05) delete e.dx; if (e.dy && Math.abs(e.dy) < 0.05) delete e.dy;
      if (e.dx === 0) delete e.dx; if (e.dy === 0) delete e.dy;
      ['w', 'h', 'r'].forEach(f => {
        if (e[f] == null) { delete e[f]; delete e[f + '0']; }
        else if (e[f + '0'] != null && Math.abs(e[f] - e[f + '0']) < 0.5) { delete e[f]; delete e[f + '0']; }
      });
      if (e.note != null && !String(e.note).trim()) delete e.note;
      if (!e.g) delete e.g;
      if (!e.dx && !e.dy && e.w == null && e.h == null && e.r == null && !e.note && !e.g) delete ed[k];
    }
  }
  function applyEl(el, e) {
    if (!el) return;
    if (!el.__kitOrig) { const st = el.style; el.__kitOrig = { translate: st.translate, width: st.width, height: st.height, borderRadius: st.borderRadius, boxSizing: st.boxSizing, flex: st.flex }; }
    const o = el.__kitOrig, st = el.style;
    const on = e && !S.original;
    st.translate = on && (e.dx || e.dy) ? `${e.dx || 0}px ${e.dy || 0}px` : o.translate;
    const sized = on && (e.w != null || e.h != null);
    st.boxSizing = sized ? 'border-box' : o.boxSizing;
    st.flex = sized ? '0 0 auto' : o.flex;
    st.width = on && e.w != null ? e.w + 'px' : o.width;
    st.height = on && e.h != null ? e.h + 'px' : o.height;
    st.borderRadius = on && e.r != null ? e.r + 'px' : o.borderRadius;
  }
  function applyAll() {
    const seen = new Set();
    for (const k in S.model.edits) { const el = elOf(k); if (el) { seen.add(el); S.touched.add(el); applyEl(el, S.model.edits[k]); } }
    S.touched.forEach(el => { if (!seen.has(el)) { applyEl(el, null); if (!el.isConnected) S.touched.delete(el); } });
  }
  function members(el) {
    const e = peek(el);
    if (!e || !e.g) return [el];
    const out = [];
    for (const k in S.model.edits) if (S.model.edits[k].g === e.g) { const m = elOf(k); if (m) out.push(m); }
    return out.length ? out : [el];
  }
  function units() {
    const m = new Map();
    liveSel().forEach(o => { const e = peek(o); const k = e && e.g ? 'g' + e.g : o; if (!m.has(k)) m.set(k, []); m.get(k).push(o); });
    return [...m.values()];
  }
  function changeList() {
    const out = [];
    for (const k in S.model.edits) {
      const e = S.model.edits[k];
      if (!e.dx && !e.dy && e.w == null && e.h == null && e.r == null && !e.note) continue;
      const el = elOf(k);
      out.push({ k, e, el, r: el ? rectOf(el) : { x: 0, y: 1e9 } });
    }
    return out.sort((a, b) => (a.r.y - b.r.y) || (a.r.x - b.r.x));
  }
  function groupsList() {
    const m = new Map();
    for (const k in S.model.edits) { const e = S.model.edits[k]; if (e.g) { if (!m.has(e.g)) m.set(e.g, []); m.get(e.g).push(e.name); } }
    return [...m.values()].filter(g => g.length > 1);
  }
  function changesText() {
    const list = changeList(), gs = groupsList();
    if (!list.length && !gs.length) return '';
    const d = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const lines = [`Changes to the ${S.opts.app} prototype${S.opts.title ? ' (' + S.opts.title + ')' : ''}, ${d}`, 'Measured in iPhone points.', ''];
    list.forEach((c, i) => {
      const e = c.e, parts = [], mv = [];
      if (e.dx) mv.push((e.dx > 0 ? 'right ' : 'left ') + fmt(Math.abs(e.dx)));
      if (e.dy) mv.push((e.dy > 0 ? 'down ' : 'up ') + fmt(Math.abs(e.dy)));
      if (mv.length) parts.push('move ' + mv.join(', '));
      if (e.w != null) parts.push(`width ${fmt(e.w0)} → ${fmt(e.w)}`);
      if (e.h != null) parts.push(`height ${fmt(e.h0)} → ${fmt(e.h)}`);
      if (e.r != null) parts.push(`corners ${fmt(e.r0)} → ${fmt(e.r)}`);
      let line = `${i + 1}. ${e.name}` + (parts.length ? ': ' + parts.join('; ') : '');
      if (e.note) line += (parts.length ? '\n   ' : ' · ') + 'Note: ' + e.note.trim();
      lines.push(line);
    });
    if (gs.length) { lines.push(''); gs.forEach(g => lines.push('Grouped: ' + g.join(', '))); }
    return lines.join('\n');
  }

  /* ---------- undo and saving ---------- */
  const snapM = () => ({ m: JSON.stringify(S.model), sel: liveSel().map(keyOf), key: S.key ? keyOf(S.key) : null });
  function save() { if (!store) return; try { store.setItem(S.lsKey, JSON.stringify(S.model)); } catch (e) { S.err = "Couldn't keep your changes on this device"; } }
  function load() {
    if (!store) return;
    try {
      const raw = store.getItem(S.lsKey); if (!raw) return;
      const m = JSON.parse(raw); if (!m || typeof m !== 'object' || !m.edits || typeof m.edits !== 'object') return;
      const ok = {};
      for (const k in m.edits) {
        const e = m.edits[k]; if (!e || typeof e !== 'object' || !/^[np]:/.test(k)) continue;
        const c = { name: String(e.name || 'Box').slice(0, 80) };
        ['dx', 'dy', 'w', 'h', 'r', 'w0', 'h0', 'r0', 'g'].forEach(f => { if (Number.isFinite(e[f])) c[f] = e[f]; });
        if (typeof e.note === 'string') c.note = e.note.slice(0, 500);
        ok[k] = c;
      }
      S.model = { v: 1, edits: ok };
      S.nextGroup = 1 + Math.max(0, ...Object.values(ok).map(e => e.g || 0));
    } catch (e) { /* unreadable saved changes are ignored; the prototype opens clean */ }
  }
  function commit(name, fn) {
    const before = snapM();
    fn(); prune(); applyAll();
    if (before.m !== JSON.stringify(S.model)) { S.undo.push({ name, st: before }); if (S.undo.length > 300) S.undo.shift(); S.redo = []; save(); }
    render();
  }
  function restore(st) { S.model = JSON.parse(st.m); S.sel = st.sel.map(elOf).filter(Boolean); S.key = st.key ? elOf(st.key) : null; applyAll(); save(); }
  function undo() { S.err = ''; if (!S.undo.length) { S.status = 'Nothing to undo'; return render(); } const u = S.undo.pop(); S.redo.push({ name: u.name, st: snapM() }); restore(u.st); S.status = 'Undid ' + u.name.toLowerCase(); render(); }
  function redo() { S.err = ''; if (!S.redo.length) { S.status = 'Nothing to redo'; return render(); } const u = S.redo.pop(); S.undo.push({ name: u.name, st: snapM() }); restore(u.st); S.status = 'Redid ' + u.name.toLowerCase(); render(); }

  /* ---------- controls panel ---------- */
  function groups() {
    const devs = ['iphone', 'ipad'].concat(S.opts.mac ? ['mac'] : []);
    const g = [
      { name: 'Device', options: devs.map(d => DEV[d].label), get: () => devs.indexOf(S.device), set: i => setDevice(devs[i]) },
      { name: 'Look', options: ['Light', 'Dark'], get: () => S.look, set: i => { S.look = i; applyLook(); render(); } },
      { name: 'Motion', options: ['Normal', 'Slow', 'Reduce'], get: () => S.motion, set: i => { S.motion = i; applyMotion(); } },
      { name: 'View', options: ['Normal', 'Inspect', 'Skeleton'], get: () => S.view, set: i => setView(i) }
    ];
    S.opts.controls.forEach(c => g.push({ name: c.name, own: true, options: c.options, get: () => S.custom[c.name], set: i => { S.custom[c.name] = i; try { c.onChange && c.onChange(i, c.options[i]); } catch (e) { console.error(e); } if (S.view === 2) markText(); applyAll(); render(); } }));
    return g;
  }
  function renderPanel() {
    const p = S.el.panel; p.textContent = '';
    const shape = S.phone ? 'tab' : S.launcher;
    p.append(h('div', { class: 'kit-ph' },
      h('div', null, h('div', { class: 'kit-pt' }, 'Prototype controls'), h('div', { class: 'kit-ps' }, `not part of ${S.opts.app}`)),
      h('button', { type: 'button', class: 'kit-min is-' + shape, 'aria-label': 'Minimise prototype controls', title: 'Minimise', onclick: () => setOpen(false) }, icon('min'))));
    const gs = groups();
    gs.forEach((g, gi) => {
      if (g.own && gi > 0 && !gs[gi - 1].own) p.append(h('div', { class: 'kit-sep' }));
      const cur = g.get();
      p.append(h('div', { class: 'kit-grp' + (g.own ? ' own' : '') },
        h('div', { class: 'kit-gl' }, g.name),
        h('div', { class: 'kit-seg', role: 'group', 'aria-label': g.name },
          g.options.map((o, i) => h('button', { type: 'button', class: i === cur ? 'on' : '', 'aria-pressed': String(i === cur), onclick: () => { g.set(i); renderPanel(); fire(); } }, o)))));
    });
  }
  function renderLauncher() {
    const shape = S.phone ? 'tab' : S.launcher, l = S.el.launcher;
    l.className = 'kit-launcher is-' + shape + (S.open ? ' hid' : '');
    l.textContent = '';
    l.append(icon(shape === 'tab' ? 'chev' : 'sliders'));
    if (shape === 'capsule') l.append(h('span', null, 'Controls'));
    S.el.panel.classList.toggle('shut', !S.open);
    S.el.panel.setAttribute('aria-hidden', String(!S.open));
  }
  function setOpen(v) { S.open = v; renderLauncher(); renderPanel(); layout(); if (v) { const b = S.el.panel.querySelector('button'); b && b.focus({ preventScroll: true }); } else S.el.launcher.focus({ preventScroll: true }); }
  function fire() { window.dispatchEvent(new CustomEvent('kit:change', { detail: api.get() })); }
  function applyLook() { scr().classList.toggle('dark', S.look === 1); scr().style.colorScheme = S.look ? 'dark' : 'light'; buildTokenMap(); }
  function applyMotion() { scr().style.setProperty('--k', S.motion === 1 ? '4' : '1'); scr().classList.toggle('motion-reduced', S.motion === 2); }
  function setDevice(d) { S.device = d; ['iphone', 'ipad', 'mac'].forEach(x => scr().classList.toggle('is-' + x, x === d)); layout(); applyAll(); render(); }
  function setView(i) {
    S.view = i; document.body.classList.toggle('kit-edit', i > 0); scr().classList.toggle('kit-skel', i === 2);
    if (i === 2) markText(); if (i === 0) { S.hover = null; S.ptr = null; S.guides = []; }
    layout(); render();
  }
  function markText() { S.root.querySelectorAll('*').forEach(el => { if ([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) el.classList.add('kit-txt'); }); }

  /* ---------- layout ---------- */
  function layout() {
    const d = DEV[S.device], wide = window.innerWidth >= 900;
    S.phone = window.innerWidth <= 600 && S.device === 'iphone';
    document.body.classList.toggle('kit-phone', S.phone);
    document.body.classList.toggle('kit-narrow', !wide && !S.phone);
    const sc_ = scr(), dv = S.el.device, bx = S.el.box;
    if (S.phone) {
      const W = window.innerWidth, H = window.innerHeight;
      sc_.style.width = W + 'px'; sc_.style.height = H + 'px'; sc_.style.borderRadius = '0';
      dv.style.borderWidth = '0'; dv.style.borderRadius = '0'; dv.style.transform = 'none';
      bx.style.width = W + 'px'; bx.style.height = H + 'px'; S.scale = 1;
    } else {
      const b = d.b;
      sc_.style.width = d.w + 'px'; sc_.style.height = d.h + 'px'; sc_.style.borderRadius = Math.max(0, d.r - b) + 'px';
      dv.style.borderWidth = b + 'px'; dv.style.borderRadius = d.r + 'px';
      const side = (S.open && wide ? 278 : 0) + (S.view > 0 && wide ? 316 : 0);
      const availW = Math.max(220, window.innerWidth - 24 - side - 56);
      const availH = Math.max(320, window.innerHeight - 24 - 26);
      const s = Math.max(0.2, Math.min(1, availW / (d.w + 2 * b), availH / (d.h + 2 * b)));
      S.scale = s; dv.style.transform = `scale(${s})`;
      bx.style.width = (d.w + 2 * b) * s + 'px'; bx.style.height = (d.h + 2 * b) * s + 'px';
    }
    positionRulers(); renderLauncher(); drawRulers(); drawOv();
  }
  function positionRulers() {
    const rt = S.el.rt, rl = S.el.rl;
    if (S.phone) {
      const W = window.innerWidth, H = window.innerHeight;
      Object.assign(rt.style, { left: '0px', top: '0px', width: W + 'px', height: '16px' }); rt.setAttribute('width', W); rt.setAttribute('height', 16);
      Object.assign(rl.style, { left: '0px', top: '0px', width: '30px', height: H + 'px' }); rl.setAttribute('width', 30); rl.setAttribute('height', H);
      return;
    }
    const d = DEV[S.device], s = S.scale, off = d.b * s;
    Object.assign(rt.style, { left: (48 + off) + 'px', top: '2px', width: d.w * s + 'px', height: '18px' }); rt.setAttribute('width', d.w * s); rt.setAttribute('height', 18);
    Object.assign(rl.style, { left: '18px', top: (22 + off) + 'px', width: '28px', height: d.h * s + 'px' }); rl.setAttribute('width', 28); rl.setAttribute('height', d.h * s);
  }

  /* ---------- rulers ---------- */
  function drawRulers() {
    const rt = S.el.rt, rl = S.el.rl; rt.textContent = ''; rl.textContent = '';
    const s = S.scale, W = scr().offsetWidth, H = scr().offsetHeight;
    const TH = S.phone ? 16 : 18, LW = S.phone ? 30 : 28;
    const tick = 'stroke:var(--k-tick);stroke-width:.7', lab = 'font-size:11px;fill:var(--k-fg2)';
    for (let v = 0; v <= W; v += 10) {
      const x = v * s, L = v % 100 ? (v % 50 ? 3 : 6) : 9;
      rt.append(sv('line', { x1: x, x2: x, y1: TH, y2: TH - L, style: tick }));
      if (v % 100 === 0 && v && v < W - 12) rt.append(sv('text', { x, y: 9, 'text-anchor': 'middle', style: lab }, v));
    }
    for (let v = 0; v <= H; v += 10) {
      const y = v * s, L = v % 100 ? (v % 50 ? 3 : 6) : 9;
      rl.append(sv('line', { y1: y, y2: y, x1: LW, x2: LW - L, style: tick }));
      if (v % 100 === 0 && v && v < H - 8) rl.append(sv('text', { x: LW - 11, y: y + 4, 'text-anchor': 'end', style: lab }, v));
    }
    const sel = S.view > 0 ? liveSel() : [];
    if (sel.length) {
      const b = bounds(sel), acc = 'fill:var(--k-acc)';
      rt.append(sv('rect', { x: b.x * s, y: 0, width: Math.max(0, b.w * s), height: TH, style: 'fill:var(--k-acc);opacity:.16' }));
      rl.append(sv('rect', { x: 0, y: b.y * s, width: LW, height: Math.max(0, b.h * s), style: 'fill:var(--k-acc);opacity:.16' }));
      [[b.x, 'end', -2], [b.x + b.w, 'start', 2]].forEach(([v, a, o]) => { rt.append(sv('line', { x1: v * s, x2: v * s, y1: 0, y2: TH, style: 'stroke:var(--k-acc)' })); if (!S.phone) rt.append(sv('text', { x: v * s + o, y: -3, 'text-anchor': a, style: 'font-size:11px;' + acc }, fmt(v))); });
      [b.y, b.y + b.h].forEach(v => { rl.append(sv('line', { y1: v * s, y2: v * s, x1: 0, x2: LW, style: 'stroke:var(--k-acc)' })); if (!S.phone) rl.append(sv('text', { x: -3, y: v * s + 4, 'text-anchor': 'end', style: 'font-size:11px;' + acc }, fmt(v))); });
    }
    if (S.cursor && !S.ptr) {
      const c = S.cursor, st = 'font-size:11px;font-weight:600;fill:var(--k-fg)';
      rt.append(sv('line', { x1: c.x * s, x2: c.x * s, y1: 0, y2: TH, style: 'stroke:var(--k-fg)' }));
      rl.append(sv('line', { y1: c.y * s, y2: c.y * s, x1: 0, x2: LW, style: 'stroke:var(--k-fg)' }));
      if (!S.phone) { rt.append(sv('text', { x: c.x * s, y: -3, 'text-anchor': 'middle', style: st }, c.x)); rl.append(sv('text', { x: -3, y: c.y * s + 4, 'text-anchor': 'end', style: st }, c.y)); }
    }
  }

  /* ---------- overlay on the screen ---------- */
  function drawOv() {
    const ov = S.el.ov; ov.textContent = '';
    if (S.view === 0) return;
    const W = scr().offsetWidth, H = scr().offsetHeight, u = 1 / (S.scale || 1);
    ov.setAttribute('width', W); ov.setAttribute('height', H); ov.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const sel = liveSel();
    if (S.hover && !sel.includes(S.hover) && S.hover.isConnected) {
      const r = rectOf(S.hover);
      ov.append(sv('rect', { x: r.x, y: r.y, width: Math.max(0, r.w), height: Math.max(0, r.h), fill: 'rgba(0,122,255,.08)', stroke: BLUE, 'stroke-width': u }));
      nameTag(ov, r, nameOf(S.hover), u, false);
    }
    if (sel.length === 1 && S.view === 1 && !S.ptr) boxModel(ov, sel[0]);
    sel.forEach(e => {
      const r = rectOf(e), isKey = S.key && members(S.key).includes(e);
      ov.append(sv('rect', { x: r.x, y: r.y, width: Math.max(0, r.w), height: Math.max(0, r.h), fill: 'none', style: isKey ? 'stroke:var(--fg)' : 'stroke:' + BLUE, 'stroke-width': (isKey ? 2.5 : 1.5) * u }));
    });
    if (units().length > 1) { const b = bounds(sel); ov.append(sv('rect', { x: b.x - 3 * u, y: b.y - 3 * u, width: b.w + 6 * u, height: b.h + 6 * u, fill: 'none', stroke: BLUE, 'stroke-width': u, 'stroke-dasharray': `${4 * u} ${3 * u}` })); }
    if (sel.length === 1 && !S.ptr) distances(ov, sel[0], u);
    if (sel.length === 1 && !S.original) handles(ov, rectOf(sel[0]), u);
    if (sel.length) { const sb = bounds(sel); S.guides.forEach(g => guide(ov, g, sb, W, H, u)); }
    if (!S.original) changeList().forEach((c, i) => { if (c.el && c.el.isConnected) { const r = rectOf(c.el); pin(ov, r.x + r.w - 2 * u, r.y + 2 * u, i + 1, u); } });
    if (sel.length === 1) nameTag(ov, rectOf(sel[0]), nameOf(sel[0]), u, true);
  }
  function nameTag(ov, r, txt, u, strong) {
    const t = txt.length > 30 ? txt.slice(0, 29) + '…' : txt, fs = 11 * u, w = (t.length * 6.3 + 12) * u, hh = 17 * u;
    let x = Math.max(2 * u, Math.min(r.x, scr().offsetWidth - w - 2 * u)), y = r.y - hh - 3 * u; if (y < 2 * u) y = r.y + r.h + 3 * u;
    ov.append(sv('rect', { x, y, width: w, height: hh, rx: 5 * u, fill: strong ? BLUE : '#1c1c1e', opacity: strong ? 1 : .85 }));
    ov.append(sv('text', { x: x + 6 * u, y: y + 12 * u, style: `font-size:${fs}px;fill:#fff;font-family:-apple-system,system-ui,sans-serif` }, t));
  }
  function ring(ov, o, i, fill) {
    if (o.w <= 0 || o.h <= 0) return;
    const d = `M${o.x} ${o.y}h${o.w}v${o.h}h${-o.w}Z M${i.x} ${i.y}v${Math.max(0, i.h)}h${Math.max(0, i.w)}v${-Math.max(0, i.h)}Z`;
    ov.append(sv('path', { d, fill, 'fill-rule': 'evenodd' }));
  }
  function boxModel(ov, el) {
    const r = rectOf(el), cs = getComputedStyle(el), n = p => parseFloat(cs[p]) || 0;
    const m = { t: Math.max(0, n('marginTop')), r: Math.max(0, n('marginRight')), b: Math.max(0, n('marginBottom')), l: Math.max(0, n('marginLeft')) };
    const bw = { t: n('borderTopWidth'), r: n('borderRightWidth'), b: n('borderBottomWidth'), l: n('borderLeftWidth') };
    const p = { t: n('paddingTop'), r: n('paddingRight'), b: n('paddingBottom'), l: n('paddingLeft') };
    const outer = { x: r.x - m.l, y: r.y - m.t, w: r.w + m.l + m.r, h: r.h + m.t + m.b };
    const pad = { x: r.x + bw.l, y: r.y + bw.t, w: r.w - bw.l - bw.r, h: r.h - bw.t - bw.b };
    const con = { x: pad.x + p.l, y: pad.y + p.t, w: pad.w - p.l - p.r, h: pad.h - p.t - p.b };
    ring(ov, outer, r, 'rgba(239,159,39,.32)');
    ring(ov, pad, con, 'rgba(99,153,34,.34)');
    if (con.w > 0 && con.h > 0) ov.append(sv('rect', { x: con.x, y: con.y, width: con.w, height: con.h, fill: 'rgba(55,138,221,.26)' }));
  }
  function measure(ov, x1, y1, x2, y2, val, u) {
    if (val < 0.5) return;
    ov.append(sv('line', { x1, y1, x2, y2, stroke: RED, 'stroke-width': u, 'stroke-dasharray': `${3 * u} ${2 * u}` }));
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, t = fmt(val), w = (t.length * 6.5 + 8) * u;
    ov.append(sv('rect', { x: mx - w / 2, y: my - 7.5 * u, width: w, height: 15 * u, rx: 4 * u, fill: RED }));
    ov.append(sv('text', { x: mx, y: my + 4 * u, 'text-anchor': 'middle', style: `font-size:${11 * u}px;fill:#fff;font-family:-apple-system,system-ui,sans-serif` }, t));
  }
  function distances(ov, el, u) {
    const p = el.parentElement; if (!p || !S.root.contains(p) && p !== S.root) return;
    const r = rectOf(el), pc = contentBox(p), cy = r.y + r.h / 2, cx = r.x + r.w / 2;
    measure(ov, pc.x, cy, r.x, cy, r.x - pc.x, u);
    measure(ov, r.x + r.w, cy, pc.x + pc.w, cy, pc.x + pc.w - r.x - r.w, u);
    let prev = el.previousElementSibling;
    while (prev && (prev.offsetParent === null && getComputedStyle(prev).position !== 'fixed' || prev.getBoundingClientRect().height === 0)) prev = prev.previousElementSibling;
    const top = prev ? rectOf(prev).y + rectOf(prev).h : pc.y;
    if (top <= r.y) measure(ov, cx, top, cx, r.y, r.y - top, u);
  }
  function handlePts(r) { const xs = [r.x, r.x + r.w / 2, r.x + r.w], ys = [r.y, r.y + r.h / 2, r.y + r.h], out = []; ys.forEach((y, yi) => xs.forEach((x, xi) => { if (xi === 1 && yi === 1) return; out.push({ x, y, l: xi === 0, r: xi === 2, t: yi === 0, b: yi === 2 }); })); return out; }
  function handles(ov, r, u) { handlePts(r).forEach(p => ov.append(sv('rect', { x: p.x - 3.5 * u, y: p.y - 3.5 * u, width: 7 * u, height: 7 * u, rx: 1.5 * u, fill: '#fff', stroke: BLUE, 'stroke-width': u }))); }
  function handleAt(r, p) { const thr = (S.phone ? 16 : 9) / (S.scale || 1); let best = null, bd = thr; handlePts(r).forEach(hp => { const d = Math.hypot(hp.x - p.x, hp.y - p.y); if (d <= bd) { bd = d; best = hp; } }); return best; }
  function tagPill(ov, x, y, txt, u) {
    const w = (txt.length * 6.3 + 10) * u;
    ov.append(sv('rect', { x: x - w / 2, y: y - 8 * u, width: w, height: 16 * u, rx: 4 * u, fill: PINK }));
    ov.append(sv('text', { x, y: y + 4 * u, 'text-anchor': 'middle', style: `font-size:${11 * u}px;fill:#fff;font-family:-apple-system,system-ui,sans-serif` }, txt));
  }
  function guide(ov, g, sb, W, H, u) {
    if (g.a === 'x') { ov.append(sv('line', { x1: g.v, x2: g.v, y1: 0, y2: H, stroke: PINK, 'stroke-width': u })); tagPill(ov, Math.min(W - 40 * u, Math.max(40 * u, g.v)), Math.max(12 * u, sb.y - 14 * u), g.t, u); }
    else if (g.a === 'y') { ov.append(sv('line', { x1: 0, x2: W, y1: g.v, y2: g.v, stroke: PINK, 'stroke-width': u })); tagPill(ov, Math.min(W - 44 * u, sb.x + sb.w + 40 * u), g.v, g.t, u); }
    else { const cx = sb.x + sb.w / 2; ov.append(sv('line', { x1: cx, x2: cx, y1: g.v1, y2: g.v2, stroke: PINK, 'stroke-width': 1.5 * u })); tagPill(ov, cx + 30 * u, (g.v1 + g.v2) / 2, g.t, u); }
  }
  function pin(ov, x, y, n, u) {
    ov.append(sv('circle', { cx: x, cy: y, r: 8 * u, fill: '#1c1c1e', stroke: '#fff', 'stroke-width': 1.5 * u }));
    ov.append(sv('text', { x, y: y + 3.8 * u, 'text-anchor': 'middle', style: `font-size:${11 * u}px;font-weight:600;fill:#fff;font-family:-apple-system,system-ui,sans-serif` }, n));
  }
  function schedule() { if (S.raf) return; S.raf = requestAnimationFrame(() => { S.raf = 0; drawRulers(); drawOv(); }); }

  /* ---------- picking and pointer handling ---------- */
  function hit(cx, cy) {
    const L = S.el.layer; L.style.pointerEvents = 'none';
    const e = document.elementFromPoint(cx, cy);
    L.style.pointerEvents = '';
    return e && S.root.contains(e) && e !== S.root ? e : null;
  }
  function pick(e, deep) { if (!e) return null; if (deep) return e; const n = e.closest('[data-name]'); return n && n !== S.root && S.root.contains(n) ? n : e; }
  function targets(sel) {
    const set = new Set(S.root.querySelectorAll('[data-name]'));
    sel.forEach(e => { const p = e.parentElement; if (p) [...p.children].forEach(c => set.add(c)); });
    const W = scr().offsetWidth, H = scr().offsetHeight, m = S.opts.margin;
    const tx = [[0, 'screen edge'], [W, 'screen edge'], [W / 2, 'screen centre'], [m, 'margin ' + m], [W - m, 'margin ' + m]];
    const ty = [[H / 2, 'screen centre']], others = [];
    set.forEach(e => {
      if (e === S.root || sel.some(s => s === e || s.contains(e) || e.contains(s))) return;
      const r = rectOf(e); if (r.w < 1 || r.h < 1 || r.y > H || r.y + r.h < 0) return;
      others.push(r);
      tx.push([r.x, 'left edge'], [r.x + r.w, 'right edge'], [r.x + r.w / 2, 'centre']);
      ty.push([r.y, 'top edge'], [r.y + r.h, 'bottom edge'], [r.y + r.h / 2, 'centre']);
    });
    const par = sel[0] && sel[0].parentElement;
    if (par && par !== S.root && S.root.contains(par)) { const c = contentBox(par); tx.push([c.x, 'parent edge'], [c.x + c.w, 'parent edge'], [c.x + c.w / 2, 'parent centre']); ty.push([c.y, 'parent top'], [c.y + c.h, 'parent bottom']); }
    return { tx, ty, others };
  }
  function nearest(list, vals) { const thr = (S.phone ? 10 : 6) / (S.scale || 1); let best = null; vals.forEach(off => list.forEach(([t, l]) => { const d = t - off; if (Math.abs(d) <= thr && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, t, l }; })); return best; }
  function snapBox(P, nx, ny, w, h) {
    S.guides = []; let x = nx, y = ny, sx = false, sy = false;
    const bx = nearest(P.T.tx, [nx, nx + w / 2, nx + w]);
    if (bx) { x = nx + bx.d; sx = true; S.guides.push({ a: 'x', v: bx.t, t: bx.l }); }
    const thr = (S.phone ? 10 : 6) / (S.scale || 1);
    let by = nearest(P.T.ty, [ny, ny + h / 2, ny + h]), gapG = null;
    const ov = P.T.others.filter(r => r.x < nx + w && r.x + r.w > nx);
    const above = ov.filter(r => r.y + r.h <= ny + thr).sort((a, b) => (b.y + b.h) - (a.y + a.h))[0];
    const below = ov.filter(r => r.y >= ny + h - thr).sort((a, b) => a.y - b.y)[0];
    S.opts.gaps.forEach(g => {
      if (above) { const d = above.y + above.h + g - ny; if (Math.abs(d) <= thr && (!by || Math.abs(d) < Math.abs(by.d))) { by = { d }; gapG = { a: 'g', v1: above.y + above.h, v2: above.y + above.h + g, t: g + ' gap' }; } }
      if (below) { const d = below.y - g - h - ny; if (Math.abs(d) <= thr && (!by || Math.abs(d) < Math.abs(by.d))) { by = { d }; gapG = { a: 'g', v1: below.y - g, v2: below.y, t: g + ' gap' }; } }
    });
    if (by) { y = ny + by.d; sy = true; S.guides.push(gapG && by.t == null ? gapG : { a: 'y', v: by.t, t: by.l }); }
    return { x, y, sx, sy };
  }
  function snapEdge(P, axis, v, free) {
    if (free) return v;
    const b = nearest(axis === 'x' ? P.T.tx : P.T.ty, [v]);
    if (!b) return Math.round(v);
    S.guides.push({ a: axis, v: b.t, t: b.l }); return b.t;
  }
  function beginDrag(P) {
    const sel = liveSel();
    P.before = snapM(); P.T = targets(sel); S.hover = null;
    if (P.mode === 'move') { P.bb = bounds(sel); P.starts = sel.map(el => { const e = peek(el) || {}; return [el, e.dx || 0, e.dy || 0]; }); }
    else { const el = sel[0], e = E(el), r = rectOf(el); P.el = el; P.r0 = r; P.dx0 = e.dx || 0; P.dy0 = e.dy || 0; if (e.w0 == null) e.w0 = Math.round(r.w * 10) / 10; if (e.h0 == null) e.h0 = Math.round(r.h * 10) / 10; P.w0 = r.w; P.h0 = r.h; }
  }
  function doMove(P, p, free) {
    const dx = p.x - P.p0.x, dy = p.y - P.p0.y;
    let q = { x: P.bb.x + r1(dx), y: P.bb.y + r1(dy) };
    if (!free) { const s = snapBox(P, P.bb.x + dx, P.bb.y + dy, P.bb.w, P.bb.h); q = { x: s.sx ? s.x : P.bb.x + r1(dx), y: s.sy ? s.y : P.bb.y + r1(dy) }; } else S.guides = [];
    const mx = q.x - P.bb.x, my = q.y - P.bb.y;
    P.starts.forEach(([el, x0, y0]) => { const e = E(el); e.dx = Math.round((x0 + mx) * 100) / 100; e.dy = Math.round((y0 + my) * 100) / 100; applyEl(el, e); S.touched.add(el); });
  }
  function doResize(P, p, free) {
    const r0 = P.r0, hd = P.hd, dx = p.x - P.p0.x, dy = p.y - P.p0.y; S.guides = [];
    let L = r0.x, R = r0.x + r0.w, T = r0.y, B = r0.y + r0.h;
    if (hd.l) L = Math.min(snapEdge(P, 'x', r0.x + dx, free), R - 4);
    if (hd.r) R = Math.max(snapEdge(P, 'x', R + dx, free), L + 4);
    if (hd.t) T = Math.min(snapEdge(P, 'y', r0.y + dy, free), B - 4);
    if (hd.b) B = Math.max(snapEdge(P, 'y', B + dy, free), T + 4);
    const el = P.el, e = E(el);
    if (hd.l || hd.r) e.w = Math.round((R - L) * 10) / 10;
    if (hd.t || hd.b) e.h = Math.round((B - T) * 10) / 10;
    applyEl(el, e); S.touched.add(el);
    const a = rectOf(el);
    if (hd.l || hd.r) e.dx = Math.round(((e.dx || 0) + (L - a.x)) * 100) / 100;
    if (hd.t || hd.b) e.dy = Math.round(((e.dy || 0) + (T - a.y)) * 100) / 100;
    applyEl(el, e);
  }
  function addToSel(mem) {
    let sel = liveSel().filter(s => !mem.some(m => m.contains(s) || s.contains(m)));
    S.sel = sel.concat(mem.filter(m => !sel.includes(m)));
  }
  function tapSelect(P) {
    S.err = ''; S.status = '';
    const t = P.target;
    if (!t) { if (!S.multi && !P.shift) { S.sel = []; S.key = null; } return; }
    const mem = P.deep ? [t] : members(t), sel = liveSel();
    if (P.shift || S.multi) {
      const all = mem.every(m => sel.includes(m));
      if (all) S.sel = sel.filter(x => !mem.includes(x)); else addToSel(mem);
      if (S.key && !S.sel.includes(S.key)) S.key = null; return;
    }
    if (sel.includes(t) && units().length > 1) { S.key = S.key && members(S.key).includes(t) ? null : t; return; }
    S.sel = mem; S.key = null;
  }
  function bindLayer() {
    const L = S.el.layer;
    L.addEventListener('pointerdown', ev => {
      if (ev.button > 0) return; ev.preventDefault();
      try { L.setPointerCapture(ev.pointerId); } catch (e) { }
      const p = pt(ev.clientX, ev.clientY), raw = hit(ev.clientX, ev.clientY), deep = ev.metaKey || ev.ctrlKey, target = pick(raw, deep), sel = liveSel();
      const hd = sel.length === 1 && !S.original ? handleAt(rectOf(sel[0]), p) : null;
      let inSel = target && sel.some(s => s === target || s.contains(target)), pickedNow = false;
      // With a mouse, pressing on anything picks it straight away so it can be dragged (as in Illustrator).
      // With a finger, dragging something not yet picked scrolls the page instead.
      if (!inSel && !hd && target && ev.pointerType === 'mouse' && !ev.shiftKey && !S.multi && !S.original) { S.sel = deep ? [target] : members(target); S.key = null; S.err = ''; S.status = ''; inSel = true; pickedNow = true; }
      const P = { id: ev.pointerId, sx: ev.clientX, sy: ev.clientY, p0: p, target, deep, shift: ev.shiftKey, moved: false, hd, pickedNow };
      P.mode = hd ? 'resize' : (inSel && !S.original ? 'move' : 'pan');
      P.scrollEl = scrollable(raw); P.st0 = P.scrollEl ? P.scrollEl.scrollTop : 0;
      S.ptr = P; if (P.mode !== 'pan') beginDrag(P);
    });
    L.addEventListener('pointermove', ev => {
      const p = pt(ev.clientX, ev.clientY); S.cursor = { x: r1(p.x), y: r1(p.y) };
      const P = S.ptr;
      if (!P) { if (ev.pointerType === 'mouse' && S.view === 1) S.hover = pick(hit(ev.clientX, ev.clientY), ev.metaKey || ev.ctrlKey); schedule(); return; }
      if (ev.pointerId !== P.id) return;
      if (!P.moved && Math.hypot(ev.clientX - P.sx, ev.clientY - P.sy) < 4) return;
      P.moved = true;
      if (P.mode === 'pan') { if (P.scrollEl) P.scrollEl.scrollTop = P.st0 - (ev.clientY - P.sy) / (S.scale || 1); schedule(); return; }
      const free = ev.altKey || !S.snap;
      if (P.mode === 'move') doMove(P, p, free); else doResize(P, p, free);
      schedule(); renderLive();
    });
    const end = (ev, cancel) => {
      const P = S.ptr; if (!P || ev.pointerId !== P.id) return;
      S.ptr = null; S.guides = [];
      if (P.moved && P.mode !== 'pan') {
        prune(); applyAll();
        if (P.before.m !== JSON.stringify(S.model)) { S.undo.push({ name: P.mode === 'move' ? 'Move' : 'Resize', st: P.before }); S.redo = []; save(); }
        return render();
      }
      if (P.mode === 'resize' && !P.moved) prune();
      if (!P.moved && !cancel && !P.pickedNow) tapSelect(P);
      render();
    };
    L.addEventListener('pointerup', ev => end(ev, false));
    L.addEventListener('pointercancel', ev => end(ev, true));
    L.addEventListener('dblclick', ev => { const t = hit(ev.clientX, ev.clientY); if (t) { S.sel = [t]; S.key = null; render(); } });
    L.addEventListener('wheel', ev => { const el = scrollable(hit(ev.clientX, ev.clientY)); if (el) { el.scrollTop += ev.deltaY; el.scrollLeft += ev.deltaX; ev.preventDefault(); schedule(); } }, { passive: false });
    L.addEventListener('pointerleave', () => { if (!S.ptr) { S.cursor = null; S.hover = null; schedule(); } });
    scr().addEventListener('pointermove', ev => { if (S.view === 0) { const p = pt(ev.clientX, ev.clientY); S.cursor = { x: r1(p.x), y: r1(p.y) }; schedule(); } }, { passive: true });
    scr().addEventListener('pointerleave', () => { if (S.view === 0) { S.cursor = null; schedule(); } });
    scr().addEventListener('scroll', schedule, true);
  }

  /* ---------- arranging ---------- */
  function nudge(dx, dy) {
    const sel = liveSel(); if (!sel.length || S.original) return;
    const now = Date.now(), chain = S.undo.length && S.undo[S.undo.length - 1].name === 'Nudge' && now - S.lastNudge < 1000 && !S.redo.length;
    S.lastNudge = now;
    const f = () => sel.forEach(el => { const e = E(el); e.dx = (e.dx || 0) + dx; e.dy = (e.dy || 0) + dy; });
    if (chain) { f(); prune(); applyAll(); save(); render(); } else commit('Nudge', f);
  }
  function needSel(min) { const n = liveSel().length; if (!n) { S.err = 'Tap something on the screen first'; render(); return false; } if (S.original) { S.err = 'Turn off Show original to make changes'; render(); return false; } return true; }
  function align(k) {
    S.err = ''; S.status = ''; if (!needSel()) return;
    const us = units(); let mode = S.alignTo, t;
    if (us.length === 1 && (mode === 'selection' || mode === 'key')) { mode = 'parent'; S.status = 'Only one picked, so it lined up with its parent'; }
    if (mode === 'key') { if (!S.key) { S.err = 'Tap one of the picked boxes again to make it the key box'; return render(); } t = bounds(members(S.key)); }
    else if (mode === 'screen') { const W = scr().offsetWidth, m = S.opts.margin; t = { x: m, y: 0, w: W - 2 * m, h: scr().offsetHeight }; }
    else if (mode === 'parent') { const p = liveSel()[0].parentElement; t = p && p !== S.root ? contentBox(p) : { x: 0, y: 0, w: scr().offsetWidth, h: scr().offsetHeight }; }
    else t = bounds(liveSel());
    commit(AN[k], () => us.forEach(u => {
      if (mode === 'key' && u.includes(S.key)) return;
      const ub = bounds(u); let dx = 0, dy = 0;
      if (k === 'l') dx = t.x - ub.x; if (k === 'c') dx = t.x + t.w / 2 - (ub.x + ub.w / 2); if (k === 'r') dx = t.x + t.w - (ub.x + ub.w);
      if (k === 't') dy = t.y - ub.y; if (k === 'm') dy = t.y + t.h / 2 - (ub.y + ub.h / 2); if (k === 'b') dy = t.y + t.h - (ub.y + ub.h);
      u.forEach(el => { const e = E(el); e.dx = Math.round(((e.dx || 0) + dx) * 100) / 100; e.dy = Math.round(((e.dy || 0) + dy) * 100) / 100; });
    }));
  }
  function distribute(ax) {
    S.err = ''; S.status = ''; if (!needSel()) return;
    const us = units(), raw = (S.gapVal || '').trim(); let gap = null;
    if (raw) { const v = parseNum(raw); if (!v || v.rel) { S.err = 'Gap must be a number, like 16. Leave it empty for even gaps'; return render(); } gap = v.n; }
    if (gap === null && us.length < 3) { S.err = 'Pick three or more to space them evenly, or type a gap'; return render(); }
    if (us.length < 2) { S.err = 'Pick two or more to space out'; return render(); }
    const P = ax === 'x' ? ['x', 'w', 'dx'] : ['y', 'h', 'dy'];
    const items = us.map(u => ({ u, b: bounds(u) })).sort((a, b) => a.b[P[0]] - b.b[P[0]]);
    if (gap === null) { const f = items[0].b, l = items[items.length - 1].b; gap = (l[P[0]] + l[P[1]] - f[P[0]] - items.reduce((a, i) => a + i.b[P[1]], 0)) / (items.length - 1); }
    commit('Space out', () => { let pos = items[0].b[P[0]]; items.forEach(i => { const d = pos - i.b[P[0]]; i.u.forEach(el => { const e = E(el); e[P[2]] = Math.round(((e[P[2]] || 0) + d) * 100) / 100; }); pos += i.b[P[1]] + gap; }); });
    S.status = 'Gaps of ' + fmt(gap); render();
  }
  function group() {
    S.err = ''; if (!needSel()) return; const us = units();
    if (us.length < 2) { S.err = 'Pick two or more to group'; return render(); }
    const g = S.nextGroup++; commit('Group', () => { liveSel().forEach(el => { E(el).g = g; }); S.key = null; });
  }
  function ungroup() {
    S.err = ''; if (!needSel()) return; const sel = liveSel();
    if (!sel.some(el => (peek(el) || {}).g)) { S.err = "That isn't a group"; return render(); }
    commit('Ungroup', () => { sel.forEach(el => { const e = peek(el); if (e) delete e.g; }); S.key = null; });
  }
  function parseNum(raw) { const m = String(raw).trim().replace(/[−–]/g, '-').match(/^([+-])?\s*(\d+(?:\.\d+)?)$/); return m ? { rel: m[1] || '', n: parseFloat(m[2]) } : null; }
  function radiusOf(el) { const cs = getComputedStyle(el), v = cs.borderTopLeftRadius; if (v.includes('%')) { const r = rectOf(el); return parseFloat(v) / 100 * Math.min(r.w, r.h); } return Math.min(parseFloat(v) || 0, Math.min(rectOf(el).w, rectOf(el).h) / 2); }
  function applyField(f, raw) {
    S.err = ''; S.status = ''; if (!needSel()) return;
    const v = parseNum(raw); if (!v) { S.err = 'Enter a number, like 24, +8 or −8'; return render(); }
    const val = cur => v.rel === '+' ? cur + v.n : v.rel === '-' ? cur - v.n : v.n;
    const sel = liveSel();
    if (f === 'x' || f === 'y') {
      const b = bounds(sel), d = val(b[f]) - b[f], prop = f === 'x' ? 'dx' : 'dy';
      commit(f === 'x' ? 'Move across' : 'Move down', () => sel.forEach(el => { const e = E(el); e[prop] = Math.round(((e[prop] || 0) + d) * 100) / 100; }));
    } else if (f === 'w' || f === 'h') {
      const el = sel[0], r = rectOf(el);
      commit('Resize', () => {
        const e = E(el); if (e[f + '0'] == null) e[f + '0'] = Math.round(r[f] * 10) / 10;
        e[f] = Math.max(1, val(r[f])); applyEl(el, e); S.touched.add(el);
        const a = rectOf(el); if (f === 'w') e.dx = Math.round(((e.dx || 0) + r.x - a.x) * 100) / 100; else e.dy = Math.round(((e.dy || 0) + r.y - a.y) * 100) / 100;
      });
    } else if (f === 'r') {
      const el = sel[0], cur = radiusOf(el);
      commit('Corners', () => { const e = E(el); if (e.r0 == null) e.r0 = Math.round(cur * 10) / 10; e.r = Math.max(0, val(cur)); });
    }
  }
  function copyChanges() {
    S.err = ''; const t = changesText();
    if (!t) { S.status = 'No changes yet'; return render(); }
    S.showText = true; S.copied = null; render();
    const done = ok => { S.copied = ok; render(); };
    try { navigator.clipboard.writeText(t).then(() => done(true), () => done(false)); } catch (e) { done(false); }
  }

  /* ---------- details for the inspector ---------- */
  function buildTokenMap() {
    S.tok = new Map(); const names = [];
    const walk = rules => { for (const r of rules) { if (r.style) for (let i = 0; i < r.style.length; i++) { const p = r.style[i]; if (p.startsWith('--') && !p.startsWith('--k') && !names.includes(p)) names.push(p); } if (r.cssRules) walk(r.cssRules); } };
    for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (e) { } }
    const wrap = h('span', { style: 'position:absolute;visibility:hidden;color:rgb(1, 2, 3)' }), probe = h('i');
    wrap.append(probe); scr().append(wrap);
    names.forEach(n => { probe.style.color = ''; probe.style.color = `var(${n})`; const c = getComputedStyle(probe).color; if (c && c !== 'rgb(1, 2, 3)' && !S.tok.has(c)) S.tok.set(c, n); });
    wrap.remove();
  }
  function rgba(c) { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
  function lum(c) { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); }
  function bgOf(el) { let e = el; while (e && e !== scr().parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c && c.a >= 0.5) return { c, el: e }; e = e.parentElement; } return { c: S.look ? { r: 0, g: 0, b: 0, a: 1 } : { r: 242, g: 242, b: 247, a: 1 }, el: null }; }
  function info(el) {
    const cs = getComputedStyle(el), out = {};
    const fs = parseFloat(cs.fontSize), fw = parseInt(cs.fontWeight, 10) || 400;
    const hasText = (el.textContent || '').trim().length > 0;
    if (hasText) { let name = STY[Math.round(fs)]; if (Math.round(fs) === 17 && fw >= 600) name = 'Headline'; const wn = fw >= 700 ? 'Bold' : fw >= 600 ? 'Semibold' : fw >= 500 ? 'Medium' : 'Regular'; out.text = { label: `${name || fmt(fs) + ' pt'} · ${wn}`, ok: !!name }; }
    const col = cs.color, c = rgba(col), bg = bgOf(el);
    if (hasText && c) {
      const fg = { r: c.r * c.a + bg.c.r * (1 - c.a), g: c.g * c.a + bg.c.g * (1 - c.a), b: c.b * c.a + bg.c.b * (1 - c.a) };
      const L1 = lum(fg), L2 = lum(bg.c), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
      out.color = { tok: S.tok.get(col) || col.replace(/\s/g, ''), swatch: col, ratio, ok: ratio >= (large ? 3 : 4.5) };
    }
    const bgc = cs.backgroundColor; const bc = rgba(bgc);
    if (bc && bc.a > 0) out.bg = { tok: S.tok.get(bgc) || bgc.replace(/\s/g, ''), swatch: bgc };
    const tag = el.tagName.toLowerCase(), role = el.getAttribute('role');
    const interactive = /^(button|a|input|select|textarea)$/.test(tag) || /^(button|tab|link|switch|checkbox)$/.test(role || '') || el.hasAttribute('onclick');
    const roleName = role === 'tab' ? 'tab' : (tag === 'button' || role === 'button') ? 'button' : tag === 'a' ? 'link' : /^h[1-6]$/.test(tag) || role === 'heading' ? 'heading' : /^(input|textarea)$/.test(tag) ? 'text field' : (tag === 'img' || tag === 'svg') ? 'image' : '';
    const label = (el.getAttribute('aria-label') || (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ')).slice(0, 60);
    const state = el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-current') ? 'selected' : '';
    if (label || roleName) out.vo = '"' + [label || '(no label)', roleName, state].filter(Boolean).join(', ') + '"';
    if (interactive) { const r = rectOf(el); out.tap = { label: `${fmt(r.w)} × ${fmt(r.h)}`, ok: r.w >= 43.5 && r.h >= 43.5 }; }
    const n = p => fmt(parseFloat(cs[p]) || 0);
    out.box = { m: `${n('marginTop')} ${n('marginRight')} ${n('marginBottom')} ${n('marginLeft')}`, p: `${n('paddingTop')} ${n('paddingRight')} ${n('paddingBottom')} ${n('paddingLeft')}` };
    return out;
  }

  /* ---------- inspector ---------- */
  function renderLive() {
    const sel = liveSel(), f = S.el.insp.querySelector('.kit-fields'); if (!f || !sel.length) return;
    const b = bounds(sel), vals = { x: b.x, y: b.y, w: b.w, h: b.h };
    f.querySelectorAll('input').forEach(i => { if (vals[i.dataset.kf] != null && document.activeElement !== i) i.value = fmt(vals[i.dataset.kf]); });
  }
  function render() {
    renderInsp(); drawRulers(); drawOv();
  }
  function renderInsp() {
    const I = S.el.insp, act = document.activeElement, keep = act && I.contains(act) && act.dataset && act.dataset.kf ? { kf: act.dataset.kf, v: act.value, a: act.selectionStart, b: act.selectionEnd } : null;
    I.textContent = '';
    if (S.view === 0) return;
    I.classList.toggle('shut', S.phone && S.inspShut);
    I.append(h('button', { type: 'button', class: 'kit-ihd', 'aria-expanded': String(!S.inspShut), onclick: () => { S.inspShut = !S.inspShut; render(); } }, 'Inspector', h('span', { class: 'kit-hint' }, S.inspShut ? 'Show' : 'Hide')));
    const top = (stack, word, fn, ic) => h('button', { type: 'button', class: 'kit-ib' + (stack.length ? '' : ' no'), onclick: fn, title: word + (word === 'Undo' ? ' (⌘Z)' : ' (⇧⌘Z)') }, icon(ic), stack.length ? `${word} ${stack[stack.length - 1].name}` : word);
    I.append(h('div', { class: 'kit-ih' }, top(S.undo, 'Undo', undo, 'undo'), top(S.redo, 'Redo', redo, 'redo')));
    const sel = liveSel(), us = units();
    const secSel = h('div', { class: 'kit-sec' });
    if (!sel.length) secSel.append(h('div', { class: 'kit-hint' }, 'Tap anything on the screen to inspect it. Shift-click, or turn on Select several, to pick more than one. ⌘-click or double-tap picks the smallest part.'));
    else {
      const el = sel[0];
      if (sel.length === 1) {
        const crumbs = []; let e = el;
        while (e && e !== S.root) { if (e === el || e.hasAttribute('data-name')) crumbs.unshift(e); e = e.parentElement; }
        const cr = h('div', { class: 'kit-crumbs' });
        crumbs.forEach((c, i) => { if (i) cr.append(h('span', null, '›')); cr.append(h('button', { type: 'button', class: c === el ? 'cur' : '', onclick: () => { S.sel = [c]; S.key = null; render(); } }, nameOf(c))); });
        if (el.firstElementChild) { cr.append(h('span', null, '›')); cr.append(h('button', { type: 'button', onclick: () => { S.sel = [el.firstElementChild]; render(); } }, 'inside')); }
        secSel.append(cr);
      }
      const title = us.length === 1 ? (us[0].length > 1 ? `Group of ${us[0].length}` : nameOf(el)) : `${us.length} picked`;
      secSel.append(h('div', { class: 'kit-name' }, title, S.key ? h('span', { class: 'kit-hint' }, ` · key: ${nameOf(S.key)}`) : ''));
      const b = bounds(sel), single = sel.length === 1;
      const field = (k, lab, v) => h('label', null, lab, h('input', { type: 'text', inputmode: 'decimal', 'data-kf': k, value: fmt(v), 'aria-label': lab, onchange: ev => applyField(k, ev.target.value), onkeydown: ev => { if (ev.key === 'Enter') { ev.preventDefault(); ev.target.blur(); } } }));
      const fields = h('div', { class: 'kit-fields' }, field('x', 'Left', b.x), field('y', 'Top', b.y));
      if (single) fields.append(field('w', 'Width', b.w), field('h', 'Height', b.h), field('r', 'Corners', radiusOf(el)));
      secSel.append(fields);
      const pe = single ? peek(el) : null;
      const moved = sel.reduce((a, s) => { const e = peek(s); return a || (e && (e.dx || e.dy)); }, false);
      if (moved && us.length === 1) { const e = peek(el) || {}; const mv = []; if (e.dx) mv.push((e.dx > 0 ? 'right ' : 'left ') + fmt(Math.abs(e.dx))); if (e.dy) mv.push((e.dy > 0 ? 'down ' : 'up ') + fmt(Math.abs(e.dy))); if (mv.length) secSel.append(h('div', { class: 'kit-hint', style: 'margin-top:6px;color:var(--k-acc)' }, 'Moved ' + mv.join(', '))); }
      if (single) {
        const inf = info(el), rows = h('div', { style: 'margin-top:8px' });
        rows.append(h('div', { class: 'kit-boxd', 'aria-label': 'Box sizes' }, 'margin ' + inf.box.m, h('div', { class: 'p' }, 'padding ' + inf.box.p, h('div', { class: 'c' }, `${fmt(b.w)} × ${fmt(b.h)}`))));
        const row = (k, ...v) => h('div', { class: 'kit-row' }, h('span', { class: 'k' }, k), h('span', { class: 'v' }, ...v));
        const tick = ok => h('span', { class: ok ? 'kit-ok' : 'kit-bad', 'aria-label': ok ? 'passes' : 'check this' }, ok ? ' ✓' : ' ✕');
        const sw = c => h('span', { style: `display:inline-block;width:11px;height:11px;border-radius:3px;vertical-align:-1px;margin-right:5px;border:1px solid var(--k-line);background:${c}` });
        if (inf.text) rows.append(row('Text', inf.text.label, tick(inf.text.ok), inf.text.ok ? '' : h('span', { class: 'kit-hint' }, " not on Apple's scale")));
        if (inf.color) rows.append(row('Colour', sw(inf.color.swatch), inf.color.tok, h('span', { class: 'kit-hint' }, ` · ${inf.color.ratio.toFixed(1)}:1`), tick(inf.color.ok)));
        if (inf.bg) rows.append(row('Fill', sw(inf.bg.swatch), inf.bg.tok));
        if (inf.vo) rows.append(row('VoiceOver', inf.vo, h('span', { class: 'kit-hint' }, ' (roughly)')));
        if (inf.tap) rows.append(row('Tap area', inf.tap.label, tick(inf.tap.ok), inf.tap.ok ? '' : h('span', { class: 'kit-hint' }, ' under 44')));
        secSel.append(rows);
        secSel.append(h('div', { class: 'kit-sh', style: 'margin-top:10px' }, 'Note'));
        secSel.append(h('textarea', { class: 'kit-note', 'data-kf': 'note', placeholder: 'Something to change that isn’t a move, like “make this bolder”', 'aria-label': 'Note for ' + nameOf(el), onchange: ev => { if (S.original) { S.err = 'Turn off Show original to make changes'; return render(); } const v = ev.target.value.slice(0, 500); commit('Note', () => { E(el).note = v; }); } }, pe && pe.note ? pe.note : ''));
      }
    }
    I.append(secSel);

    const ar = h('div', { class: 'kit-sec' }, h('div', { class: 'kit-sh' }, 'Arrange'));
    const abtn = k => h('button', { type: 'button', class: 'kit-ic', 'aria-label': AN[k], title: AN[k], onclick: () => align(k) }, icon(k));
    ar.append(h('div', { class: 'kit-ih' }, ['l', 'c', 'r', 't', 'm', 'b'].map(abtn)));
    ar.append(h('div', { class: 'kit-ih', style: 'margin-top:6px' },
      h('button', { type: 'button', class: 'kit-ic', 'aria-label': 'Space out across', title: 'Space out across', onclick: () => distribute('x') }, icon('dx')),
      h('button', { type: 'button', class: 'kit-ic', 'aria-label': 'Space out down', title: 'Space out down', onclick: () => distribute('y') }, icon('dy')),
      h('label', { class: 'kit-gap' }, 'Gap', h('input', { type: 'text', inputmode: 'decimal', placeholder: 'even', 'data-kf': 'gap', value: S.gapVal || '', oninput: ev => { S.gapVal = ev.target.value; S.err = ''; } }))));
    ar.append(h('div', { class: 'kit-gl' }, 'Line up with'));
    ar.append(h('div', { class: 'kit-seg', role: 'group', 'aria-label': 'Line up with' }, [['selection', 'Selection'], ['key', 'Key box'], ['parent', 'Parent'], ['screen', 'Screen']].map(([v, l]) => h('button', { type: 'button', class: S.alignTo === v ? 'on' : '', 'aria-pressed': String(S.alignTo === v), onclick: () => { S.alignTo = v; S.err = ''; render(); } }, l))));
    const oneGroup = us.length === 1 && us[0].length > 1;
    ar.append(h('div', { class: 'kit-ih', style: 'margin-top:8px' },
      h('button', { type: 'button', class: 'kit-ib' + (S.multi ? ' on' : ''), 'aria-pressed': String(S.multi), onclick: () => { S.multi = !S.multi; render(); } }, 'Select several'),
      h('button', { type: 'button', class: 'kit-ib', onclick: () => oneGroup ? ungroup() : group(), title: oneGroup ? 'Ungroup (⇧⌘G)' : 'Group (⌘G)' }, oneGroup ? 'Ungroup' : 'Group'),
      h('button', { type: 'button', class: 'kit-ib' + (S.snap ? ' on' : ''), 'aria-pressed': String(S.snap), onclick: () => { S.snap = !S.snap; render(); } }, 'Smart snapping')));
    I.append(ar);

    const list = changeList(), ch = h('div', { class: 'kit-sec' }, h('div', { class: 'kit-sh' }, `Changes · ${list.length}`));
    ch.append(h('div', { class: 'kit-ih' },
      h('button', { type: 'button', class: 'kit-ib pri', onclick: copyChanges }, S.copied === true ? 'Copied' : 'Copy changes'),
      h('button', { type: 'button', class: 'kit-ib' + (S.original ? ' on' : ''), 'aria-pressed': String(S.original), onclick: () => { S.original = !S.original; applyAll(); render(); } }, 'Show original'),
      h('button', { type: 'button', class: 'kit-ib', onclick: () => { if (!Object.keys(S.model.edits).length) { S.status = 'No changes yet'; return render(); } commit('Clear changes', () => { S.model.edits = {}; }); } }, 'Clear')));
    if (S.original) ch.append(h('div', { class: 'kit-hint', style: 'margin-top:6px' }, 'Showing the original. Your changes are kept; turn this off to see them again.'));
    if (S.showText) {
      const t = changesText();
      if (t) {
        const ta = h('textarea', { class: 'kit-txtout', readonly: true, 'aria-label': 'Changes to paste into the chat', onfocus: ev => ev.target.select() }, t);
        ch.append(ta);
        ch.append(h('div', { class: 'kit-hint' }, S.copied === false ? 'Copying is blocked here. Tap the box, select all, then copy.' : 'Paste this into the chat.'));
      }
    }
    I.append(ch);

    const named = [...S.root.querySelectorAll('[data-name]')];
    const nums = new Map(); list.forEach((c, i) => c.el && nums.set(c.el, i + 1));
    const det = h('details', { class: 'kit-sec' }, h('summary', { class: 'kit-sh', style: 'cursor:pointer' }, `Outline · ${named.length}`));
    const ul = h('ul', { class: 'kit-out' });
    named.forEach(n => {
      let depth = 0, p = n.parentElement; while (p && p !== S.root) { if (p.hasAttribute('data-name')) depth++; p = p.parentElement; }
      ul.append(h('li', null, h('button', { type: 'button', class: sel.includes(n) ? 'cur' : '', style: `padding-left:${4 + depth * 12}px`, onclick: () => { S.sel = members(n); S.key = null; render(); } }, nums.has(n) ? h('span', { class: 'kit-pin' }, nums.get(n)) : '', n.getAttribute('data-name'))));
    });
    det.append(ul); if (S.outlineOpen) det.open = true;
    det.addEventListener('toggle', () => { S.outlineOpen = det.open; });
    I.append(det);
    I.append(h('div', { class: 'kit-msg ' + (S.err ? 'err' : 'st'), role: 'status', 'aria-live': 'polite' }, S.err || S.status));
    I.append(h('div', { class: 'kit-hint', style: 'margin-top:4px' }, 'Arrows nudge by 1, Shift + arrows by 10. Hold Option while dragging to skip snapping. Changes are kept on this device.'));
    if (keep) { const n = I.querySelector(`[data-kf="${keep.kf}"]`); if (n) { n.value = keep.v; n.focus({ preventScroll: true }); try { n.setSelectionRange(keep.a, keep.b); } catch (e) { } } }
  }

  /* ---------- keyboard ---------- */
  function bindKeys() {
    document.addEventListener('keydown', ev => {
      if (S.view === 0) return;
      const tg = ev.target, typing = tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable);
      const mod = ev.metaKey || ev.ctrlKey, k = (ev.key || '').toLowerCase();
      if (mod && k === 'z' && !typing) { ev.preventDefault(); return ev.shiftKey ? redo() : undo(); }
      if (typing) return;
      if (mod && k === 'g') { ev.preventDefault(); return ev.shiftKey ? ungroup() : group(); }
      if (ev.key === 'Escape') { S.sel = []; S.key = null; return render(); }
      const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
      if (!d || !liveSel().length) return;
      ev.preventDefault(); const n = ev.shiftKey ? 10 : 1; nudge(d[0] * n, d[1] * n);
    });
  }

  /* ---------- start ---------- */
  function start(opts) {
    S.opts = Object.assign({ app: 'App', id: location.pathname + location.search, root: '#app', controls: [], mac: false, launcher: 'circle', gaps: [16], margin: 16, title: '' }, opts || {});
    const root = typeof S.opts.root === 'string' ? document.querySelector(S.opts.root) : S.opts.root;
    if (!root) throw new Error('Kit: root not found');
    S.root = root; S.launcher = S.opts.launcher; S.lsKey = 'kit:' + S.opts.id;
    S.opts.controls.forEach(c => { S.custom[c.name] = c.value || 0; });
    document.body.classList.add('kit');
    const el = S.el;
    el.launcher = h('button', { type: 'button', 'aria-label': 'Open prototype controls', title: 'Prototype controls', onclick: () => setOpen(true) });
    el.panel = h('div', { class: 'kit-panel', role: 'region', 'aria-label': 'Prototype controls' });
    el.rt = sv('svg', { class: 'kit-ruler', 'aria-hidden': 'true' }); el.rl = sv('svg', { class: 'kit-ruler', 'aria-hidden': 'true' });
    el.screen = h('div', { class: 'kit-screen is-iphone' });
    el.layer = h('div', { class: 'kit-layer', 'aria-hidden': 'true' });
    el.ov = sv('svg', { class: 'kit-ov', 'aria-hidden': 'true' });
    el.device = h('div', { class: 'kit-device' }, el.screen);
    el.box = h('div', { class: 'kit-box' }, el.device);
    el.insp = h('aside', { class: 'kit-insp', 'aria-label': 'Inspector' });
    root.classList.add('kit-root');
    el.screen.append(root, el.ov, el.layer);
    const canvas = h('div', { class: 'kit-canvas' }, el.rt, el.rl, el.box);
    document.body.append(h('div', { class: 'kit-stage' }, el.launcher, el.panel, canvas, el.insp));
    S.open = !(window.innerWidth <= 600);
    load(); applyLook(); applyMotion(); bindLayer(); bindKeys();
    renderPanel(); layout(); applyAll(); render();
    let rz = 0; window.addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { layout(); renderPanel(); render(); }); });
    let mt = 0; new MutationObserver(() => { clearTimeout(mt); mt = setTimeout(() => { if (S.view === 2) markText(); applyAll(); schedule(); }, 30); }).observe(root, { childList: true, subtree: true });
    return api;
  }

  const api = {
    start,
    get: () => ({ device: S.device, look: S.look, motion: S.motion, view: S.view, custom: Object.assign({}, S.custom) }),
    set(name, i) { const g = groups().find(x => x.name === name); if (!g) throw new Error('Kit: no control called ' + name); g.set(i); renderPanel(); fire(); },
    groups: () => groups().map(g => ({ name: g.name, options: g.options.slice() })),
    select(q) { const list = (Array.isArray(q) ? q : [q]).map(x => typeof x === 'string' ? S.root.querySelector('[data-name="' + CSS.escape(x) + '"]') : x).filter(Boolean); S.sel = list; S.key = null; render(); return list.length; },
    open: v => setOpen(v !== false),
    setLauncher(shape) { S.launcher = shape; renderLauncher(); renderPanel(); },
    changesText, undo, redo, align, distribute, group, ungroup, nudge, field: applyField,
    setAlignTo(v) { S.alignTo = v; render(); },
    setGap(v) { S.gapVal = String(v); },
    clear() { commit('Clear changes', () => { S.model.edits = {}; }); },
    original(v) { S.original = !!v; applyAll(); render(); },
    refresh() { applyAll(); render(); },
    k: () => (S.motion === 1 ? 4 : 1),
    reduced: () => S.motion === 2,
    state: () => ({ edits: JSON.parse(JSON.stringify(S.model.edits)), undo: S.undo.map(u => u.name), redo: S.redo.map(u => u.name), sel: liveSel().map(nameOf), scale: S.scale, phone: S.phone, open: S.open })
  };
  window.Kit = api;
})();
