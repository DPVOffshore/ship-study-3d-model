// 2,800 TEU-class geared container ship ("Chittagong Max" type), rebuilt from published principal particulars.
// Units: metres. y-up, keel (baseline) at y=0, +x = forward (bow), +z = starboard, midships of LOA at x=0.
export const SPEC = { LOA: 186, B: 35.6, D: 17.9, T: 11.0 };

export function buildShip(THREE) {
  const V3 = THREE.Vector3, PI = Math.PI;
  const B2 = SPEC.B / 2, D = SPEC.D, T = SPEC.T, FC = 2.7, DF = D + FC;

  // ---------- materials ----------
  const M = {};
  const mat = (k, name, color, r, m, x = {}) => (M[k] = new THREE.MeshStandardMaterial({ name, color, roughness: r, metalness: m, ...x }));
  const DS = { side: THREE.DoubleSide };
  mat('hull', 'paint_hull_topside_turquoise', 0x2cc9dc, 0.4, 0.15, DS);
  mat('af', 'paint_antifouling_red', 0xba211b, 0.72, 0.05, DS);
  mat('deck', 'paint_deck_grey_green', 0x5b6562, 0.78, 0.1, DS);
  mat('hatch', 'paint_hatch_cover_dark_grey', 0x4d5257, 0.6, 0.2);
  mat('white', 'paint_superstructure_cream', 0xf1e6c0, 0.5, 0.08, DS);
  mat('funnel', 'paint_funnel_blue', 0x2e9fd0, 0.45, 0.15);
  mat('breakw', 'paint_breakwater_grey', 0x575b60, 0.6, 0.2, DS);
  mat('glass', 'glass_tinted', 0x1d2c37, 0.08, 0.3);
  mat('crane', 'paint_crane_grey', 0x8c9196, 0.5, 0.25);
  mat('yellow', 'paint_safety_yellow', 0xd6a21e, 0.5, 0.1);
  mat('red', 'paint_signal_red', 0xb0271f, 0.5, 0.1);
  mat('orange', 'paint_lifeboat_orange', 0xe35a12, 0.45, 0.05);
  mat('galv', 'steel_galvanized', 0x9aa1a4, 0.45, 0.35);
  mat('steel', 'steel_dark', 0x383c40, 0.55, 0.35);
  mat('black', 'paint_black', 0x1a1b1d, 0.6, 0.1);
  mat('bronze', 'nickel_aluminium_bronze', 0xc39a55, 0.28, 0.35, DS);
  mat('mach', 'paint_machinery_green_grey', 0x8d9b95, 0.5, 0.25);
  mat('rubber', 'rubber_black', 0x141414, 0.9, 0);
  mat('markW', 'paint_marking_white', 0xf1f1ec, 0.6, 0);
  mat('struct', 'paint_internal_structure', 0x7b8488, 0.7, 0.2, DS);
  mat('grating', 'steel_grating', 0x8f979b, 0.6, 0.3, DS);
  mat('lampW', 'lamp_white', 0xffffff, 0.3, 0, { emissive: 0xfff6d8, emissiveIntensity: 1.2 });
  mat('lampR', 'lamp_red_port', 0xff2a1a, 0.3, 0, { emissive: 0xff1a0a, emissiveIntensity: 1.4 });
  mat('lampG', 'lamp_green_starboard', 0x22ff66, 0.3, 0, { emissive: 0x10e050, emissiveIntensity: 1.4 });
  const CONT = [
    ['container_red', 0x9a3326, 22], ['container_blue', 0x2d5b88, 20], ['container_green', 0x3e6b4a, 10],
    ['container_grey', 0x8a8e8e, 12], ['container_orange', 0xb8612d, 8], ['container_beige', 0xb3a27c, 10],
    ['container_navy', 0x283a55, 8], ['container_yellow', 0xc89a2c, 3], ['container_reefer_white', 0xdedeD8, 7]
  ].map(([n, c, w]) => ({ m: mat(n, n, c, 0.66, 0.15), w }));
  const CW = CONT.reduce((s, c) => s + c.w, 0);
  { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 8; const cx = cv.getContext('2d');
    for (let x = 0; x < 256; x++) { const nx = Math.sin((x % 16) / 16 * 2 * Math.PI); cx.fillStyle = `rgb(${Math.round(128 + 110 * nx)},128,255)`; cx.fillRect(x, 0, 1, 8); }
    const nt = new THREE.CanvasTexture(cv); nt.wrapS = nt.wrapT = THREE.RepeatWrapping;
    CONT.forEach(c => { c.m.normalMap = nt; c.m.normalScale = new THREE.Vector2(0.9, 0.9); }); }

  let seed = 28061;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pickCont = () => { let r = rnd() * CW; for (const c of CONT) { if ((r -= c.w) <= 0) return c.m; } return CONT[0].m; };

  // ---------- helpers ----------
  const root = new THREE.Group(); root.name = 'geared_container_ship_2800teu';
  const G = (name, parent = root) => { const g = new THREE.Group(); g.name = name; parent.add(g); return g; };
  const mesh = (p, name, geo, m) => { const o = new THREE.Mesh(geo, m); o.name = name; p.add(o); return o; };
  const box = (p, name, m, sx, sy, sz, x, y, z, ry = 0, rx = 0, rz = 0) => { const o = mesh(p, name, new THREE.BoxGeometry(sx, sy, sz), m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o; };
  const cyl = (p, name, m, r, h, axis, x, y, z, seg = 24, rTop) => {
    const g = new THREE.CylinderGeometry(rTop ?? r, r, h, seg);
    if (axis === 'x') g.rotateZ(-PI / 2); else if (axis === 'z') g.rotateX(PI / 2);
    const o = mesh(p, name, g, m); o.position.set(x, y, z); return o;
  };
  const up = new V3(0, 1, 0);
  const tube = (p, name, m, a, b, r, seg = 8) => {
    const va = new V3(...a), vb = new V3(...b), len = va.distanceTo(vb);
    const o = mesh(p, name, new THREE.CylinderGeometry(r, r, len, seg), m);
    o.position.copy(va).add(vb).multiplyScalar(0.5);
    o.quaternion.setFromUnitVectors(up, vb.clone().sub(va).normalize()); return o;
  };
  const sphere = (p, name, m, r, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = mesh(p, name, new THREE.SphereGeometry(r, 24, 16), m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); return o; };
  const torus = (p, name, m, R, r, x, y, z, rx = 0, ry = 0, arc = 2 * PI) => { const o = mesh(p, name, new THREE.TorusGeometry(R, r, 8, 24, arc), m); o.position.set(x, y, z); o.rotation.set(rx, ry, 0); return o; };

  function mergeGeoms(list) {
    let nv = 0, ni = 0;
    for (const g of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = new Uint32Array(ni);
    const hasUV = list.every(g => g.attributes.uv), uv = hasUV ? new Float32Array(nv * 2) : null;
    let vo = 0, io = 0;
    for (const g of list) {
      if (!g.attributes.normal) g.computeVertexNormals();
      const c = g.attributes.position.count;
      pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3);
      if (hasUV) uv.set(g.attributes.uv.array, vo * 2);
      if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) idx[io + k] = a[k] + vo; io += a.length; }
      else { for (let k = 0; k < c; k++) idx[io + k] = vo + k; io += c; }
      vo += c;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    if (hasUV) out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    out.setIndex(new THREE.BufferAttribute(idx, 1)); return out;
  }
  // Flatten a group of many small meshes into one mesh per material (keeps draw calls low).
  function mergeGroup(group) {
    group.updateMatrixWorld(true);
    const inv = group.matrixWorld.clone().invert(), buckets = new Map();
    group.traverse(o => {
      if (!o.isMesh) return;
      const g = o.geometry.clone(); if (!(o.material.map || o.material.normalMap)) g.deleteAttribute('uv');
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      if (!buckets.has(o.material)) buckets.set(o.material, []);
      buckets.get(o.material).push(g);
    });
    while (group.children.length) group.remove(group.children[0]);
    for (const [m, list] of buckets) mesh(group, group.name + '_' + m.name, mergeGeoms(list), m);
    return group;
  }

  // ---------- stairs & ladders (real geometry) ----------
  function stairFlight(p, name, a, b, w = 0.8, m = M.white) {
    const g = G(name, p), dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx), z = a[2], cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
    for (const sd of [1, -1]) { const st = box(g, name + '_stringer', m, len + 0.1, 0.24, 0.025, cx, cy + 0.05, z + sd * w / 2); st.rotation.z = ang; }
    const n = Math.max(3, Math.round(dy / 0.21)), run = Math.abs(dx) / n;
    for (let i = 1; i < n; i++) { const t = i / n; box(g, name + '_tread', M.grating, run + 0.05, 0.035, w - 0.03, a[0] + dx * t, a[1] + dy * t, z); box(g, name + '_tread_nosing', M.yellow, 0.03, 0.036, w - 0.03, a[0] + dx * t + Math.sign(dx) * -(run + 0.05) / 2 + Math.sign(dx) * 0.015 * 0, a[1] + dy * t, z); }
    for (const sd of [1, -1]) {
      for (const hh of [1.0, 0.5]) tube(g, name + '_handrail', m, [a[0], a[1] + hh, z + sd * w / 2], [b[0], b[1] + hh, z + sd * w / 2], hh > 0.9 ? 0.024 : 0.016, 6);
      for (const t of [0.08, 0.5, 0.92]) { const x = a[0] + dx * t, y = a[1] + dy * t; tube(g, name + '_stanchion', m, [x, y + 0.05, z + sd * w / 2], [x, y + 1.0, z + sd * w / 2], 0.018, 6); }
    }
    mergeGroup(g); return g;
  }
  function iBeam(p, name, m, x, y0, y1, z, d = 0.3, bw = 0.25, ry = 0) {
    const g = G(name, p), h = y1 - y0, yc = (y0 + y1) / 2; g.position.set(x, yc, z); g.rotation.y = ry;
    box(g, name, m, 0.02, h, d - 0.04, 0, 0, 0); for (const sd of [1, -1]) box(g, name, m, bw, h, 0.025, 0, 0, sd * d / 2);
    box(g, name + '_base_plate', m, bw + 0.15, 0.03, d + 0.15, 0, -h / 2 + 0.015, 0); return g;
  }
  function vLadder(p, name, x, y0, y1, z, alongZ = false, m = M.galv, w = 0.42) {
    const g = G(name, p);
    for (const sd of [1, -1]) cyl(g, name + '_rail', m, 0.022, y1 - y0 + 0.9, 'y', x + (alongZ ? 0 : sd * w / 2), (y0 + y1 + 0.9) / 2, z + (alongZ ? sd * w / 2 : 0), 6);
    for (let y = y0 + 0.3; y < y1; y += 0.3) cyl(g, name + '_rung', m, 0.014, w, alongZ ? 'z' : 'x', x, y, z, 5);
    mergeGroup(g); return g;
  }
  function walkway(p, name, x0, x1, y, zIn, zOut, m = M.white) {
    const g = G(name, p), xc = (x0 + x1) / 2, L = x1 - x0, zc = (zIn + zOut) / 2, W = Math.abs(zOut - zIn), so = Math.sign(zOut);
    box(g, name + '_grating', M.grating, L, 0.04, W, xc, y - 0.02, zc);
    box(g, name + '_toe_plate', m, L, 0.12, 0.012, xc, y + 0.05, zOut);
    box(g, name + '_edge_angle', m, L, 0.12, 0.06, xc, y - 0.09, zOut);
    for (let x = x0; x <= x1 + 0.01; x += 1.4) { tube(g, name + '_stanchion', m, [x, y, zOut], [x, y + 1.0, zOut], 0.02, 6); const br = box(g, name + '_bracket', m, 0.06, 0.05, W, x, y - 0.35, zc); br.rotation.x = so * 0.55; }
    for (const hh of [1.0, 0.5]) tube(g, name + '_handrail', m, [x0, y + hh, zOut], [x1, y + hh, zOut], hh > 0.9 ? 0.024 : 0.016, 6);
    mergeGroup(g); return g;
  }

  // ---------- hull form ----------
  const tab = (t, v) => { if (v <= t[0][0]) return t[0][1]; for (let i = 1; i < t.length; i++) if (v <= t[i][0]) { const a = t[i - 1], b = t[i]; return a[1] + (b[1] - a[1]) * (v - a[0]) / (b[0] - a[0]); } return t[t.length - 1][1]; };
  const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const stemT = [[0, 77], [1.5, 81], [3, 83.2], [6, 85.6], [9, 87.4], [11, 88.3], [14, 89.8], [17.9, 91.6], [20.6, 93], [22, 93.6]];
  const aftT = [[0, -77], [0.7, -80], [1.5, -82.2], [7.4, -82.4], [8.6, -85.2], [9.8, -89], [10.9, -93], [30, -93]];
  const BULB = { x: 86.6, y: 5.6, a: 4.4, b: 3.3, c: 2.9 };
  const RB = 2.4;
  const xStem = y => tab(stemT, y);
  const bulbFront = y => { const q = (y - BULB.y) / BULB.b; return Math.abs(q) < 1 ? BULB.x + BULB.a * Math.sqrt(1 - q * q) : -1e9; };
  const xF = y => Math.max(xStem(y), bulbFront(y));
  const xA = y => tab(aftT, y);
  const sec = y => y >= RB ? B2 : B2 - RB + Math.sqrt(Math.max(0, RB * RB - (RB - y) ** 2));
  function hb(x, y) {
    let f = 1, g = 1;
    const x0 = tab([[0, 16], [6, 21], [11, 28], [17.9, 40], [22, 42]], y), xs = xStem(y);
    if (x > x0) { const s = Math.min(1, (x - x0) / (xs - x0)); f = Math.max(0, 1 - Math.pow(s, tab([[0, 1.7], [11, 1.95], [17.9, 2.9], [22, 3.2]], y))); }
    const x1 = tab([[0, -16], [8, -28], [17.9, -46]], y), xa = xA(y);
    if (x < x1) {
      const s = Math.min(1, (x1 - x) / (x1 - xa)), m = smooth(5, 9.5, y);
      const end = tab([[7.4, 0], [8.6, 0.36], [10.9, 0.6], [17.9, 0.78], [22, 0.8]], y);
      const low = Math.pow(Math.max(0, 1 - s * s), 1.2), upp = 1 - (1 - end) * Math.pow(s, 2.1);
      g = (1 - m) * low + m * upp;
    }
    let h = sec(y) * f * g;
    if (x < x1 && y < 7.6) h = Math.max(h, 0.6 * (1 - smooth(7.0, 7.6, y)));
    const q = (y - BULB.y) / BULB.b;
    if (Math.abs(q) < 1) { const k = 1 - q * q; let r = 0; if (x >= BULB.x) { const px = (x - BULB.x) / BULB.a; r = k - px * px > 0 ? BULB.c * Math.sqrt(k - px * px) : 0; } else r = BULB.c * Math.sqrt(k); h = Math.max(h, r); }
    return h;
  }

  // Waterline-row loft: each row is a waterline sampled from its aft end to its forward end, mirrored port/starboard.
  function loftRows(ys, xa, xf, nc) {
    return ys.map(y => { const a = xa(y), b = xf(y), row = []; for (let i = 0; i <= nc; i++) { const w = (1 - Math.cos(PI * i / nc)) / 2, x = a + (b - a) * w; row.push([x, y, hb(x, y)]); } return row; });
  }
  function gridGeo(rows, j0, j1) {
    const nc = rows[0].length, pos = [], idx = [];
    for (const r of rows) for (const p of r) pos.push(p[0], p[1], p[2]);
    for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < nc - 1; i++) { const a = j * nc + i, b = a + 1, c = a + nc, d = c + 1; idx.push(a, b, d, a, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    // slice rows j0..j1 and mirror to port
    const P = g.attributes.position.array, N = g.attributes.normal.array, nr = j1 - j0 + 1, nv = nr * nc;
    const op = new Float32Array(nv * 6), on = new Float32Array(nv * 6), oi = [];
    for (let k = 0; k < nv; k++) for (let c = 0; c < 3; c++) {
      const s = (j0 * nc + k) * 3 + c; op[k * 3 + c] = P[s]; on[k * 3 + c] = N[s];
      op[(nv + k) * 3 + c] = c === 2 ? -P[s] : P[s]; on[(nv + k) * 3 + c] = c === 2 ? -N[s] : N[s];
    }
    for (let j = 0; j < nr - 1; j++) for (let i = 0; i < nc - 1; i++) { const a = j * nc + i, b = a + 1, c = a + nc, d = c + 1; oi.push(a, b, d, a, d, c, nv + a, nv + d, nv + b, nv + a, nv + c, nv + d); }
    const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.BufferAttribute(op, 3)); o.setAttribute('normal', new THREE.BufferAttribute(on, 3)); o.setIndex(oi); return o;
  }
  function endCap(rows, j0, j1, col) { // closes the aft end of each waterline across the centreline
    const pos = [];
    for (let j = j0; j < j1; j++) { const a = rows[j][col], b = rows[j + 1][col]; pos.push(a[0], a[1], a[2], a[0], a[1], -a[2], b[0], b[1], -b[2], a[0], a[1], a[2], b[0], b[1], -b[2], b[0], b[1], b[2]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
  }
  function planShape(y, xa, xf, n, inset = 0) {
    const s = new THREE.Shape(), pts = [];
    for (let i = 0; i <= n; i++) { const x = xa + (xf - xa) * i / n; pts.push([x, Math.max(0.05, hb(x, y) - inset)]); }
    s.moveTo(pts[0][0], -pts[0][1]); for (const p of pts) s.lineTo(p[0], -p[1]); for (let i = pts.length - 1; i >= 0; i--) s.lineTo(pts[i][0], pts[i][1]);
    return s;
  }
  const planGeo = (shape, y) => { const g = new THREE.ShapeGeometry(shape); g.rotateX(-PI / 2); g.translate(0, y, 0); return g; };
  function sectionGeo(x, y0, y1, inset = 0) {
    const s = new THREE.Shape(), ys = []; for (let i = 0; i <= 24; i++) ys.push(y0 + (y1 - y0) * i / 24);
    s.moveTo(0, y0); for (const y of ys) s.lineTo(Math.max(0.05, hb(x, y) - inset), y); s.lineTo(0, y1);
    for (let i = ys.length - 1; i >= 0; i--) s.lineTo(-Math.max(0.05, hb(x, ys[i]) - inset), ys[i]);
    const g = new THREE.ShapeGeometry(s); g.rotateY(PI / 2); g.translate(x, 0, 0); return g;
  }

  const hull = G('hull');
  const ys = [0, 0.12, 0.35, 0.7, 1.15, 1.7, 2.1, 2.4, 3.2, 4.0, 4.8, 5.6, 6.4, 7.0, 7.4, 7.8, 8.2, 8.6, 8.95, 9.3, 9.8, 10.35, 10.9, 11.0, 11.6, 12.4, 13.4, 14.5, 15.6, 16.8, 17.9];
  const jWL = ys.indexOf(11.0), jTop = ys.length - 1;
  const rows = loftRows(ys, xA, xF, 220);
  mesh(hull, 'hull_bottom_shell_antifouling', gridGeo(rows, 0, jWL), M.af);
  mesh(hull, 'hull_side_shell_topside', gridGeo(rows, jWL, jTop), M.hull);
  mesh(hull, 'hull_stern_counter_underwater', endCap(rows, 0, jWL, 0), M.af);
  mesh(hull, 'hull_transom', endCap(rows, jWL, jTop, 0), M.hull);
  { const pos = []; const r0 = rows[0]; for (let i = 0; i < r0.length - 1; i++) { const a = r0[i], b = r0[i + 1]; pos.push(a[0], 0, a[2], a[0], 0, -a[2], b[0], 0, -b[2], a[0], 0, a[2], b[0], 0, -b[2], b[0], 0, b[2]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); mesh(hull, 'hull_flat_bottom_keel', g, M.af); }
  const FX = 78.3, SX = 61.5, BWT = DF + 1.3, sheerTop = x => x >= FX ? BWT : D + (BWT - D) * smooth(SX, FX, x);
  const shRows = []; for (let j = 0; j <= 6; j++) { const row = []; for (let i = 0; i <= 90; i++) { const x = SX + (xStem(BWT) - SX) * i / 90, y = D + (sheerTop(x) - D) * j / 6; row.push([x, y, hb(x, y)]); } shRows.push(row); }
  mesh(hull, 'sheer_strake_and_forecastle_side_shell', gridGeo(shRows, 0, 6), M.hull);
  mesh(hull, 'forecastle_break_bulkhead', sectionGeo(FX, D, DF, 0.05), M.breakw);
  const abRows = loftRows([D, D + 1.2], () => -93, () => -85.5, 20);
  mesh(hull, 'aft_bulwark', gridGeo(abRows, 0, 1), M.hull);
  mesh(hull, 'aft_bulwark_transom', endCap(abRows, 0, 1, 0), M.hull);
  // bulwark cap rails
  for (const [rs, nm] of [[[null, shRows[6]], 'sheer_strake_cap'], [abRows, 'aft_bulwark_cap']]) {
    const top = rs[1]; for (const s of [1, -1]) for (let i = 0; i < top.length - 1; i += 2) { const a = top[i], b = top[Math.min(i + 2, top.length - 1)]; tube(hull, nm, M.white, [a[0], a[1], s * a[2]], [b[0], b[1], s * b[2]], 0.07, 6); }
  }
  mesh(hull, 'main_deck', planGeo(planShape(D, -93, xStem(D) - 0.02, 120), D + 0.002), M.deck);
  mesh(hull, 'forecastle_deck', planGeo(planShape(DF, FX, xStem(DF) - 0.02, 40), DF + 0.002), M.deck);
  // bilge keels (45° on the turn of bilge, ~40% LPP)
  { const yb = RB * (1 - Math.SQRT1_2), zb = B2 - RB + RB * Math.SQRT1_2;
    for (const s of [1, -1]) { const o = box(hull, 'bilge_keel', M.af, 62, 0.45, 0.04, -2, yb - 0.16, s * (zb + 0.16)); o.rotation.x = s * PI / 4; } }

  // ---------- hull markings ----------
  const marks = G('hull_markings', hull);
  const onSide = (name, m, x, y, s, sx, sy, depth = 0.02) => {
    const z = hb(x, y), z2 = hb(x + 0.3, y), ang = Math.atan2(-(z2 - z), 0.3);
    const o = box(marks, name, m, sx, sy, depth, x, y, s * (z + 0.02)); o.rotation.y = s * ang; return o;
  };
  for (const s of [1, -1]) {
    const tr = torus(marks, 'plimsoll_ring', M.markW, 0.15, 0.0125, 0, T, s * (B2 + 0.02)); tr.rotation.y = s > 0 ? 0 : PI;
    box(marks, 'plimsoll_bar', M.markW, 0.45, 0.025, 0.02, 0, T, s * (B2 + 0.02));
    box(marks, 'deck_line_mark', M.markW, 0.3, 0.025, 0.02, 0, D - 0.3, s * (B2 + 0.02));
    box(marks, 'load_line_grid_vertical', M.markW, 0.025, 0.55, 0.02, 0.54, T + 0.05, s * (B2 + 0.02));
    for (const [dy, w] of [[0.25, 0.23], [0.0, 0.23], [-0.23, 0.23], [0.18, -0.23], [0.43, -0.23]]) box(marks, 'load_line_grid_tick', M.markW, 0.23, 0.025, 0.02, 0.54 + w / 2 + (w > 0 ? 0.0125 : -0.0125), T + dy, s * (B2 + 0.02));
    const yT = 13.2; const bt = torus(marks, 'bow_thruster_symbol_ring', M.markW, 0.6, 0.05, 79.5, yT, s * (hb(79.5, yT) + 0.05)); bt.rotation.y = Math.atan2(0, 1);
    for (const a of [PI / 4, -PI / 4]) { const o = onSide('bow_thruster_symbol_cross', M.markW, 79.5, yT, s, 1.1, 0.08, 0.03); o.rotation.z = a; }
    const bb = torus(marks, 'bulbous_bow_symbol_ring', M.markW, 0.5, 0.05, 86.4, 13.2, s * (hb(86.4, 13.2) + 0.05));
    onSide('bulbous_bow_symbol_bar', M.markW, 86.8, 13.2, s, 0.9, 0.08, 0.03);
  }

  { const cells = ['2', '4', '6', '8']; for (let m = 1; m <= 14; m++) cells.push(m + 'M');
    const cv = document.createElement('canvas'); cv.width = 96 * cells.length; cv.height = 64; const cx = cv.getContext('2d');
    cx.fillStyle = '#fff'; cx.font = 'bold 60px Arial, sans-serif'; cx.textBaseline = 'bottom';
    cells.forEach((t, i) => cx.fillText(t, i * 96 + 2, 62));
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    M.draft = new THREE.MeshStandardMaterial({ name: 'paint_draft_marks_white', map: tex, transparent: true, alphaTest: 0.4, roughness: 0.6, metalness: 0, side: THREE.DoubleSide });
    const dg = G('draft_marks_metric', marks), H = 0.1, W = 0.15;
    const label = (cell, x, y, s) => {
      const g = new THREE.PlaneGeometry(W, H), uv = g.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setX(k, (cell + uv.getX(k)) / cells.length);
      const z = hb(x, y + H / 2), dz = hb(x + 0.3, y + H / 2) - z;
      const o = mesh(dg, 'draft_numeral', g, M.draft); o.position.set(x + W / 2, y + H / 2, s * (z + 0.03)); o.rotation.y = Math.atan2(-dz, s * 0.3);
    };
    for (const s of [1, -1]) for (const [xf, y0] of [[y => xStem(y) - 1.0, 1], [() => 1.6, 1], [() => -76.5, 3]]) for (let m = y0; m <= 14; m++) {
      label(3 + m, xf(m), m, s);
      if (m < 14) for (let d = 0; d < 4; d++) label(d, xf(m + 0.2 * (d + 1)), m + 0.2 * (d + 1), s);
    }
    mergeGroup(dg);
  }

  // ---------- stern gear: propeller, rudder, bossing ----------
  const stern = G('propulsion_and_steering');
  const SH_Y = 3.7, PX = -83.9, PR = 3.3;
  cyl(stern, 'stern_tube_bossing', M.af, 0.85, 3.4, 'x', -81.2, SH_Y, 0, 32, 0.95);
  {
    const prop = G('propeller_fpp_5_blade', stern); prop.position.set(PX, SH_Y, 0);
    cyl(prop, 'propeller_hub', M.bronze, 0.72, 2.0, 'x', 0.05, 0, 0, 32, 0.66);
    const cap = mesh(prop, 'propeller_cap', new THREE.SphereGeometry(0.66, 24, 12, 0, 2 * PI, 0, PI / 2), M.bronze); cap.rotation.z = PI / 2; cap.position.x = -0.95; cap.scale.set(1, 1.6, 1);
    const bladeGeo = (() => {
      const NR = 14, NCc = 16, P = 0.9 * 2 * PR, rh = 0.62, pos = [], idx = [];
      const per = (NCc + 1);
      for (const side of [1, -1]) for (let i = 0; i <= NR; i++) {
        const r = rh + (PR - rh) * i / NR, rr = r / PR;
        const c = 2 * PR * (0.17 + 0.2 * Math.sin(PI * (rr - 0.15) / 0.98)) * Math.sqrt(Math.max(0, 1 - Math.pow((rr - 0.19) / 0.81, 8)));
        const skew = 0.42 * Math.pow((rr - 0.19) / 0.81, 2), phi = Math.atan(P / (2 * PI * r)), tmax = 0.26 * (1 - rr) + 0.03;
        for (let j = 0; j <= NCc; j++) {
          const t = -0.5 + j / NCc, sArc = t * c, th = tmax * Math.pow(Math.max(0, 1 - 4 * t * t), 0.7) * 0.5;
          const dth = (sArc * Math.cos(phi) + side * th * Math.sin(phi)) / r, ax = -sArc * Math.sin(phi) + side * th * Math.cos(phi) - 0.25 * (rr - 0.19);
          const a = skew + dth; pos.push(ax, r * Math.cos(a), r * Math.sin(a));
        }
      }
      const off = (NR + 1) * per;
      for (let i = 0; i < NR; i++) for (let j = 0; j < NCc; j++) { const a = i * per + j, b = a + 1, c2 = a + per, d = c2 + 1; idx.push(a, c2, d, a, d, b, off + a, off + d, off + c2, off + a, off + b, off + d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
    })();
    for (let k = 0; k < 5; k++) { const b = mesh(prop, `propeller_blade_${k + 1}`, bladeGeo, M.bronze); b.rotation.x = k * 2 * PI / 5; }
  }
  {
    const rud = G('spade_rudder', stern), C = 5.6, H0 = 0.9, H1 = 9.2, xLE = -86.5, t = 0.18;
    const sh = new THREE.Shape(); const N = 24;
    const yt = u => 5 * t * C * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1036 * u ** 4);
    sh.moveTo(0, 0); for (let i = 1; i <= N; i++) { const u = (1 - Math.cos(PI * i / N)) / 2; sh.lineTo(-u * C, yt(u)); } for (let i = N - 1; i >= 1; i--) { const u = (1 - Math.cos(PI * i / N)) / 2; sh.lineTo(-u * C, -yt(u)); }
    const g = new THREE.ExtrudeGeometry(sh, { depth: H1 - H0, bevelEnabled: false, curveSegments: 4 }); g.rotateX(-PI / 2); g.translate(xLE, H0, 0);
    mesh(rud, 'rudder_blade', g, M.af);
    sphere(rud, 'rudder_costa_bulb', M.af, 1, xLE + 0.2, SH_Y, 0, 1.3, 0.75, 0.75);
    cyl(rud, 'rudder_stock', M.steel, 0.38, 3.8, 'y', -88.2, H1 + 1.6, 0, 20);
    box(rud, 'rudder_zinc_anode', M.galv, 0.6, 0.25, 0.08, -89.5, 2.2, 0.52);
    box(rud, 'rudder_zinc_anode', M.galv, 0.6, 0.25, 0.08, -89.5, 2.2, -0.52);
  }

  // ---------- general arrangement: bays, cranes, holds ----------
  const BAY = 12.5, BAYS = []; { let x = -70.6; const gaps = [1.8, 4.2, 1.8, 1.8, 4.2, 1.8, 1.8, 4.2, 1.8]; for (let i = 0; i < 10; i++) { BAYS.push([x, x + BAY]); x += BAY + (gaps[i] || 0); } }
  const CRANE_X = [(BAYS[1][1] + BAYS[2][0]) / 2, (BAYS[4][1] + BAYS[5][0]) / 2, (BAYS[7][1] + BAYS[8][0]) / 2];
  const LASH_X = [[0, 1], [2, 3], [3, 4], [5, 6], [6, 7], [8, 9]].map(([a, b]) => (BAYS[a][1] + BAYS[b][0]) / 2);
  const ER_FWD = (BAYS[0][1] + BAYS[1][0]) / 2, ER_AFT = -81, COLL = 78.3;
  const hbDeckMin = (x0, x1) => Math.min(hb(x0, D), hb(x1, D));
  const coamHW = i => Math.min(15.6, hbDeckMin(...BAYS[i]) - 1.9);
  const COAM_TOP = D + 1.6, COVER_TOP = COAM_TOP + 0.9, STACK0 = COVER_TOP + 0.1;
  const EYE_Y = D + 7 * 3.1 + 1.9, EYE_X = -77.5;
  const cranePose = [{ luff: 15 }, { luff: 15 }, { luff: 2 }], PH = 15.0, JL = 32, HEEL = [2.9, 2.0];
  const CRANES = CRANE_X.map((xc, n) => { const a = cranePose[n].luff * PI / 180, hx = xc + HEEL[0], hy = D + PH + 0.45 + HEEL[1]; return { x: xc, z: -(hb(xc, D) - 2.4), a, hx, hy, tan: Math.tan(a), tx: hx + JL * Math.cos(a) + 1 }; });
  const visTop = x => T + (EYE_Y - T) * (93 + 372 - x) / (93 + 372 - EYE_X); // SOLAS V/22 blind-sector limit (2 x LOA)

  // hatch coamings + covers
  const hatches = G('hatch_coamings_and_covers');
  BAYS.forEach(([x0, x1], i) => {
    const g = G(`hatch_${String(i + 1).padStart(2, '0')}`, hatches), cw = coamHW(i), L = x1 - x0 + 0.5, xc = (x0 + x1) / 2, hC = COAM_TOP - D;
    for (const s of [1, -1]) {
      box(g, 'coaming_side', M.hatch, L, hC, 0.25, xc, D + hC / 2, s * cw);
      box(g, 'coaming_top_flange', M.hatch, L, 0.06, 0.7, xc, COAM_TOP - 0.03, s * (cw + 0.1));
      box(g, 'coaming_end', M.hatch, 0.25, hC, 2 * cw, xc + s * L / 2, D + hC / 2, 0);
      for (let x = x0 + 0.6; x < x1; x += 2.6) box(g, 'coaming_stay', M.hatch, 0.04, 1.3, 0.8, x, D + 0.65, s * (cw + 0.42));
    }
    const n = cw * 2 > 24 ? 3 : 2, W = 2 * (cw + 0.35), pw = W / n - 0.04;
    for (let k = 0; k < n; k++) {
      const z = -W / 2 + (k + 0.5) * W / n;
      box(g, `hatch_cover_panel_${k + 1}`, M.hatch, L + 0.2, 0.8, pw, xc, COVER_TOP - 0.4, z);
      for (const dz of [-pw / 3, pw / 3]) box(g, 'cover_top_stiffener', M.hatch, L, 0.06, 0.2, xc, COVER_TOP + 0.03, z + dz);
      for (let xx = xc - L / 2 + 1.0; xx < xc + L / 2; xx += 2.0) box(g, 'cover_top_stiffener', M.hatch, 0.12, 0.04, pw - 0.1, xx, COVER_TOP + 0.02, z);
      for (const sd of [1, -1]) { box(g, 'cover_side_flange', M.hatch, L + 0.22, 0.12, 0.05, xc, COVER_TOP - 0.05, z + sd * pw / 2); box(g, 'cover_rubber_packing', M.rubber, L + 0.2, 0.06, 0.05, xc, COVER_TOP - 0.82, z + sd * (pw / 2 - 0.05)); }
      for (const sd of [1, -1]) box(g, 'cover_end_plate', M.hatch, 0.05, 0.78, pw - 0.02, xc + sd * (L / 2 + 0.1), COVER_TOP - 0.4, z);
      for (const dx of [-6.0, 6.0]) for (const dz of [-pw / 2 + 1.2, pw / 2 - 1.2]) { box(g, 'cover_twistlock_socket', M.steel, 0.3, 0.05, 0.26, xc + dx, COVER_TOP + 0.025, z + dz); box(g, 'cover_twistlock_socket', M.black, 0.12, 0.052, 0.06, xc + dx, COVER_TOP + 0.03, z + dz); }
      for (const s of [1, -1]) box(g, 'cover_lifting_pocket', M.steel, 0.5, 0.3, 0.5, xc + s * (L / 2 - 0.3), COVER_TOP - 0.35, z + pw / 2 - 0.3);
    }
    for (const s of [1, -1]) for (const dx of [-L / 3, 0, L / 3]) box(g, 'hatch_cleat', M.steel, 0.3, 0.3, 0.25, xc + dx, COAM_TOP - 0.1, s * (cw + 0.3));
    mergeGroup(g);
  });

  // deck containers
  const cDet = (g, len, h, x, yc, z) => {
    for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) box(g, 'container_corner_castings', M.steel, 0.178, 0.118, 0.162, x + sx * (len / 2 - 0.089), yc + sy * (h / 2 - 0.059), z + sz * (1.219 - 0.081));
    const xd = x + len / 2 + 0.015;
    for (const dz of [-0.85, -0.3, 0.3, 0.85]) { cyl(g, 'container_door_locking_bars', M.galv, 0.018, h - 0.25, 'y', xd, yc, z + dz, 5); box(g, 'container_door_locking_bars', M.galv, 0.03, 0.2, 0.06, xd + 0.02, yc - 0.3, z + dz + 0.05); }
    box(g, 'container_door_seam', M.black, 0.02, h - 0.2, 0.02, xd, yc, z);
    for (const sy of [1, -1]) box(g, 'container_door_seam', M.steel, 0.03, 0.14, 2.3, xd - 0.01, yc + sy * (h / 2 - 0.07), z);
  };
  const deckCargo = G('deck_cargo');
  BAYS.forEach(([x0, x1], i) => {
    const g = G(`deck_bay_${String(i + 1).padStart(2, '0')}`, deckCargo), hbm = hbDeckMin(x0, x1);
    const nR = Math.min(14, Math.floor((2 * hbm - 0.9) / 2.47)), xc = (x0 + x1) / 2, cw = coamHW(i);
    for (let r = 0; r < nR; r++) {
      const z = (r - (nR - 1) / 2) * 2.47;
      if (rnd() < 0.06) continue;
      let maxY = visTop(x1);
      for (const c of CRANES) if (Math.abs(z - c.z) < 2.4 && x1 > c.hx && x0 < c.tx) maxY = Math.min(maxY, c.hy + Math.max(0, x0 - c.hx) * c.tan - 1.3);
      const tiers = 2 + Math.floor(rnd() * 6);
      const twenty = rnd() < 0.15;
      let y = STACK0;
      for (let t = 0; t < tiers; t++) {
        const h = rnd() < 0.6 ? 2.896 : 2.591;
        if (y + h > maxY) break;
        if (twenty) for (const dx of [-3.07, 3.07]) { box(g, 'container_20ft', pickCont(), 6.058, h, 2.438, xc + dx, y + h / 2, z); cDet(g, 6.058, h, xc + dx, y + h / 2, z); }
        else { box(g, 'container_40ft', pickCont(), 12.192, h, 2.438, xc, y + h / 2, z); cDet(g, 12.192, h, xc, y + h / 2, z); }
        y += h + 0.03;
      }
      if (Math.abs(z) + 1.22 > cw + 0.35) for (const dx of [-6.0, 6.0]) boxYpost(g, xc + dx, z);
    }
    mergeGroup(g);
  });
  function boxYpost(g, x, z) { const zz = Math.sign(z) * Math.min(Math.abs(z), hb(x, D) - 0.35); box(g, 'container_stool', M.hatch, 0.4, STACK0 - D, 0.4, x, (STACK0 + D) / 2, zz); }

  // cargo holds (seen in x-ray): tank top, bulkheads, cell guides, stowed containers
  const holds = G('cargo_holds_internal');
  mesh(holds, 'inner_bottom_tank_top', planGeo(planShape(1.8, ER_FWD, COLL, 90, 0.3), 1.8), M.struct);
  for (const x of [ER_AFT, ER_FWD, ...LASH_X.slice(1), ...CRANE_X, COLL]) mesh(holds, 'transverse_watertight_bulkhead', sectionGeo(x, 0.02, D - 0.02, 0.05), M.struct);
  BAYS.forEach(([x0, x1], i) => {
    if (i === 0) return;
    const g = G(`hold_bay_${String(i + 1).padStart(2, '0')}`, holds), cw = coamHW(i), nTop = Math.floor((2 * cw - 0.4) / 2.54), xc = (x0 + x1) / 2;
    const rowsAt = y => Math.min(nTop, Math.floor(2 * (Math.min(hb(x0, y), hb(x1, y), hb(x0, y + 2.6), hb(x1, y + 2.6)) - 1.4) / 2.54));
    const tierRows = []; for (let t = 0; t < 6; t++) tierRows.push(Math.max(0, rowsAt(1.85 + t * 2.62)));
    if (i === 1) { tierRows[0] = 0; tierRows[1] = 0; }
    tierRows.forEach((n, t) => { for (let r = 0; r < n; r++) { if (rnd() < 0.15) continue; box(g, 'hold_container_40ft', pickCont(), 12.192, 2.591, 2.438, xc, 1.85 + t * 2.62 + 1.3, (r - (n - 1) / 2) * 2.54); } });
    for (let k = 0; k <= nTop; k++) {
      const z = (k - nTop / 2) * 2.54; let t0 = tierRows.findIndex(n => n * 2.54 / 2 >= Math.abs(z) - 0.01); if (t0 < 0) continue;
      const yb = 1.85 + t0 * 2.62, yt = COAM_TOP - 0.2;
      for (const x of [x0 - 0.08, x1 + 0.08]) box(g, 'cell_guide', M.galv, 0.14, yt - yb, 0.14, x, (yb + yt) / 2, z);
    }
    mergeGroup(g);
  });

  // lashing bridges
  const lash = G('lashing_bridges');
  LASH_X.forEach((xg, n) => {
    const g = G(`lashing_bridge_${n + 1}`, lash), cw = Math.min(coamHW(0), 15.4), yT1 = COVER_TOP, yT2 = COVER_TOP + 2.8;
    const posts = [-cw + 0.2, -cw / 3, cw / 3, cw - 0.2];
    for (const z of posts) for (const dx of [-0.45, 0.45]) iBeam(g, 'lashing_bridge_post', M.galv, xg + dx, D, yT2 + 1.1, z, 0.22, 0.2, PI / 2);
    for (let i = 0; i < posts.length - 1; i++) for (const dx of [-0.45, 0.45]) { const z0 = posts[i], z1 = posts[i + 1]; tube(g, 'lashing_bridge_bracing', M.galv, [xg + dx, D + 0.3, z0], [xg + dx, yT1 - 0.2, z1], 0.05, 6); tube(g, 'lashing_bridge_bracing', M.galv, [xg + dx, D + 0.3, z1], [xg + dx, yT1 - 0.2, z0], 0.05, 6); }
    for (const sd of [1, -1]) vLadder(g, 'lashing_bridge_ladder', xg, yT1, yT2, sd * (cw - 3.2), true, M.yellow);
    for (let z = -cw + 1.2; z <= cw - 1.2; z += 2.47) for (const y of [yT1, yT2]) { box(g, 'reefer_socket_box', M.markW, 0.25, 0.35, 0.18, xg + 0.52, y + 0.55, z); box(g, 'reefer_socket_box', M.black, 0.04, 0.1, 0.1, xg + 0.66, y + 0.55, z); }
    for (const y of [yT1, yT2]) {
      box(g, 'lashing_bridge_platform', M.grating, 1.2, 0.04, 2 * cw, xg, y, 0);
      for (const dx of [-0.6, 0.6]) { box(g, 'lashing_bridge_toe_plate', M.yellow, 0.012, 0.12, 2 * cw, xg + dx, y + 0.08, 0); box(g, 'lashing_bridge_edge_channel', M.galv, 0.08, 0.16, 2 * cw, xg + dx * 0.95, y - 0.1, 0); }
      for (let z = -cw; z <= cw; z += 1.2) box(g, 'lashing_bridge_cross_beam', M.galv, 1.2, 0.1, 0.06, xg, y - 0.08, z);
      for (const dx of [-0.6, 0.6]) { box(g, 'lashing_bridge_handrail', M.yellow, 0.05, 0.05, 2 * cw, xg + dx, y + 1.05, 0); box(g, 'lashing_bridge_knee_rail', M.yellow, 0.04, 0.04, 2 * cw, xg + dx, y + 0.55, 0); }
      for (let z = -cw; z <= cw; z += 1.6) for (const dx of [-0.6, 0.6]) tube(g, 'lashing_bridge_stanchion', M.yellow, [xg + dx, y, z], [xg + dx, y + 1.05, z], 0.022, 6);
    }
    vLadder(g, 'lashing_bridge_ladder', xg + 0.45, D, yT2, cw - 1.2, true, M.yellow);
    mergeGroup(g);
  });

  // ---------- deck cranes (3 x 45 t SWL, port side) ----------
  const cranes = G('deck_cranes');
  CRANES.forEach((c, n) => {
    const g = G(`deck_crane_${n + 1}_45t_swl`, cranes), a = c.a;
    g.position.set(c.x, D, c.z);
    cyl(g, 'pedestal_base_flare', M.crane, 2.05, 1.2, 'y', 0, 0.6, 0, 8, 1.72);
    cyl(g, 'pedestal_column_octagonal', M.crane, 1.72, PH - 1.2, 'y', 0, 1.2 + (PH - 1.2) / 2, 0, 8);
    box(g, 'pedestal_access_door', M.steel, 0.9, 2.0, 0.06, 0, 2.2, 1.64);
    box(g, 'pedestal_vent_louvre', M.galv, 0.8, 0.5, 0.06, 0, PH - 3.2, 1.64);
    vLadder(g, 'pedestal_access_ladder', 1.8, 0.2, PH - 1.0, 0, true, M.yellow);
    for (let y = 2.6; y < PH - 1.2; y += 0.9) torus(g, 'pedestal_access_ladder_cage', M.yellow, 0.38, 0.018, 2.05, y, 0, PI / 2, 0, PI).rotation.set(PI / 2, 0, -PI / 2);
    cyl(g, 'pedestal_platform', M.grating, 2.6, 0.1, 'y', 0, PH - 1.0, 0, 24);
    torus(g, 'pedestal_platform_handrail', M.yellow, 2.55, 0.03, 0, PH, 0, PI / 2);
    for (let k = 0; k < 12; k++) tube(g, 'pedestal_platform_stanchion', M.yellow, [2.55 * Math.cos(k * PI / 6), PH - 1.0, 2.55 * Math.sin(k * PI / 6)], [2.55 * Math.cos(k * PI / 6), PH, 2.55 * Math.sin(k * PI / 6)], 0.025, 4);
    cyl(g, 'slewing_bearing', M.steel, 1.78, 0.45, 'y', 0, PH + 0.22, 0, 32);
    const rot = G('slewing_superstructure', g); rot.position.y = PH + 0.45;
    box(rot, 'crane_house', M.crane, 6.2, 4.0, 4.4, -0.7, 2.0, 0);
    box(rot, 'crane_house_roof_edge', M.crane, 6.4, 0.15, 4.6, -0.7, 4.05, 0);
    for (const s of [1, -1]) box(rot, 'machinery_louvre', M.galv, 2.6, 1.2, 0.06, -2.0, 2.2, s * 2.23);
    box(rot, 'operator_cab', M.crane, 2.1, 2.3, 1.7, 2.0, 2.4, 3.05);
    box(rot, 'operator_cab_front_window', M.glass, 0.06, 1.2, 1.5, 3.07, 2.7, 3.05);
    box(rot, 'operator_cab_side_window', M.glass, 1.6, 1.1, 0.06, 2.0, 2.7, 3.92);
    box(rot, 'luffing_tower', M.crane, 1.4, 9.0, 1.9, -1.9, 8.5, 0);
    box(rot, 'luffing_tower_head', M.crane, 1.8, 0.6, 2.2, -1.7, 13.2, 0);
    for (const dz of [-0.5, 0.5]) cyl(rot, 'luffing_tower_sheave', M.steel, 0.45, 0.14, 'z', -1.2, 13.2, dz, 20);
    vLadder(rot, 'luffing_tower_ladder', -2.66, 4.2, 12.9, 0, true, M.yellow);
    box(rot, 'aviation_warning_light', M.lampR, 0.2, 0.2, 0.2, -1.7, 13.6, 0);
    box(rot, 'hoist_winch_housing', M.steel, 1.8, 1.1, 2.4, -3.0, 4.6, 1.0);
    const jib = G('jib', rot); jib.position.set(HEEL[0], HEEL[1], 0); jib.rotation.z = a;
    { const jg = new THREE.CylinderGeometry(0.9 / Math.SQRT2, 2.0 / Math.SQRT2, JL, 4, 1); jg.rotateY(PI / 4); jg.rotateZ(-PI / 2); jg.translate(JL / 2, 0, 0); jg.scale(1, 0.78, 1); mesh(jib, 'jib_box_girder', jg, M.crane); }
    for (const s of [1, -1]) box(jib, 'jib_heel_lug', M.crane, 1.2, 1.2, 0.2, 0.2, 0, s * 0.8);
    for (let x = 2; x < JL - 1; x += 1.4) { const hh = 0.72 - x * 0.013; for (const sd of [1, -1]) box(jib, 'jib_side_weld_seams', M.crane, 0.03, hh * 1.3, 0.02, x, 0, sd * (0.98 - x * 0.017)); }
    for (let x = 1.5; x < JL - 2; x += 3) { const hh = 0.78 - x * 0.013; tube(jib, 'jib_walkway_stanchion', M.yellow, [x, hh, 0.35], [x, hh + 0.9, 0.35], 0.018, 5); }
    tube(jib, 'jib_walkway_handrail', M.yellow, [1.5, 1.68, 0.35], [JL - 3.5, 1.68 - (JL - 5) * 0.013, 0.35], 0.02, 5);
    box(jib, 'jib_walkway', M.grating, JL - 4, 0.03, 0.45, JL / 2 - 0.5, 0.77 - JL / 2 * 0.013, 0.1);
    box(jib, 'jib_floodlight', M.lampW, 0.3, 0.2, 0.2, JL - 0.8, -0.5, 0);
    cyl(jib, 'jib_heel_pin', M.steel, 0.2, 2.2, 'z', 0.2, 0, 0, 12);
    for (let k = 1; k < 6; k++) box(jib, 'jib_stiffener_ring', M.crane, 0.08, 1.45 - k * 0.12, 1.95 - k * 0.19, k * JL / 6, 0, 0);
    for (let k = 0; k < 4; k++) box(jib, 'jib_tip_warning_stripe', k % 2 ? M.black : M.yellow, 0.6, 0.8, 1.04, JL - 0.3 - k * 0.6, 0, 0);
    box(jib, 'jib_head', M.yellow, 1.6, 1.0, 1.1, JL + 0.3, 0.1, 0);
    for (const dz of [-0.3, 0.3]) cyl(jib, 'jib_head_sheave', M.steel, 0.55, 0.14, 'z', JL + 0.9, 0, dz, 20);
    const head = new V3(HEEL[0] + (JL + 0.9) * Math.cos(a), HEEL[1] + (JL + 0.9) * Math.sin(a), 0);
    for (const dz of [-0.25, 0.25]) tube(rot, 'luffing_wire', M.steel, [-1.2, 13.6, dz], [head.x - 0.3, head.y + 0.4, dz], 0.03, 5);
    const hookY = head.y - (n === 2 ? 2.0 : 3.5);
    for (const dz of [-0.2, 0.2]) tube(rot, 'hoist_wire', M.steel, [head.x, head.y - 0.5, dz], [head.x, hookY + 0.6, dz], 0.025, 5);
    box(rot, 'hook_block', M.yellow, 0.9, 1.2, 0.55, head.x, hookY, 0);
    torus(rot, 'cargo_hook', M.steel, 0.3, 0.08, head.x, hookY - 0.95, 0, 0, 0, PI * 1.5);
  });

  // ---------- superstructure (accommodation at stern end) ----------
  const house = G('superstructure');
  const HX0 = -87.5, HX1 = -73.0, LV = 3.1, NAV = D + 7 * LV, FUN_TOP = NAV + 3.3 + 4.2;
  const houseWin = G('house_windows', house), houseRail = G('house_railings', house);
  const levelNames = ['upper_deck', 'a_deck', 'b_deck', 'c_deck', 'd_deck', 'e_deck', 'f_deck', 'g_deck'];
  for (let k = 0; k < 7; k++) {
    const y0 = D + k * LV, hw = k < 2 ? 14.4 : 13.2, L = HX1 - HX0, xc = (HX0 + HX1) / 2, lg = G(`house_${levelNames[k]}`, house);
    box(lg, 'house_block', M.white, L, LV, 2 * hw, xc, y0 + LV / 2, 0);
    box(lg, 'deck_edge_plate', M.white, L + 0.25, 0.18, 2 * hw + 0.25, xc, y0 + LV - 0.09, 0);
    const wy = y0 + 1.75;
    if (k > 0) {
      for (let z = -hw + 1.4; z <= hw - 1.3; z += 2.35) if (k !== 6 || z < -8.8 || z > 2.8) box(houseWin, 'window', M.glass, 0.06, 1.05, 1.15, HX1 + 0.03, wy, z);
      for (let x = HX0 + 1.3; x <= HX1 - 1.2; x += 2.4) for (const s of [1, -1]) box(houseWin, 'window', M.glass, 1.15, 1.05, 0.06, x, wy, s * (hw + 0.03));
      for (let z = -hw + 2.5; z <= hw - 2.5; z += 4.7) box(houseWin, 'window', M.glass, 0.06, 1.05, 1.15, HX0 - 0.03, wy, z);
    } else {
      for (const s of [1, -1]) { box(houseWin, 'weathertight_door', M.steel, 0.95, 2.0, 0.06, HX1 - 2.0, y0 + 1.0, s * (hw + 0.03)); box(houseWin, 'weathertight_door', M.steel, 0.06, 2.0, 0.95, HX1 + 0.03, y0 + 1.0, s * (hw - 2.0)); }
    }
    if (k === 1) { // walkway rail on the step at B-deck level (house narrows from 14.4 to 13.2)
      for (const s of [1, -1]) { box(houseRail, 'house_handrail', M.white, L, 0.05, 0.05, xc, y0 + LV + 1.0, s * (hw - 0.05)); box(houseRail, 'house_knee_rail', M.white, L, 0.04, 0.04, xc, y0 + LV + 0.5, s * (hw - 0.05)); for (let x = HX0; x <= HX1; x += 1.5) box(houseRail, 'house_stanchion', M.white, 0.04, 1.0, 0.04, x, y0 + LV + 0.5, s * (hw - 0.05)); }
    }
    for (const sd of [1, -1]) {
      const z = sd * (hw + 0.6), xa = HX0 + (k % 2 ? 4.3 : 1.1), xb = HX0 + (k % 2 ? 1.1 : 4.3);
      stairFlight(lg, 'external_stair', [xa, y0 + 0.02, z], [xb, y0 + LV, z], 0.8);
      if (k > 0 && hw < 14) walkway(lg, 'external_stair_landing', HX0 + 0.1, HX0 + 5.3, y0, sd * hw, sd * (hw + 1.1));
      if (k < 6) walkway(lg, 'external_stair_landing', HX0 + 0.1, HX0 + 5.3, y0 + LV, sd * hw, sd * (hw + 1.1));
    }
  }
  { const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 128; const cx = cv.getContext('2d');
    cx.fillStyle = '#1b1d20'; cx.font = 'bold 100px Arial, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('SAFETY FIRST', 512, 68);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshStandardMaterial({ name: 'paint_lettering_black', map: tex, transparent: true, alphaTest: 0.4, roughness: 0.6 });
    const o = mesh(house, 'house_front_lettering_safety_first', new THREE.PlaneGeometry(9.6, 1.2), m); o.position.set(HX1 + 0.05, D + 6 * LV + 1.7, -3.0); o.rotation.y = PI / 2; }
  // wheelhouse / navigation bridge
  const bridge = G('navigation_bridge', house);
  const WX0 = -81.2, WX1 = -73.2, WH = 3.3, WHW = 13.0;
  box(bridge, 'wheelhouse', M.white, WX1 - WX0, WH, 2 * WHW, (WX0 + WX1) / 2, NAV + WH / 2, 0);
  { const gw = box(bridge, 'bridge_front_windows_inclined', M.glass, 0.08, 1.9, 2 * WHW - 0.4, WX1 + 0.12, NAV + 2.05, 0); gw.rotation.z = -0.2; }
  for (const s of [1, -1]) box(bridge, 'bridge_side_windows', M.glass, WX1 - WX0 - 1.2, 1.5, 0.06, (WX0 + WX1) / 2 + 0.3, NAV + 2.0, s * (WHW + 0.03));
  box(bridge, 'bridge_aft_windows', M.glass, 0.06, 1.3, 8.0, WX0 - 0.03, NAV + 2.0, 0);
  box(bridge, 'compass_deck_roof', M.white, WX1 - WX0 + 0.5, 0.25, 2 * WHW + 0.5, (WX0 + WX1) / 2, NAV + WH + 0.12, 0);
  box(bridge, 'bridge_front_sun_visor', M.white, 0.6, 0.12, 2 * WHW + 0.5, WX1 + 0.45, NAV + WH, 0);
  for (const s of [1, -1]) {
    const wg = G(s > 0 ? 'bridge_wing_starboard' : 'bridge_wing_port', bridge), zi = WHW, zo = 17.6, wx0 = -77.8, wx1 = WX1;
    box(wg, 'wing_deck', M.white, wx1 - wx0, 0.3, zo - zi, (wx0 + wx1) / 2, NAV - 0.15, s * (zi + zo) / 2);
    box(wg, 'wing_bulwark_outer', M.white, wx1 - wx0, 1.15, 0.08, (wx0 + wx1) / 2, NAV + 0.57, s * zo);
    box(wg, 'wing_bulwark_front', M.white, 0.08, 1.15, zo - zi, wx1, NAV + 0.57, s * (zi + zo) / 2);
    box(wg, 'wing_bulwark_aft', M.white, 0.08, 1.15, zo - zi, wx0, NAV + 0.57, s * (zi + zo) / 2);
    box(wg, 'wing_console', M.steel, 0.9, 1.1, 0.6, wx1 - 0.7, NAV + 0.55, s * (zo - 0.7));
    box(wg, 'wing_console_display', M.glass, 0.03, 0.4, 0.45, wx1 - 0.24, NAV + 1.0, s * (zo - 0.7));
    tube(wg, 'wing_support_bracket', M.white, [wx1 - 0.3, NAV - 3.2, s * 13.25], [wx1 - 0.3, NAV - 0.3, s * (zo - 0.5)], 0.18, 6);
    tube(wg, 'wing_support_bracket', M.white, [wx0 + 0.3, NAV - 3.2, s * 13.25], [wx0 + 0.3, NAV - 0.3, s * (zo - 0.5)], 0.18, 6);
    box(wg, s > 0 ? 'sidelight_starboard_green' : 'sidelight_port_red', s > 0 ? M.lampG : M.lampR, 0.3, 0.3, 0.15, wx1 - 0.2, NAV + 1.4, s * (zo - 0.15));
    box(wg, 'sidelight_screen', M.black, 0.9, 0.5, 0.04, wx1 - 0.55, NAV + 1.4, s * (zo - 0.35));
  }
  // compass deck: roof railing, mast, radars, antennas
  { const y = NAV + WH + 0.25, x0 = WX0 - 0.2, x1 = WX1 + 0.2;
    for (const s of [1, -1]) { box(houseRail, 'roof_handrail', M.white, x1 - x0, 0.05, 0.05, (x0 + x1) / 2, y + 1.0, s * (WHW + 0.2)); for (let x = x0; x <= x1; x += 1.6) box(houseRail, 'roof_stanchion', M.white, 0.04, 1.0, 0.04, x, y + 0.5, s * (WHW + 0.2)); }
    box(houseRail, 'roof_handrail_front', M.white, 0.05, 0.05, 2 * WHW + 0.4, x1, y + 1.0, 0);
    const mast = G('radar_mast', bridge), mx = -78.2;
    box(mast, 'mast_column', M.white, 0.8, 7.4, 0.8, mx, y + 3.7, 0);
    box(mast, 'mast_yardarm', M.white, 0.35, 0.35, 7.0, mx, y + 6.0, 0);
    box(mast, 'x_band_radar_platform', M.grating, 2.2, 0.12, 2.2, mx + 1.5, y + 4.3, 0);
    box(mast, 'x_band_radar_pedestal', M.markW, 0.55, 0.5, 0.55, mx + 1.5, y + 4.6, 0);
    box(mast, 'x_band_radar_antenna_2_5m', M.markW, 0.3, 0.28, 2.5, mx + 1.5, y + 5.0, 0, 0.5);
    box(mast, 's_band_radar_platform', M.grating, 2.4, 0.12, 2.4, mx, y + 7.45, 0);
    box(mast, 's_band_radar_pedestal', M.markW, 0.6, 0.55, 0.6, mx, y + 7.8, 0);
    box(mast, 's_band_radar_antenna_3_9m', M.markW, 0.35, 0.3, 3.9, mx, y + 8.25, 0, -0.35);
    cyl(mast, 'masthead_pole', M.white, 0.09, 3.2, 'y', mx - 0.9, y + 9.0, 0, 10);
    box(mast, 'masthead_light_aft', M.lampW, 0.25, 0.3, 0.25, mx - 0.9, y + 10.1, 0);
    box(mast, 'all_round_light', M.lampW, 0.2, 0.25, 0.2, mx - 0.9, y + 10.7, 0);
    for (const s of [1, -1]) { cyl(mast, 'gnss_antenna', M.markW, 0.12, 0.25, 'y', mx, y + 6.3, s * 3.2, 12); cyl(mast, 'whip_antenna', M.markW, 0.03, 4.0, 'y', mx - 0.3, y + 8.0, s * 3.4, 6); }
    box(mast, 'ship_whistle', M.steel, 0.9, 0.35, 0.35, mx + 0.6, y + 6.5, 0.6);
    for (const [dx, dz] of [[-2.2, 9], [-2.2, -9]]) { cyl(mast, 'satcom_dome_post', M.white, 0.12, 1.6, 'y', mx + dx, y + 0.8, dz, 10); sphere(mast, 'satcom_radome', M.markW, 0.75, mx + dx, y + 2.1, dz); }
    cyl(mast, 'magnetic_compass_binnacle', M.white, 0.3, 1.2, 'y', -74.6, y + 0.6, 0, 16);
  }
  // funnel (integrated at the aft end of the house)
  { const fg = G('funnel', house), fx0 = -88.4, fx1 = -82.6, fw = 3.8, y0 = NAV - LV, y1 = FUN_TOP;
    const sh = new THREE.Shape(); const rr = 1.2, w = fx1 - fx0, h = 2 * fw;
    sh.moveTo(rr, 0); sh.lineTo(w - rr, 0); sh.quadraticCurveTo(w, 0, w, rr); sh.lineTo(w, h - rr); sh.quadraticCurveTo(w, h, w - rr, h); sh.lineTo(rr, h); sh.quadraticCurveTo(0, h, 0, h - rr); sh.lineTo(0, rr); sh.quadraticCurveTo(0, 0, rr, 0);
    const mk = (ya, yb, m, name) => { const g = new THREE.ExtrudeGeometry(sh, { depth: yb - ya, bevelEnabled: false, curveSegments: 6 }); g.rotateX(-PI / 2); g.translate(fx0, ya, fw); return mesh(fg, name, g, m); };
    mk(y0, y1 - 1.6, M.funnel, 'funnel_casing');
    mk(y1 - 1.6, y1, M.black, 'funnel_top_band');
    box(fg, 'funnel_top_grating', M.grating, w - 0.3, 0.05, h - 0.3, (fx0 + fx1) / 2, y1 - 0.2, 0);
    const pipes = [['main_engine_exhaust_pipe', -85.8, 0.9, 0.62, 2.0], ['aux_engine_exhaust_pipe_1', -84.0, -1.9, 0.24, 1.4], ['aux_engine_exhaust_pipe_2', -84.0, -1.2, 0.24, 1.4], ['aux_engine_exhaust_pipe_3', -84.0, -0.5, 0.24, 1.4], ['aux_boiler_exhaust_pipe', -87.3, -1.8, 0.3, 1.6], ['incinerator_exhaust_pipe', -87.3, 2.3, 0.18, 1.2]];
    for (const [n, x, z, r, hh] of pipes) cyl(fg, n, M.black, r, hh, 'y', x, y1 + hh / 2 - 0.2, z, 20);
    for (const s of [1, -1]) box(fg, 'funnel_vent_louvre', M.galv, 2.4, 1.2, 0.05, (fx0 + fx1) / 2, y1 - 4, s * (fw + 0.02));
    vLadder(fg, 'funnel_ladder', fx0 - 0.12, y0 + 0.3, y1 - 0.4, 2.4, true, M.white);
  }
  // life-saving appliances
  { const lsa = G('life_saving_appliances', house);
    const fr = G('free_fall_lifeboat', lsa); fr.position.set(-90.0, D + 2 * LV - 0.2, 6.5); fr.rotation.z = 0.61;
    const hullB = mesh(fr, 'lifeboat_hull', new THREE.CapsuleGeometry(1.45, 5.5, 8, 20), M.orange); hullB.rotation.z = PI / 2; hullB.scale.set(1, 1, 1);
    box(fr, 'lifeboat_canopy_hatch', M.orange, 1.6, 0.5, 1.2, 1.2, 1.4, 0);
    for (const s of [1, -1]) box(fr, 'lifeboat_windows', M.glass, 2.2, 0.3, 0.04, 1.8, 0.7, s * 1.44);
    for (const s of [1, -1]) box(lsa, 'free_fall_launch_ramp_rail', M.white, 8.2, 0.35, 0.3, -90.1, D + 2 * LV - 2.0, 6.5 + s * 1.1, 0, 0, 0.61);
    for (const s of [1, -1]) tube(lsa, 'recovery_a_frame_leg', M.white, [-87.5, D + 2 * LV, 6.5 + s * 2.2], [-91.5, D + 2 * LV + 5.0, 6.5 + s * 1.0], 0.14, 8);
    box(lsa, 'recovery_a_frame_beam', M.white, 0.3, 0.3, 2.4, -91.5, D + 2 * LV + 5.0, 6.5);
    const rb = G('rescue_boat', lsa); rb.position.set(-80, D + 2 * LV + 0.9, -14.2);
    const rbh = mesh(rb, 'rescue_boat_tube', new THREE.CapsuleGeometry(0.45, 4.0, 6, 14), M.orange); rbh.rotation.z = PI / 2;
    box(rb, 'rescue_boat_console', M.markW, 0.8, 0.6, 0.6, 0.3, 0.3, 0);
    tube(lsa, 'rescue_boat_davit_post', M.white, [-77.6, D + 2 * LV, -13.4], [-77.6, D + 2 * LV + 3.6, -13.4], 0.2, 12);
    tube(lsa, 'rescue_boat_davit_arm', M.white, [-77.6, D + 2 * LV + 3.6, -13.4], [-80, D + 2 * LV + 3.2, -15.2], 0.14, 10);
    for (const s of [1, -1]) for (let k = 0; k < 3; k++) { cyl(lsa, 'liferaft_canister', M.markW, 0.35, 1.3, 'x', -84 + k * 1.6, D + LV + 0.45, s * 14.0, 16); box(lsa, 'liferaft_cradle', M.galv, 1.4, 0.15, 0.7, -84 + k * 1.6, D + LV + 0.07, s * 14.0); }
  }
  box(house, 'stern_light', M.lampW, 0.25, 0.3, 0.25, -93.1, D + 1.7, 0);
  box(house, 'aft_anchor_light', M.lampW, 0.2, 0.25, 0.2, -88.0, FUN_TOP + 0.5, 3.0);

  // ---------- deck fittings: railings, fire main, air pipes, gangways ----------
  const deckFit = G('deck_fittings');
  const rail = G('main_deck_railings', deckFit);
  for (const s of [1, -1]) {
    const pts = []; for (let x = -85.5; x <= 61.5; x += 2.5) pts.push([x, D, s * (hb(x, D) - 0.12)]);
    for (let i = 0; i < pts.length - 1; i++) for (const h of [1.0, 0.55]) tube(rail, 'handrail', M.galv, [pts[i][0], D + h, pts[i][2]], [pts[i + 1][0], D + h, pts[i + 1][2]], 0.024, 5);
    for (let x = -85.5; x <= 61.5; x += 1.5) { const z = s * (hb(x, D) - 0.12); tube(rail, 'rail_stanchion', M.galv, [x, D, z], [x, D + 1.02, z], 0.03, 6); box(rail, 'rail_stanchion', M.galv, 0.14, 0.02, 0.14, x, D + 0.01, z); if (Math.round(x / 1.5) % 4 === 0) tube(rail, 'rail_stay', M.galv, [x, D + 0.9, z], [x, D, z - s * 0.5], 0.02, 5); }
    for (let i = 0; i < pts.length - 1; i++) tube(rail, 'fire_main', M.red, [pts[i][0], D + 0.3, pts[i][2] - s * 0.8], [pts[i + 1][0], D + 0.3, pts[i + 1][2] - s * 0.8], 0.11, 8);
    for (const [x0, x1] of BAYS) { const x = (x0 + x1) / 2, z = s * (hb(x, D) - 1.4); cyl(rail, 'ballast_tank_air_pipe', M.deck, 0.12, 0.9, 'y', x, D + 0.45, z, 10); cyl(rail, 'air_pipe_head', M.deck, 0.26, 0.35, 'y', x, D + 1.05, z, 14); }
    for (const xl of [-64, 9]) { const z = s * (hb(xl, D) - 0.4); for (const yy of [D + 0.35, D + 1.25]) box(rail, 'accommodation_ladder_stowed', M.galv, 12.5, 0.22, 0.05, xl, yy, z); for (let x = xl - 6; x <= xl + 6; x += 0.32) box(rail, 'accommodation_ladder_stowed', M.galv, 0.24, 0.9, 0.035, x, D + 0.8, z); for (const dx of [-6.3, 6.3]) box(rail, 'accommodation_ladder_stowed', M.galv, 0.6, 1.2, 0.08, xl + dx, D + 0.8, z); for (const dx of [-4, 0, 4]) box(rail, 'accommodation_ladder_stowed', M.steel, 0.1, 1.5, 0.25, xl + dx, D + 0.75, z + Math.sign(z) * 0.12); }
    for (let k = 0; k < 5; k++) box(rail, 'fire_hydrant', M.red, 0.25, 0.7, 0.25, -60 + k * 30, D + 0.35, s * (hb(-60 + k * 30, D) - 1.1));
  }
  for (const sd of [1, -1]) stairFlight(rail, 'forecastle_access_ladder', [FX - 2.7, D, sd * 9.6], [FX - 0.05, DF, sd * 9.6], 0.75, M.galv);
  mergeGroup(rail);

  // ---------- mooring & anchoring ----------
  const moor = G('mooring_and_anchoring');
  const bitts = (p, x, y, z, ry = 0) => { const g = G('double_bitt_bollard', p); g.position.set(x, y, z); g.rotation.y = ry; box(g, 'bitt_base_plate', M.steel, 2.0, 0.08, 0.8, 0, 0.04, 0); for (const dx of [-0.6, 0.6]) { cyl(g, 'bitt_post', M.black, 0.28, 0.85, 'y', dx, 0.46, 0, 16); cyl(g, 'bitt_cap', M.black, 0.36, 0.07, 'y', dx, 0.92, 0, 16); } return g; };
  const fairlead = (p, x, y, z, ry = 0) => { const g = G('roller_fairlead', p); g.position.set(x, y, z); g.rotation.y = ry; box(g, 'fairlead_base', M.steel, 1.2, 0.12, 0.7, 0, 0.06, 0); for (const dx of [-0.35, 0.35]) cyl(g, 'fairlead_roller', M.yellow, 0.2, 0.6, 'y', dx, 0.42, 0, 14); box(g, 'fairlead_frame_top', M.steel, 1.2, 0.08, 0.5, 0, 0.75, 0); return g; };
  const winch = (p, name, x, y, z, mirror) => { const g = G(name, p); g.position.set(x, y, z); box(g, 'winch_bedplate', M.steel, 2.4, 0.3, 3.4, 0, 0.15, 0); cyl(g, 'tension_drum', M.mach, 0.55, 1.5, 'z', 0, 1.0, -0.6 * mirror, 24); for (const dz of [-1.4, 0.15]) cyl(g, 'drum_flange', M.mach, 0.95, 0.08, 'z', 0, 1.0, (dz - 0.0) * mirror, 24); cyl(g, 'band_brake', M.steel, 0.98, 0.18, 'z', 0, 1.0, -1.55 * mirror, 24); box(g, 'reduction_gearbox', M.mach, 1.3, 1.3, 0.9, 0, 0.95, 0.75 * mirror); cyl(g, 'hydraulic_motor', M.mach, 0.35, 0.8, 'z', 0, 1.0, 1.55 * mirror, 16); cyl(g, 'warping_head', M.mach, 0.35, 0.6, 'z', 0, 1.0, 2.0 * mirror, 20, 0.3); torus(g, 'brake_handwheel', M.red, 0.3, 0.03, -0.8, 1.6, -1.5 * mirror, 0, PI / 2); box(g, 'local_control_stand', M.mach, 0.4, 1.1, 0.4, 1.2, 0.85, 1.4 * mirror); return g; };
  // forecastle
  const fwd = G('forecastle_equipment', moor);
  for (const s of [1, -1]) {
    const zc = s * 3.7, wl = G(s > 0 ? 'windlass_starboard' : 'windlass_port', fwd); wl.position.set(82, DF, zc);
    box(wl, 'windlass_bedplate', M.steel, 2.6, 0.3, 3.6, 0, 0.15, 0);
    cyl(wl, 'cable_lifter', M.steel, 0.78, 0.55, 'z', 0, 1.05, 0, 28);
    for (let k = 0; k < 5; k++) box(wl, 'cable_lifter_whelp', M.steel, 0.2, 0.18, 0.6, 0.72 * Math.cos(k * 2 * PI / 5), 1.05 + 0.72 * Math.sin(k * 2 * PI / 5), 0, 0, 0, k * 2 * PI / 5);
    cyl(wl, 'windlass_brake_drum', M.steel, 0.9, 0.2, 'z', 0, 1.05, s * 0.45, 28);
    box(wl, 'windlass_gearcase', M.mach, 1.4, 1.5, 1.1, 0, 0.95, -s * 0.95);
    cyl(wl, 'mooring_drum', M.mach, 0.5, 1.3, 'z', 0, 1.05, -s * 2.1, 24);
    cyl(wl, 'windlass_hydraulic_motor', M.mach, 0.35, 0.8, 'z', 0, 1.05, s * 1.0, 16);
    torus(wl, 'windlass_brake_handwheel', M.red, 0.3, 0.03, -0.9, 1.75, s * 0.45, 0, PI / 2);
    box(fwd, 'chain_stopper', M.steel, 1.1, 0.5, 0.5, 83.4, DF + 0.25, zc);
    const shellZ = hb(86.2, 17.3), deckP = [84.5, DF, s * 4.0], shellP = [86.2, 17.3, s * (shellZ - 0.1)];
    tube(fwd, 'hawse_pipe', M.steel, deckP, shellP, 0.42, 16);
    torus(fwd, 'hawse_pipe_deck_rim', M.steel, 0.45, 0.07, deckP[0], DF + 0.05, deckP[2], PI / 2);
    tube(fwd, 'chain_pipe_to_locker', M.steel, [81.1, DF + 0.2, zc], [80.6, 12.0, zc * 0.6], 0.3, 12);
    const chainG = G('anchor_chain_on_deck', fwd), path = [[81.3, DF + 1.8, zc], [82.0, DF + 1.85, zc], [84.5, DF + 0.2, s * 4.0]];
    for (let q = 0; q < path.length - 1; q++) { const a = new V3(...path[q]), b = new V3(...path[q + 1]), n = Math.round(a.distanceTo(b) / 0.3); for (let k = 0; k < n; k++) { const p = a.clone().lerp(b, (k + 0.5) / n); const l = torus(chainG, 'chain_link_84mm', M.steel, 0.15, 0.045, p.x, p.y, p.z); l.scale.set(1.35, 1, 1); l.rotation.set(k % 2 ? PI / 2 : 0, 0, Math.atan2(b.y - a.y, b.x - a.x)); } }
    mergeGroup(chainG);
    const an = G(s > 0 ? 'anchor_starboard_stockless' : 'anchor_port_stockless', fwd); an.position.set(86.3, 16.9, s * (shellZ + 0.35)); an.rotation.set(s * 0.32, 0, 0);
    box(an, 'anchor_shank', M.steel, 0.36, 2.6, 0.3, 0, -1.2, 0);
    box(an, 'anchor_shackle', M.steel, 0.12, 0.5, 0.42, 0, 0.25, 0);
    box(an, 'anchor_crown', M.steel, 1.9, 0.5, 0.55, 0, -2.5, 0);
    for (const sx of [1, -1]) box(an, 'anchor_fluke', M.steel, 0.55, 1.5, 0.4, sx * 0.75, -1.9, 0.1, 0, 0, sx * 0.3);
  }
  for (const s of [1, -1]) {
    winch(fwd, s > 0 ? 'fwd_mooring_winch_starboard' : 'fwd_mooring_winch_port', 80.4, DF, s * 6.6, s);
    bitts(fwd, 79.6, DF, s * 10.1, 0.15 * s); bitts(fwd, 88.2, DF, s * 2.3, 0.6 * s);
    const zf = hb(82.4, DF) - 0.5; fairlead(fwd, 82.4, DF, s * zf, 0); const zf2 = hb(86.8, DF) - 0.5; fairlead(fwd, 86.8, DF, s * zf2, 0);
  }
  torus(fwd, 'bow_panama_chock', M.steel, 0.42, 0.12, xStem(DF + 0.6) - 0.35, DF + 0.65, 0, 0, PI / 2).scale.set(1.4, 1, 1);
  { const bw = G('breakwater', fwd), hbw = 5.5, apex = FX + 1.2, xo = FX + 0.1, zo = 9.0;
    for (const s of [1, -1]) {
      const len = Math.hypot(apex - xo, zo), th = Math.atan2(-s * zo, xo - apex);
      box(bw, 'breakwater_plate', M.breakw, len, hbw, 0.14, (apex + xo) / 2, DF + hbw / 2, s * zo / 2, th);
      box(bw, 'breakwater_top_flange', M.breakw, len, 0.08, 0.45, (apex + xo) / 2, DF + hbw, s * zo / 2, th);
      for (const y of [DF + 0.5, DF + 2.4, DF + 4.3]) for (let t = 0.06; t < 0.97; t += 0.1) { const h = cyl(bw, 'breakwater_perforation', M.black, 0.16, 0.18, 'z', apex + (xo - apex) * t, y, s * zo * t, 10); h.rotation.y = th; }
      for (let k = 1; k < 5; k++) { const t = k / 5; box(bw, 'breakwater_stay', M.breakw, 1.6, hbw - 0.3, 0.06, apex + (xo - apex) * t + 0.85, DF + (hbw - 0.3) / 2, s * zo * t); }
    }
    mergeGroup(bw); }
  { const fm = G('foremast', fwd), x = FX + 1.9;
    cyl(fm, 'foremast_tube', M.markW, 0.28, 12.4, 'y', x, DF + 6.2, 0, 16, 0.18);
    box(fm, 'foremast_platform', M.grating, 1.4, 0.08, 1.4, x + 0.3, DF + 8.0, 0);
    torus(fm, 'foremast_platform_rail', M.yellow, 0.75, 0.025, x + 0.3, DF + 9.0, 0, PI / 2);
    box(fm, 'masthead_light_forward', M.lampW, 0.25, 0.3, 0.25, x + 0.5, DF + 8.4, 0);
    box(fm, 'foremast_yardarm', M.markW, 0.2, 0.2, 3.2, x, DF + 10.6, 0);
    for (const s of [1, -1]) box(fm, 'signal_light', M.lampR, 0.18, 0.22, 0.18, x, DF + 10.85, s * 1.4);
    box(fm, 'radar_reflector', M.galv, 0.5, 0.5, 0.5, x, DF + 11.6, 0, PI / 4, PI / 4);
    box(fm, 'masthead_bell_bracket', M.bronze, 0.3, 0.35, 0.3, x - 0.35, DF + 2.2, 0);
    cyl(fwd, 'bow_light_post', M.markW, 0.12, 8.0, 'y', 90.3, DF + 4.0, 0, 10, 0.08);
    box(fwd, 'forward_anchor_light', M.lampW, 0.2, 0.25, 0.2, 90.3, DF + 8.15, 0);
    box(fwd, 'forepeak_store_hatch', M.deck, 1.6, 0.6, 1.6, 85.5, DF + 0.3, 0); }
  // aft mooring deck
  const aft = G('aft_mooring_equipment', moor);
  for (const s of [1, -1]) {
    winch(aft, s > 0 ? 'aft_mooring_winch_starboard' : 'aft_mooring_winch_port', -90.6, D, s * 5.8, s);
    bitts(aft, -91.7, D, s * 10.6, 0.3 * s); bitts(aft, -88.8, D, s * 12.4, 0);
    fairlead(aft, -92.6, D, s * 12.3, PI / 2);
  }
  torus(aft, 'stern_panama_chock', M.steel, 0.42, 0.12, -93.02, D + 0.65, 0, 0, PI / 2).scale.set(1, 1, 1.4);

  // ---------- bow thruster ----------
  { const bt = G('bow_thruster', hull), bx = 80, by = 5.6, bz = hb(bx, by);
    const tg = new THREE.CylinderGeometry(1.0, 1.0, 2 * bz, 32, 1, true); tg.rotateX(PI / 2); mesh(bt, 'bow_thruster_tunnel', tg, M.af).position.set(bx, by, 0);
    for (const s of [1, -1]) { const c = cyl(bt, 'tunnel_opening', M.black, 1.0, 0.02, 'z', bx, by, s * (bz + 0.01), 32); for (let k = -2; k <= 2; k++) box(bt, 'tunnel_grid_bar', M.af, 0.08, 1.9 * Math.sqrt(1 - (k / 2.6) ** 2), 0.08, bx + k * 0.36, by, s * (bz + 0.04)); }
    sphere(bt, 'thruster_gear_pod', M.mach, 0.55, bx, by, 0, 1, 1, 1.4);
    for (let k = 0; k < 4; k++) { const a = k * PI / 2, b = box(bt, 'thruster_cpp_blade', M.bronze, 0.45, 0.8, 0.08, bx + 0.5 * Math.sin(a), by + 0.5 * Math.cos(a), 0.9); b.rotation.z = -a; }
    cyl(bt, 'thruster_drive_shaft', M.steel, 0.15, 4.0, 'y', bx, by + 2.5, 0, 12);
    cyl(bt, 'thruster_electric_motor', M.mach, 0.8, 1.8, 'y', bx, by + 5.4, 0, 24); }

  // ---------- engine room (x-ray) ----------
  const er = G('engine_room');
  mesh(er, 'er_tank_top', planGeo(planShape(2.0, ER_AFT, ER_FWD, 30, 0.1), 2.0), M.struct);
  for (const [y, name] of [[8.2, 'er_second_deck'], [13.0, 'er_third_deck']]) {
    const s = planShape(y, ER_AFT, ER_FWD, 30, 0.15), hole = new THREE.Path();
    hole.moveTo(-74.8, -5.8); hole.lineTo(-61.8, -5.8); hole.lineTo(-61.8, 2.9); hole.lineTo(-74.8, 2.9); hole.lineTo(-74.8, -5.8); s.holes.push(hole);
    mesh(er, name, planGeo(s, y), M.grating);
  }
  mesh(er, 'steering_gear_flat', planGeo(planShape(12.0, -92.6, ER_AFT, 16, 0.15), 12.0), M.grating);
  // main engine: two-stroke, 7 cyl, 600 mm bore / 2,790 mm stroke
  const me = G('main_engine_7G60ME_C', er), CY = SH_Y, NCY = 7, PITCH = 1.08, XE0 = -72.4, XE1 = XE0 + 10.2;
  const xcyl = k => XE0 + 1.8 + k * PITCH;
  box(me, 'bedplate', M.mach, XE1 - XE0, 2.4, 4.3, (XE0 + XE1) / 2, 2.0 + 1.2, 0);
  { const s = new THREE.Shape(); s.moveTo(-2.05, 0); s.lineTo(2.05, 0); s.lineTo(1.7, 3.5); s.lineTo(-1.7, 3.5); s.lineTo(-2.05, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: XE1 - XE0 - 0.6, bevelEnabled: false }); g.rotateY(PI / 2); g.translate(XE0 + 0.3, 4.4, 0); mesh(me, 'frame_box_a_frames', g, M.mach); }
  box(me, 'cylinder_frame', M.mach, NCY * PITCH + 0.4, 2.3, 3.2, xcyl(3), 9.05, 0);
  for (let k = 0; k < NCY; k++) {
    const x = xcyl(k), cg = G(`cylinder_unit_${k + 1}`, me);
    cyl(cg, 'cylinder_cover', M.mach, 0.5, 0.65, 'y', x, 10.5, 0, 24);
    cyl(cg, 'exhaust_valve_housing', M.mach, 0.24, 0.9, 'y', x, 11.25, 0.1, 16);
    cyl(cg, 'exhaust_valve_actuator', M.steel, 0.16, 0.45, 'y', x, 11.9, 0.1, 12);
    tube(cg, 'exhaust_branch_pipe', M.mach, [x, 11.1, 0.35], [x, 11.3, 2.2], 0.22, 12);
    box(cg, 'hydraulic_cylinder_unit', M.steel, 0.55, 0.9, 0.5, x, 9.6, -2.0);
    tube(cg, 'hcu_high_pressure_pipe', M.steel, [x, 10.05, -1.85], [x, 10.6, -0.45], 0.05, 6);
    for (const s of [1, -1]) box(cg, 'crankcase_door', M.steel, 0.6, 0.8, 0.05, x, 5.5, s * 1.98);
    box(cg, 'scavenge_port_cover', M.steel, 0.5, 0.5, 0.05, x, 8.5, -1.63);
  }
  cyl(me, 'exhaust_gas_receiver', M.mach, 0.8, NCY * PITCH + 0.6, 'x', xcyl(3), 11.3, 2.9, 24);
  cyl(me, 'scavenge_air_receiver', M.mach, 0.85, NCY * PITCH + 0.2, 'x', xcyl(3), 8.5, 2.45, 24);
  { const tc = G('turbocharger', me), tx = -73.7, ty = 11.4, tz = 4.4;
    cyl(tc, 'tc_turbine_casing', M.mach, 1.0, 1.4, 'x', tx + 0.3, ty, tz, 24); cyl(tc, 'tc_compressor_volute', M.mach, 1.1, 1.0, 'x', tx - 0.9, ty, tz, 24);
    cyl(tc, 'tc_intake_silencer', M.galv, 1.15, 1.2, 'x', tx - 2.0, ty, tz, 24);
    tube(tc, 'tc_gas_inlet', M.mach, [tx + 0.8, ty, tz], [xcyl(0), 11.3, 2.9], 0.55, 16);
    box(tc, 'scavenge_air_cooler', M.mach, 2.2, 1.9, 1.8, -72.6, 8.6, 4.2);
    box(tc, 'water_mist_catcher', M.mach, 0.8, 1.9, 1.2, -71.5, 8.6, 3.6);
    tube(tc, 'tc_air_outlet_duct', M.mach, [tx - 0.9, ty - 0.9, tz], [-72.6, 9.6, 4.2], 0.45, 12); }
  for (const [y, w] of [[5.6, 2.3], [8.2, 2.1], [10.8, 1.9]]) for (const s of [1, -1]) { if (s > 0 && y > 8) continue; box(me, 'engine_gallery', M.grating, XE1 - XE0, 0.06, 0.9, (XE0 + XE1) / 2, y, s * (w + 0.45)); box(me, 'gallery_handrail', M.galv, XE1 - XE0, 0.05, 0.05, (XE0 + XE1) / 2, y + 1.0, s * (w + 0.9)); }
  cyl(me, 'thrust_bearing_housing', M.mach, 1.1, 0.9, 'x', XE0 - 0.1, CY, 0, 24);
  cyl(me, 'turning_wheel', M.steel, 1.2, 0.3, 'x', XE0 - 0.7, CY, 0, 32);
  box(me, 'turning_gear', M.mach, 0.6, 0.6, 0.6, XE0 - 0.7, CY - 0.4, 1.3);
  box(me, 'hydraulic_power_supply', M.mach, 1.2, 1.6, 1.6, XE1 + 0.3, 6.0, -1.6);
  box(me, 'engine_control_unit_cabinet', M.mach, 0.6, 1.8, 1.2, XE1 + 0.4, 9.2, 1.4);
  // shafting
  const sh = G('shaft_line', er);
  cyl(sh, 'intermediate_shaft', M.steel, 0.28, (XE0 - 0.85) - (-79.6), 'x', ((XE0 - 0.85) + -79.6) / 2, CY, 0, 20);
  for (const x of [-75.5, -78.3]) { box(sh, 'intermediate_shaft_bearing', M.mach, 0.7, 0.9, 1.2, x, CY - 0.2, 0); box(sh, 'bearing_seat', M.struct, 0.9, CY - 0.65 - 2.0, 1.4, x, (CY - 0.65 + 2.0) / 2, 0); }
  cyl(sh, 'shaft_coupling_flange', M.steel, 0.55, 0.2, 'x', -79.6, CY, 0, 24);
  cyl(sh, 'stern_tube_forward_seal', M.mach, 0.6, 0.5, 'x', -80.2, CY, 0, 24);
  cyl(sh, 'propeller_shaft_in_stern_tube', M.steel, 0.3, 3.0, 'x', -81.9, CY, 0, 20);
  // gensets
  for (let k = 0; k < 3; k++) {
    const z = k < 2 ? -6.4 - k * 2.6 : 8.6, gx0 = -68.2, g = G(`diesel_generator_${k + 1}`, er);
    box(g, 'genset_common_bedframe', M.steel, 7.2, 0.35, 1.8, gx0 + 3.6, 8.38, z);
    box(g, 'aux_engine_block', M.mach, 4.2, 1.9, 1.3, gx0 + 2.1, 9.5, z);
    for (let c = 0; c < 6; c++) box(g, 'aux_cylinder_head', M.mach, 0.55, 0.35, 0.8, gx0 + 0.5 + c * 0.63, 10.62, z);
    cyl(g, 'aux_turbocharger', M.mach, 0.4, 0.8, 'x', gx0 - 0.2, 10.8, z, 16);
    cyl(g, 'alternator', M.mach, 0.85, 2.3, 'x', gx0 + 5.7, 9.3, z, 24);
    box(g, 'alternator_terminal_box', M.steel, 0.8, 0.5, 0.5, gx0 + 5.7, 10.3, z);
    tube(g, 'aux_exhaust_pipe', M.galv, [gx0 - 0.2, 11.2, z], [gx0 - 0.2, 16.8, z], 0.2, 10);
    tube(g, 'aux_exhaust_pipe', M.galv, [gx0 - 0.2, 16.8, z], [-84.0, 30, -1.9 + k * 0.7], 0.2, 10);
  }
  { const b = G('auxiliary_boiler', er); cyl(b, 'boiler_shell', M.mach, 1.2, 4.6, 'y', -77.4, 15.3, 8.2, 24); cyl(b, 'boiler_burner', M.steel, 0.4, 1.0, 'x', -76.3, 14.0, 8.2, 16); tube(b, 'boiler_uptake', M.galv, [-77.4, 17.6, 8.2], [-87.3, 36, -1.8], 0.3, 12); tube(b, 'boiler_uptake_vertical', M.galv, [-87.3, 36, -1.8], [-87.3, FUN_TOP - 0.8, -1.8], 0.3, 12); }
  { const u = G('main_engine_uptake', er); tube(u, 'exhaust_uptake_vertical', M.galv, [-73.4, 12.4, 4.4], [-73.4, 16.6, 4.4], 0.6, 20); tube(u, 'exhaust_uptake_inclined', M.galv, [-73.4, 16.6, 4.4], [-85.8, 27.0, 0.9], 0.6, 20); tube(u, 'exhaust_uptake_to_funnel', M.galv, [-85.8, 27.0, 0.9], [-85.8, FUN_TOP - 0.8, 0.9], 0.6, 20); cyl(u, 'exhaust_gas_economiser', M.mach, 1.4, 3.4, 'y', -85.8, 33, 0.9, 24); cyl(u, 'exhaust_silencer', M.mach, 1.0, 2.8, 'y', -85.8, FUN_TOP - 5, 0.9, 24); }
  for (let k = 0; k < 3; k++) { const g = G(`fuel_oil_purifier_${k + 1}`, er); box(g, 'purifier_frame', M.steel, 1.2, 0.3, 1.2, -62.8 + k * 1.5, 8.35, 7.4); cyl(g, 'purifier_bowl_casing', M.mach, 0.45, 1.2, 'y', -62.8 + k * 1.5, 9.1, 7.4, 16); }
  { const g = G('engine_control_room', er); box(g, 'ecr_room', M.white, 6.0, 2.8, 5.0, -63.2, 14.4, -8.8); box(g, 'ecr_window', M.glass, 5.4, 1.1, 0.05, -63.2, 14.8, -6.28); box(g, 'main_switchboard', M.steel, 4.8, 2.1, 0.7, -63.2, 14.05, -11.0); box(g, 'engine_control_console', M.steel, 3.0, 0.9, 0.9, -63.2, 13.45, -7.5); }
  for (const [n, x, z] of [['hfo_settling_tank', -61.8, 8.5], ['hfo_service_tank', -65.4, 8.5], ['mgo_service_tank', -68.6, 9.0]]) box(er, n, M.mach, 3.0, 4.2, 3.4, x, 15.1, z);
  { const c = G('er_overhead_crane', er); for (const s of [1, -1]) box(c, 'crane_rail_girder', M.yellow, XE1 - XE0 + 1, 0.4, 0.3, (XE0 + XE1) / 2, 17.1, s * 2.4); box(c, 'crane_bridge', M.yellow, 0.5, 0.4, 5.2, -68, 17.5, 0); box(c, 'crane_trolley_hoist', M.yellow, 0.9, 0.6, 0.9, -68, 17.0, 0.5); }
  for (let k = 0; k < 2; k++) cyl(er, `starting_air_receiver_${k + 1}`, M.mach, 0.75, 3.4, 'x', -76.5, 9.1, -4.8 - k * 1.8, 20);
  for (let k = 0; k < 2; k++) { const g = G(`sea_water_cooling_pump_${k + 1}`, er); cyl(g, 'pump_casing', M.mach, 0.35, 0.6, 'y', -64 + k * 1.5, 2.6, -4.6, 16); cyl(g, 'pump_motor', M.mach, 0.3, 0.9, 'y', -64 + k * 1.5, 3.4, -4.6, 16); }
  { const g = G('central_cooler_plate_hx', er); box(g, 'cooler_frame', M.mach, 0.5, 2.0, 2.4, -60.5, 3.0, -5.2); box(g, 'cooler_plate_pack', M.galv, 1.2, 1.8, 2.2, -61.3, 3.0, -5.2); }
  { const g = G('steering_gear_rotary_vane', er); cyl(g, 'rotary_vane_actuator', M.mach, 1.0, 1.3, 'y', -88.2, 12.7, 0, 24); for (const s of [1, -1]) box(g, 'steering_hydraulic_power_unit', M.mach, 1.4, 1.3, 1.1, -86.2, 12.65, s * 2.4); }
  box(er, 'er_casing_trunk', M.struct, 8.0, D + 7 * LV - 13.0, 0.05, -80.0, (13 + D + 7 * LV) / 2, 6.0);
  box(er, 'er_casing_trunk', M.struct, 8.0, D + 7 * LV - 13.0, 0.05, -80.0, (13 + D + 7 * LV) / 2, -3.2);

  // ================= study additions: structure, tanks, piping, equipment =================
  const TK = (n, c, o) => new THREE.MeshStandardMaterial({ name: n, color: c, roughness: 0.4, metalness: 0, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide });
  M.tBallast = TK('tank_ballast_water', 0x3a7bd5, 0.32); M.tHFO = TK('tank_heavy_fuel_oil', 0x7a4a1c, 0.45); M.tFW = TK('tank_fresh_water', 0x49b6d6, 0.35);
  M.tLO = TK('tank_lube_oil', 0xd9a520, 0.42); M.tSludge = TK('tank_sludge_bilge', 0x5d5d5d, 0.45);
  mat('pSW', 'pipe_sea_water_green_iso14726', 0x2e8b3e, 0.5, 0.2); mat('pFW', 'pipe_fresh_water_blue_iso14726', 0x2c5fa8, 0.5, 0.2);
  mat('pFO', 'pipe_fuel_oil_brown_iso14726', 0x6b4423, 0.5, 0.2); mat('pLO', 'pipe_lube_oil_yellow_iso14726', 0xd4a017, 0.5, 0.2);
  mat('pAir', 'pipe_compressed_air_lightblue_iso14726', 0x8fb8d8, 0.5, 0.2);
  const HY0 = ER_FWD + 0.3, HY1 = COLL - 0.3, DBH = 1.8, WW = 2.0;
  const route = (p, name, m, pts, rad) => { for (let i = 0; i < pts.length - 1; i++) tube(p, name, m, pts[i], pts[i + 1], rad, 10); };
  const innerZ = (x0, x1) => { let m = 99; for (const y of [2.4, 6, 10, 14, D]) m = Math.min(m, hb(x0, y), hb(x1, y)); return m - WW; };
  const outerZ = (x0, x1, y0, y1 = y0) => { let m = 99; for (let k = 0; k <= 6; k++) { const y = y0 + (y1 - y0) * k / 6; m = Math.min(m, hb(x0, y), hb(x1, y)); } return m - 0.08; };

  // hull structure (x-ray)
  const hs = G('hull_structure', hull);
  const floors = G('double_bottom_floors', hs);
  for (let x = HY0 + 1.6; x < HY1; x += 3.2) mesh(floors, 'double_bottom_floors', sectionGeo(x, 0.03, DBH - 0.03, 0.08), M.struct);
  mergeGroup(floors);
  const duct = G('duct_keel', hs); for (const z of [1.0, -1.0]) box(duct, 'duct_keel', M.struct, HY1 - HY0, DBH - 0.05, 0.03, (HY0 + HY1) / 2, DBH / 2, z); mergeGroup(duct);
  const gird = G('db_side_girders', hs);
  for (const zg of [6, 11]) for (const sg of [1, -1]) { const xs = []; for (let x = HY0; x < HY1; x += 4) if (hb(x, 0.3) > zg + 0.3 && hb(x + 4, 0.3) > zg + 0.3) xs.push(x); if (xs.length) box(gird, 'db_side_girders', M.struct, xs[xs.length - 1] + 4 - xs[0], DBH - 0.05, 0.02, (xs[0] + xs[xs.length - 1] + 4) / 2, DBH / 2, sg * zg); }
  mergeGroup(gird);
  const inner = G('inner_side_longitudinal_bulkhead', hs), strg = G('wing_tank_stringers', hs), webs = G('wing_web_frames', hs), pw = G('passageway_deck', hs);
  BAYS.forEach(([b0, b1], i) => {
    if (i === 0) return;
    const x0 = Math.max(HY0, b0 - 0.9), x1 = Math.min(HY1, b1 + 0.9), zi = innerZ(x0, x1), xc = (x0 + x1) / 2, Lb = x1 - x0;
    for (const sg of [1, -1]) {
      box(inner, 'inner_side_longitudinal_bulkhead', M.struct, Lb, D - DBH, 0.02, xc, (D + DBH) / 2, sg * zi);
      for (const y of [7.0, 12.5]) { const zo = outerZ(x0, x1, y); if (zo > zi + 0.2) box(strg, 'wing_tank_stringers', M.struct, Lb, 0.02, zo - zi, xc, y, sg * (zi + zo) / 2); }
      const zo = outerZ(x0, x1, D - 2.4); if (zo > zi + 0.2) box(pw, 'passageway_deck', M.struct, Lb, 0.02, zo - zi, xc, D - 2.4, sg * (zi + zo) / 2);
      for (let x = x0 + 1.6; x < x1; x += 3.2) { const zw = outerZ(x, x, DBH, D); if (zw > zi + 0.2) box(webs, 'wing_web_frames', M.struct, 0.02, D - DBH - 0.1, zw - zi, x, (D + DBH) / 2, sg * (zi + zw) / 2); }
    }
  });
  [inner, strg, webs, pw].forEach(mergeGroup);

  // tanks
  const tanks = G('tanks'); tanks.visible = false;
  const tbox = (name, m, x0, x1, y0, y1, z0, z1) => { if (z1 - z0 > 0.1 && x1 - x0 > 0.1) box(tanks, name, m, x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); };
  [[1, 2], [3, 4], [5, 6], [7, 8], [9, 9]].forEach(([a, b], n) => {
    const x0 = Math.max(HY0, BAYS[a][0] - 0.9), x1 = Math.min(HY1, BAYS[b][1] + 0.9), zi = innerZ(x0, x1);
    for (const [sg, sd] of [[1, 's'], [-1, 'p']]) {
      const zdb = outerZ(x0, x1, 0.1, DBH) - 0.1;
      if (n === 0) { tbox('hfo_deep_tank_no1_' + sd, M.tHFO, BAYS[1][0] - 0.8, BAYS[1][1] + 0.8, DBH + 0.05, 7.0, sg > 0 ? 0.2 : -zi + 0.1, sg > 0 ? zi - 0.1 : -0.2); }
      tbox(`db_ballast_tank_no${n + 1}_${sd}`, M.tBallast, x0, x1, 0.1, DBH - 0.05, sg > 0 ? 1.05 : -zdb, sg > 0 ? zdb : -1.05);
      const zo = outerZ(x0, x1, DBH, D - 2.45);
      tbox(`wing_ballast_tank_no${n + 1}_${sd}`, M.tBallast, x0, x1, DBH, D - 2.45, sg > 0 ? zi + 0.03 : -zo, sg > 0 ? zo : -zi - 0.03);
    }
  });
  { const g = new THREE.ExtrudeGeometry(planShape(6, COLL + 0.3, xF(6) - 0.6, 24, 0.25), { depth: 11.5, bevelEnabled: false }); g.rotateX(-PI / 2); g.translate(0, 0.4, 0); mesh(tanks, 'fore_peak_ballast_tank', g, M.tBallast); }
  { const g = new THREE.ExtrudeGeometry(planShape(9, -86.2, ER_AFT - 0.2, 10, 0.3), { depth: 8.5, bevelEnabled: false }); g.rotateX(-PI / 2); g.translate(0, 3.4, 0); mesh(tanks, 'aft_peak_tank', g, M.tBallast); }
  for (const [sg, sd] of [[1, 's'], [-1, 'p']]) tbox('fresh_water_tank_' + sd, M.tFW, -86, -82.2, 12.4, 17.6, sg > 0 ? 3.2 : -hb(-86, 12.4) + 0.6, sg > 0 ? hb(-86, 12.4) - 0.6 : -3.2);
  tbox('main_lo_sump_tank', M.tLO, -72.2, -62.6, 0.3, 1.9, -1.9, 1.9);
  tbox('sludge_tank', M.tSludge, -61.5, -58.2, 0.3, 1.9, 2.2, 4.2);
  tbox('bilge_holding_tank', M.tSludge, -61.5, -58.2, 0.3, 1.9, -4.2, -2.2);

  // engine-room auxiliaries (additions)
  const aux = G('engine_room_auxiliaries', er);
  const pump = (name, x, y, z, rad = 0.3) => { const g = G(name, aux); cyl(g, 'pump_casing', M.mach, rad, 0.55, 'y', x, y + 0.28, z, 16); cyl(g, 'pump_motor', M.mach, rad * 0.85, 0.85, 'y', x, y + 0.98, z, 16); box(g, 'pump_baseplate', M.steel, rad * 2.4, 0.08, rad * 2.4, x, y + 0.04, z); return g; };
  const TT = 2.0, SD = 8.2, TD = 13.0;
  pump('main_lo_pump_1', -59.0, TT, 2.4); pump('main_lo_pump_2', -59.0, TT, 3.5);
  pump('jacket_water_pump_1', -59.0, TT, -2.4, 0.25); pump('jacket_water_pump_2', -59.0, TT, -3.4, 0.25);
  pump('lt_fw_pump_1', -58.6, TT, -5.0); pump('lt_fw_pump_2', -58.6, TT, -6.2);
  pump('ballast_pump_1', -60.4, TT, -0.6, 0.35); pump('ballast_pump_2', -60.4, TT, 0.7, 0.35);
  pump('fire_gs_pump', -58.2, TT, -0.6); pump('bilge_pump', -58.2, TT, 0.7, 0.25);
  { const g = G('main_lo_cooler', aux); box(g, 'main_lo_cooler', M.mach, 0.5, 1.8, 1.4, -60.2, TT + 1.0, 5.6); box(g, 'main_lo_cooler', M.galv, 1.0, 1.6, 1.2, -60.9, TT + 1.0, 5.6); }
  cyl(aux, 'lo_auto_backwash_filter', M.mach, 0.35, 1.2, 'y', -61.3, TT + 0.6, 3.1, 16);
  { const g = G('ballast_water_treatment_system', aux); box(g, 'bwts_filter', M.mach, 0.8, 1.8, 0.8, -75.8, SD + 0.9, 4.2); cyl(g, 'bwts_uv_reactor', M.galv, 0.35, 2.0, 'x', -74.2, SD + 0.6, 4.2, 16); box(g, 'bwts_control_panel', M.steel, 0.6, 1.4, 0.3, -73.0, SD + 0.7, 5.0); }
  for (const [i, x] of [[1, -75.0], [2, -73.6]]) { const g = G('main_air_compressor_' + i, aux); box(g, 'compressor_block', M.mach, 1.0, 0.9, 0.8, x, SD + 0.55, -5.2); cyl(g, 'compressor_motor', M.mach, 0.3, 0.8, 'x', x, SD + 0.45, -4.4, 16); }
  { const g = G('fresh_water_generator', aux); cyl(g, 'fwg_shell', M.mach, 0.55, 2.0, 'y', -60.2, SD + 1.0, 4.4, 20); box(g, 'fwg_ejector_pump', M.mach, 0.5, 0.5, 0.5, -59.2, SD + 0.25, 4.4); }
  { const g = G('lo_purifier', aux); box(g, 'purifier_frame', M.steel, 1.2, 0.3, 1.2, -58.3, SD + 0.15, 7.4); cyl(g, 'purifier_bowl_casing', M.lo, 0.45, 1.2, 'y', -58.3, SD + 0.9, 7.4, 16); }
  { const g = G('fo_supply_booster_module', aux); box(g, 'fo_module_frame', M.steel, 3.0, 0.15, 1.6, -66.0, SD + 0.08, 5.0); for (let i = 0; i < 4; i++) cyl(g, 'fo_module_pump', M.mach, 0.18, 0.6, 'y', -67.2 + i * 0.5, SD + 0.45, 4.5, 12); for (let i = 0; i < 2; i++) cyl(g, 'fo_module_heater', M.mach, 0.22, 1.4, 'x', -65.8, SD + 0.9 + i * 0.5, 5.4, 14); cyl(g, 'fo_module_mixing_tank', M.mach, 0.35, 1.3, 'y', -64.8, SD + 0.8, 4.5, 16); cyl(g, 'fo_module_fine_filter', M.mach, 0.18, 0.8, 'y', -64.8, SD + 0.55, 5.4, 12); }
  { const g = G('oily_water_separator', aux); box(g, 'ows_separator', M.mach, 1.4, 1.6, 0.9, -58.8, SD + 0.8, -3.5); box(g, 'ows_15ppm_monitor', M.steel, 0.3, 0.4, 0.15, -58.2, SD + 1.8, -3.0); }
  box(aux, 'sewage_treatment_plant', M.mach, 2.0, 1.8, 1.4, -75.0, TD + 0.9, -5.0);
  cyl(aux, 'incinerator', M.mach, 0.7, 1.9, 'y', -78.8, TD + 0.95, -4.6, 20);
  for (const [n, y, sg] of [['sea_chest_low_port', 1.0, -1], ['sea_chest_high_stbd', 6.0, 1]]) { const z = sg * (hb(-62, y) - 0.25); box(aux, n, M.black, 2.4, 1.2, 0.5, -62, y, z); for (let k = 0; k < 7; k++) box(aux, n, M.galv, 0.05, 1.2, 0.06, -63 + k * 0.33, y, sg * (hb(-62, y) + 0.02)); }
  { const g = G('emergency_fire_pump', aux); cyl(g, 'pump_casing', M.red, 0.25, 0.5, 'y', -90.2, 12.25, 3.4, 14); cyl(g, 'pump_motor', M.red, 0.22, 0.7, 'y', -90.2, 12.85, 3.4, 14); }
  box(aux, 'transformer_440_230', M.steel, 1.4, 1.6, 0.9, -60.0, TD + 0.8, -11.2);

  // engine-room piping (ISO 14726 colours)
  const pipe = G('er_piping', er);
  const zsl = -(hb(-62, 1.0) - 0.8), zsh = hb(-61, 9) - 0.2;
  route(G('sw_cooling_pipe', pipe), 'sw_cooling_pipe', M.pSW, [[-62, 1.2, zsl], [-62, 2.4, -4.6], [-64, 2.4, -4.6]], 0.14);
  route(G('sw_cooling_pipe_2', pipe), 'sw_cooling_pipe', M.pSW, [[-62.5, 3.0, -4.6], [-61.9, 3.0, -4.6], [-61.9, 3.0, -5.2]], 0.14);
  route(G('sw_overboard_pipe', pipe), 'sw_cooling_pipe', M.pSW, [[-61.3, 3.9, -6.2], [-61.3, 9.2, -6.2], [-61.3, 9.2, -(hb(-61.3, 9.2) - 0.1)]], 0.14);
  route(G('lt_fresh_water_pipe', pipe), 'lt_fresh_water_pipe', M.pFW, [[-60.4, 3.9, -4.2], [-58.6, 3.4, -4.6], [-58.6, 7.6, -4.6], [-58.6, 7.6, 4.2], [-71.4, 7.6, 4.2]], 0.11);
  route(G('main_lo_pipe', pipe), 'main_lo_pipe', M.pLO, [[-66, 1.9, 0.9], [-66, 2.5, 3.0], [-59.0, 2.5, 3.0], [-60.2, 2.5, 5.0], [-61.3, 2.6, 3.4], [-62.6, 3.2, 2.2]], 0.1);
  route(G('fuel_oil_supply_pipe', pipe), 'fuel_oil_supply_pipe', M.pFO, [[-65.4, 13.0, 7.0], [-65.4, 10.2, 5.8], [-64.8, 9.4, 4.6], [-64.8, 12.6, 3.8], [-64.8, 12.6, -2.6], [-64.8, 9.9, -2.6]], 0.07);
  route(G('starting_air_pipe', pipe), 'starting_air_pipe', M.pAir, [[-76.5, 9.9, -4.8], [-76.5, 10.4, -3.0], [-70.5, 10.4, -3.0], [-70.5, 9.8, -2.3]], 0.09);

  // bridge equipment
  const be = G('bridge_equipment', bridge), NF = NAV, fx = WX1 - 1.1;
  const console = (name, z, w = 1.5, scr = true) => { const g = G(name, be); box(g, name + '_cabinet', M.steel, 0.85, 1.0, w, fx, NF + 0.5, z); if (scr) { const s = box(g, name + '_screen', M.glass, 0.04, 0.55, w - 0.3, fx + 0.1, NF + 1.25, z); s.rotation.z = 0.35; box(g, name + '_screen', M.steel, 0.5, 0.62, w - 0.2, fx - 0.08, NF + 1.25, z).rotation.z = 0.35; } return g; };
  console('radar_display_s_band', -7.4); console('ecdis_2', -5.2); console('engine_telegraph_panel', -2.9, 1.3, false);
  { const g = G('steering_stand_autopilot', be); box(g, 'steering_stand_autopilot', M.steel, 0.7, 1.15, 0.8, fx - 0.6, NF + 0.58, 0); torus(g, 'helm_wheel', M.black, 0.2, 0.025, fx - 1.0, NF + 1.1, 0, 0, PI / 2); }
  console('conning_display', 2.4, 1.3); console('ecdis_1', 4.6); console('radar_display_x_band', 6.8);
  box(G('engine_telegraph_panel_lever', be), 'engine_telegraph_panel', M.red, 0.1, 0.25, 0.08, fx - 0.2, NF + 1.12, -2.9);
  box(be, 'bnwas_panel', M.steel, 0.1, 0.3, 0.3, fx - 0.2, NF + 1.4, 1.2);
  { const g = G('gmdss_console', be); box(g, 'gmdss_console', M.steel, 1.0, 0.9, 2.0, WX0 + 1.8, NF + 0.45, -9.5); box(g, 'gmdss_console', M.glass, 0.3, 0.3, 1.6, WX0 + 1.6, NF + 1.1, -9.5); }
  box(be, 'chart_table', M.steel, 1.2, 0.95, 1.8, WX0 + 1.8, NF + 0.48, 9.2);
  box(be, 'fire_detection_panel', M.red, 0.1, 0.6, 0.5, WX0 + 0.1, NF + 1.5, 11.5);
  cyl(be, 'gyro_compass', M.steel, 0.3, 0.9, 'y', WX0 + 1.6, NF + 0.45, 3.5, 16);
  { const g = G('vdr_protective_capsule', be); cyl(g, 'vdr_protective_capsule', M.orange, 0.2, 0.45, 'y', -80.2, NF + 3.3 + 0.55, 5.5, 16); box(g, 'vdr_protective_capsule', M.galv, 0.5, 0.3, 0.5, -80.2, NF + 3.3 + 0.3, 5.5); }
  cyl(hull, 'echo_sounder_transducer', M.black, 0.25, 0.06, 'y', 68, 0.0, 1.5, 16);
  cyl(hull, 'speed_log_transducer', M.black, 0.18, 0.06, 'y', 66, 0.0, -1.5, 16);

  // electrical & fire-fighting in the house
  const elec = G('electrical_power', house), ff = G('fire_fighting', house), U0 = D + 0.05, A0 = D + LV + 0.05;
  { const g = G('emergency_generator_set', elec); box(g, 'emergency_generator_set', M.mach, 2.4, 1.4, 1.1, -85.2, A0 + 0.7, 10.0); box(g, 'emergency_generator_set', M.galv, 0.3, 1.2, 1.0, -83.8, A0 + 0.7, 10.0); }
  box(elec, 'emergency_switchboard', M.steel, 1.6, 2.0, 0.6, -85.2, A0 + 1.0, 12.3);
  box(elec, 'shore_power_connection_box', M.steel, 0.8, 1.0, 0.3, -77.0, U0 + 1.2, -(14.4 + 0.15));
  { const g = G('co2_room', ff); const b = G('co2_cylinders', g); for (let i = 0; i < 12; i++) for (let j = 0; j < 3; j++) cyl(b, 'co2_cylinders', M.red, 0.13, 1.6, 'y', -86.4 + i * 0.3, U0 + 0.8, -12.4 + j * 0.32, 10); mergeGroup(b); route(g, 'co2_manifold', M.steel, [[-86.4, U0 + 1.75, -12.1], [-83.1, U0 + 1.75, -12.1], [-83.1, U0 + 2.8, -12.1]], 0.05); }
  box(ff, 'international_shore_connection', M.red, 0.4, 0.4, 0.2, -76.2, U0 + 1.0, 14.4 + 0.12);


  // ================= detail pass 2 =================
  const seams = G('shell_plating_seams', hull);
  for (const y of [2.4, 5.2, 8.2, 13.8, 16.4]) for (const sg of [1, -1]) { let prev = null; for (let x = xA(y) + 1; x < xF(y) - 1; x += 3) { const p = [x, y, sg * (hb(x, y) + 0.012)]; if (prev) tube(seams, 'shell_plating_seams', M.steel, prev, p, 0.012, 3); prev = p; } }
  for (let x = -70; x < 76; x += 12.2) for (const sg of [1, -1]) { let prev = null; for (let y = 0.4; y <= D; y += 1.2) { const p = [x, y, sg * (hb(x, y) + 0.012)]; if (prev) tube(seams, 'shell_plating_seams', M.steel, prev, p, 0.012, 3); prev = p; } }
  mergeGroup(seams);
  const lg = G('lashing_gear', deckCargo);
  LASH_X.forEach(xg => {
    const cw = Math.min(coamHW(0), 15.4);
    for (let z = -cw + 1.2; z <= cw - 1.2; z += 2.47) for (const dx of [-0.6, 0.6]) {
      const xs = xg + dx, xc = xg + dx * 2.6;
      tube(lg, 'lashing_rods', M.galv, [xs, COVER_TOP + 3.0, z - 0.9], [xc, COVER_TOP + 0.35, z + 0.6], 0.02, 4);
      tube(lg, 'lashing_rods', M.galv, [xs, COVER_TOP + 3.0, z + 0.9], [xc, COVER_TOP + 0.35, z - 0.6], 0.02, 4);
      box(lg, 'turnbuckles', M.yellow, 0.06, 0.25, 0.06, xs + dx * 0.4, COVER_TOP + 2.2, z);
    }
  });
  mergeGroup(lg);
  const valves = G('er_valves', er);
  pipe.traverse(o => { if (!o.isMesh || !/pipe/.test(o.name)) return; const p = o.geometry.parameters, dir = new V3(0, 1, 0).applyQuaternion(o.quaternion), c = o.position;
    for (const sd of [-1, 1]) { const q = c.clone().addScaledVector(dir, sd * p.height / 2); const f = mesh(valves, 'pipe_flange', new THREE.CylinderGeometry(p.radiusTop * 1.7, p.radiusTop * 1.7, 0.05, 12), M.steel); f.position.copy(q); f.quaternion.copy(o.quaternion); } });
  const valve = (x, y, z, r) => { const g = G('isolating_valve', valves); sphere(g, 'valve_body', M.steel, r * 1.6, x, y, z); cyl(g, 'valve_spindle', M.steel, r * 0.25, r * 3, 'y', x, y + r * 2, z, 8); torus(g, 'valve_handwheel', M.red, r * 1.6, r * 0.18, x, y + r * 3.5, z, PI / 2); };
  valve(-62, 1.9, -4.6, 0.14); valve(-61.3, 6.5, -6.2, 0.14); valve(-58.6, 5.5, -4.6, 0.11); valve(-59.0, 2.5, 3.0, 0.1); valve(-65.4, 11.5, 6.3, 0.07); valve(-72.5, 10.4, -3.0, 0.09);
  mergeGroup(valves);
  const erLad = (x, y0, y1, z) => { const g = G('er_ladder', er); for (const dz of [-0.25, 0.25]) cyl(g, 'er_ladder', M.yellow, 0.03, y1 - y0, 'y', x, (y0 + y1) / 2, z + dz, 6); for (let y = y0 + 0.3; y < y1; y += 0.3) cyl(g, 'er_ladder', M.yellow, 0.02, 0.5, 'z', x, y, z, 6); mergeGroup(g); };
  erLad(-58.2, TT, SD, 5.5); erLad(-58.2, SD, TD, -6.8); erLad(-78.5, TT + 1.6, SD, -1.8); erLad(-79.5, SD, TD, 5.6);
  for (let k = 1; k <= 3; k++) {
    const g = er.getObjectByName('diesel_generator_' + k); if (!g) continue;
    const z = k < 3 ? -6.4 - (k - 1) * 2.6 : 8.6, gx0 = -68.2;
    for (let c = 0; c < 6; c++) { box(g, 'rocker_cover', M.steel, 0.5, 0.18, 0.55, gx0 + 0.5 + c * 0.63, 10.88, z); box(g, 'fuel_injection_pump', M.steel, 0.18, 0.4, 0.18, gx0 + 0.5 + c * 0.63, 9.9, z - 0.75); }
    cyl(g, 'flywheel_housing', M.mach, 0.75, 0.35, 'x', gx0 + 4.35, 9.3, z, 24);
    box(g, 'charge_air_cooler', M.mach, 0.6, 0.6, 0.6, gx0 + 0.1, 10.1, z + 0.6);
    for (let i = 0; i < 9; i++) cyl(g, 'alternator_cooling_fins', M.mach, 0.9, 0.04, 'x', gx0 + 4.8 + i * 0.22, 9.3, z, 24);
    for (const dx of [0.4, 2.2, 4.0, 6.4]) for (const dz of [-0.75, 0.75]) cyl(g, 'resilient_mounts', M.rubber, 0.12, 0.18, 'y', gx0 + dx, 8.12, z + dz, 10);
    tube(g, 'aux_exhaust_bellows', M.galv, [gx0 - 0.2, 11.0, z], [gx0 - 0.2, 11.4, z], 0.26, 12);
  }
  aux.children.slice().forEach(o => { if (!/_pump_\d$|^bilge_pump$|^fire_gs_pump$/.test(o.name) || !o.children[0]) return; const p = o.children[0].position; box(o, 'pump_coupling_guard', M.yellow, 0.3, 0.2, 0.3, p.x, p.y + 0.4, p.z); for (const d of [1, -1]) cyl(o, 'pump_nozzle_flange', M.steel, 0.12, 0.25, 'x', p.x + d * 0.38, p.y - 0.05, p.z, 12); });
  for (const w of ['fwd_mooring_winch_starboard', 'fwd_mooring_winch_port', 'aft_mooring_winch_starboard', 'aft_mooring_winch_port']) {
    const g = root.getObjectByName(w), drum = g && g.getObjectByName('tension_drum'); if (!drum) continue;
    for (let i = 0; i < 5; i++) torus(g, 'mooring_line_on_drum', M.markW, 0.6, 0.05, drum.position.x, drum.position.y, drum.position.z - 0.5 + i * 0.22, 0, 0);
  }
  const vent = G('er_ventilation', house);
  for (const [x, z] of [[-86.5, 2.8], [-86.5, -2.8], [-84.0, 3.2]]) { cyl(vent, 'er_supply_fan', M.mach, 0.55, 0.9, 'y', x, NAV - LV + 0.6, z, 20); tube(vent, 'er_supply_duct', M.galv, [x, NAV - LV + 0.1, z], [x, 18, z], 0.45, 12); }
  { const fr = root.getObjectByName('free_fall_lifeboat'); if (fr) { box(fr, 'lifeboat_keel', M.orange, 5.5, 0.35, 0.3, 0, -1.5, 0); box(fr, 'lifeboat_helmsman_hatch', M.markW, 0.8, 0.35, 0.8, -1.6, 1.45, 0); cyl(fr, 'lifeboat_exhaust', M.black, 0.06, 0.4, 'y', -2.2, 1.5, 0.4, 8); box(fr, 'lifeboat_release_hook', M.steel, 0.3, 0.4, 0.2, -3.0, 0.6, 0); for (const sd of [1, -1]) box(fr, 'lifeboat_retro_reflective_tape', M.markW, 3.0, 0.08, 0.02, 0.4, 0.2, sd * 1.46); } }


  // ================= realism pass 3 =================
  const buoy = G('lifebuoys', house);
  for (const [x, y, z, ry] of [[HX1 + 0.12, D + LV + 1.4, 10.5, PI / 2], [HX1 + 0.12, D + LV + 1.4, -10.5, PI / 2], [-75.2, NAV + 0.7, 17.66, 0], [-75.2, NAV + 0.7, -17.66, 0], [-93.1, D + 1.0, 6, PI / 2], [-93.1, D + 1.0, -6, PI / 2], [70.2, DF + 1.0, 8, PI / 2], [70.2, DF + 1.0, -8, PI / 2]]) {
    const g = G('lifebuoy', buoy); g.position.set(x, y, z); g.rotation.y = ry;
    mesh(g, 'lifebuoy', new THREE.TorusGeometry(0.36, 0.075, 10, 28), M.orange);
    for (let k = 0; k < 4; k++) { const b = box(g, 'lifebuoy_band', M.markW, 0.1, 0.17, 0.17, 0.36 * Math.cos(k * PI / 2 + PI / 4), 0.36 * Math.sin(k * PI / 2 + PI / 4), 0); b.rotation.z = k * PI / 2 + PI / 4; }
  }
  const vents = G('mushroom_ventilators', hull);
  for (const [x, y, z] of [[86, DF, 6.5], [86, DF, -6.5], [72.5, DF, 3], [-72, D, 12.8], [-72, D, -12.8], [-92, D, 9.5], [-92, D, -9.5]]) { cyl(vents, 'mushroom_ventilator', M.deck, 0.25, 1.1, 'y', x, y + 0.55, z, 16); cyl(vents, 'mushroom_ventilator', M.deck, 0.55, 0.22, 'y', x, y + 1.2, z, 20, 0.2); }
  mergeGroup(vents);
  const iccp = G('iccp_anodes', hull);
  for (const sg of [1, -1]) for (const x of [-60, -52]) sphere(iccp, 'iccp_anode', M.black, 0.6, x, 4.5, sg * (hb(x, 4.5) + 0.01), 1.8, 0.35, 0.06);
  for (const x of [-74.5, -80, -86]) for (const sg of [1, -1]) box(ff, 'fire_hose_box', M.red, 0.6, 0.8, 0.25, x, D + 1.1, sg * (14.4 + 0.13));
  const acu = G('house_ac_units', house);
  for (const z of [-6, -3, 3]) { box(acu, 'ac_condensing_unit', M.markW, 1.4, 1.0, 0.9, -80.6, NAV + 3.3 + 0.75, z); cyl(acu, 'ac_condensing_unit', M.black, 0.35, 0.04, 'y', -80.6, NAV + 3.3 + 1.27, z, 16); }
  mergeGroup(acu);
  const wf = G('window_frames', house);
  for (const w of root.getObjectByName('house_windows').children) { if (w.name !== 'window') continue; const p = w.position, g = w.geometry.parameters, ax = g.width < 0.1 ? 'x' : 'z'; const fr = box(wf, 'window_frame', M.steel, ax === 'x' ? 0.05 : g.width + 0.1, g.height + 0.1, ax === 'z' ? 0.05 : g.depth + 0.1, p.x, p.y, p.z); fr.position[ax] -= Math.sign(p[ax]) * 0.03; }
  mergeGroup(wf);

  return { root, M, xray: [M.hull, M.af, M.deck, M.white, M.hatch], tanks, SPEC: { ...SPEC, D, T, DF, BAYS, CRANE_X, NAV } };
}
