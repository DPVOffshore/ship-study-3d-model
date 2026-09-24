// Detailed study model of a MAN B&W 7G60ME-C9.5 two-stroke crosshead engine.
// Units m. Crankshaft axis = x (fore = +x), crank centre at y = 0, exhaust side = +z, manoeuvring (HCU) side = -z.
// Published: bore 600 mm, stroke 2,790 mm, 7 cyl, L1 2,680 kW/cyl @ 97 r/min, MEP 21 bar.
// Published (CEAS/project guide): cylinder distance A 1,080 mm, bedplate width B1 4,090 / B2 4,220 mm, crank centre to foot flange C 1,500 mm,
// overhaul heights H1 12,175 / H2 11,400 / H3 11,075 mm (taken from the G60ME-C10.5 as proxy). Estimated: con-rod length, internal heights, detailed geometry.
// v2 corrections (MAN G60ME-C9.5 Project Guide, 2018): HPS + step-up gear moved to the aft end (<= 8 cyl, chain drive aft),
// thrust bearing drawn as the 240-degree segment type, TC rotor speed driven by engine load.
export const ENGINE_SPEC = { type: 'MAN B&W 7G60ME-C9.5', cyl: 7, bore: 0.6, stroke: 2.79, A: 1.08, rod: 3.1, rpm: 97, kWcyl: 2680 };
export const FIRING_ORDER = [1, 7, 2, 5, 4, 3, 6];

export function buildEngine(THREE, clipPlane) {
  const PI = Math.PI, V3 = THREE.Vector3;
  const { cyl: N, A, stroke } = ENGINE_SPEC, r = stroke / 2, L = ENGINE_SPEC.rod;
  const M = {};
  const mat = (k, name, color, rough, metal, x = {}) => (M[k] = new THREE.MeshStandardMaterial({ name, color, roughness: rough, metalness: metal, ...x }));
  const CL = { clippingPlanes: [clipPlane], clipShadows: true, side: THREE.DoubleSide };
  mat('casing', 'me_paint_casing_green_grey', 0x8d9b95, 0.55, 0.25, CL);
  mat('forgedC', 'me_forged_steel_sectioned', 0xa3a9ae, 0.32, 0.85, CL);
  mat('crownC', 'me_piston_crown_sectioned', 0x8e7f6c, 0.35, 0.7, CL);
  mat('ringC', 'me_ring_sectioned', 0xdadee1, 0.16, 0.9, CL);
  mat('finsC', 'me_cooler_fins', 0xc2bcae, 0.3, 0.8, CL);
  mat('darkC', 'me_black_sectioned', 0x1c1d1f, 0.6, 0.2, CL);
  mat('liner', 'me_liner_cast_iron', 0x70757a, 0.38, 0.6, CL);
  mat('jacket', 'me_cooling_jacket', 0x6f8a86, 0.55, 0.3, CL);
  mat('cover', 'me_cylinder_cover_forged', 0x8b9196, 0.4, 0.6, CL);
  mat('lagging', 'me_exhaust_lagging', 0xcfcabb, 0.9, 0.0, CL);
  mat('tcCasing', 'me_tc_casing', 0x9aa0a4, 0.45, 0.5, CL);
  mat('coolerCore', 'me_air_cooler_core', 0x4d7fb8, 0.5, 0.4, CL);
  mat('forged', 'me_forged_steel', 0xa3a9ae, 0.32, 0.85);
  mat('crank', 'me_crankshaft_steel', 0xb9bec2, 0.26, 0.9);
  mat('whitemetal', 'me_bearing_white_metal', 0xcdb77a, 0.3, 0.8);
  mat('crown', 'me_piston_crown_heat_tint', 0x8e7f6c, 0.35, 0.7);
  mat('ring', 'me_piston_ring_chrome_ceramic', 0xdadee1, 0.16, 0.9);
  mat('hyd', 'me_hcu_blue', 0x355a93, 0.45, 0.3);
  mat('red', 'me_valve_red', 0xb02a20, 0.5, 0.1);
  mat('redClip', 'me_relief_valve_red', 0xb02a20, 0.5, 0.1, CL);
  mat('fuel', 'me_pipe_fuel_brown', 0x6b4423, 0.5, 0.3);
  mat('lo', 'me_pipe_lube_yellow', 0xd4a017, 0.5, 0.2);
  mat('cw', 'me_pipe_fresh_water_blue', 0x2c5fa8, 0.5, 0.2);
  mat('dark', 'me_black', 0x1c1d1f, 0.6, 0.2);
  mat('grating', 'me_gallery_grating', 0x8f979b, 0.6, 0.3, { side: THREE.DoubleSide });
  mat('yellow', 'me_safety_yellow', 0xd6a21e, 0.5, 0.1);
  mat('air', 'me_pipe_air_lightblue', 0x8fb8d8, 0.5, 0.2);
  mat('blade', 'me_tc_blade_alloy', 0xc2bcae, 0.28, 0.9, { side: THREE.DoubleSide });

  const root = new THREE.Group(); root.name = 'main_engine_7G60ME_C9_5_study';
  const G = (name, p = root) => { const g = new THREE.Group(); g.name = name; p.add(g); return g; };
  const mesh = (p, name, geo, m) => { const o = new THREE.Mesh(geo, m); o.name = name; p.add(o); return o; };
  const box = (p, name, m, sx, sy, sz, x, y, z, ry = 0, rx = 0, rz = 0) => { const o = mesh(p, name, new THREE.BoxGeometry(sx, sy, sz), m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o; };
  const cyl = (p, name, m, rad, h, axis, x, y, z, seg = 28, rTop) => {
    const g = new THREE.CylinderGeometry(rTop ?? rad, rad, h, seg);
    if (axis === 'x') g.rotateZ(-PI / 2); else if (axis === 'z') g.rotateX(PI / 2);
    const o = mesh(p, name, g, m); o.position.set(x, y, z); return o;
  };
  const up = new V3(0, 1, 0);
  const tube = (p, name, m, a, b, rad, seg = 10) => {
    const va = new V3(...a), vb = new V3(...b);
    const o = mesh(p, name, new THREE.CylinderGeometry(rad, rad, va.distanceTo(vb), seg), m);
    o.position.copy(va).add(vb).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(up, vb.clone().sub(va).normalize()); return o;
  };
  const route = (p, name, m, pts, rad) => { for (let i = 0; i < pts.length - 1; i++) tube(p, name, m, pts[i], pts[i + 1], rad, 14); for (let i = 1; i < pts.length - 1; i++) { const s = mesh(p, name, new THREE.SphereGeometry(rad * 1.02, 14, 10), m); s.position.set(...pts[i]); } };
  const rbox = (p, name, m, w, h, d, x, y, z, r = 0.05) => { const s = new THREE.Shape(), W = w / 2 - r, H = h / 2 - r, c = r * 0.6; s.moveTo(-W + c, -H); s.lineTo(W - c, -H); s.quadraticCurveTo(W, -H, W, -H + c); s.lineTo(W, H - c); s.quadraticCurveTo(W, H, W - c, H); s.lineTo(-W + c, H); s.quadraticCurveTo(-W, H, -W, H - c); s.lineTo(-W, -H + c); s.quadraticCurveTo(-W, -H, -W + c, -H);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * r), bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: 3, curveSegments: 4 }); g.translate(0, 0, -(d - 2 * r) / 2); const o = mesh(p, name, g, m); o.position.set(x, y, z); return o; };
  const vessel = (p, name, m, Rr, Lc, x, y, z, head = 0.35) => { const P = []; for (let i = 0; i <= 10; i++) { const a = i / 10 * PI / 2; P.push(new THREE.Vector2(Math.max(0.001, Rr * Math.sin(a)), -Lc / 2 - head * Math.cos(a))); } for (let i = 10; i >= 0; i--) { const a = i / 10 * PI / 2; P.push(new THREE.Vector2(Math.max(0.001, Rr * Math.sin(a)), Lc / 2 + head * Math.cos(a))); }
    const g = new THREE.LatheGeometry(P, 48); g.rotateZ(-PI / 2); const o = mesh(p, name, g, m); o.position.set(x, y, z); return o; };
  const lathe = (p, name, m, pts, x, y, z, seg = 40) => { const o = mesh(p, name, new THREE.LatheGeometry(pts.map(q => new THREE.Vector2(q[0], q[1])), seg), m); o.position.set(x, y, z); return o; };
  const torus = (p, name, m, R, t, x, y, z, rx = PI / 2) => { const o = mesh(p, name, new THREE.TorusGeometry(R, t, 8, 40), m); o.position.set(x, y, z); o.rotation.x = rx; return o; };

  const xk = k => (4 - k) * A;           // cyl 1 at the fore (free) end
  const xb = j => (3.5 - j) * A;         // 8 main bearings
  const LEN = N * A;

  // ---- bedplate & main bearings ----
  const bed = G('bedplate');
  const BL = LEN + 1.3, BX = -0.25;
  for (const s of [1, -1]) {
    box(bed, 'bedplate_longitudinal_girder', M.casing, BL, 1.8, 0.06, BX, -0.6, s * 1.86);
    box(bed, 'bedplate_foot_flange', M.casing, BL, 0.08, 0.34, BX, -1.46, s * 1.875);
    box(bed, 'bedplate_top_flange', M.casing, BL, 0.1, 0.36, BX, 0.3, s * 1.93);
    for (let x = BX - BL / 2 + 0.25; x < BX + BL / 2; x += 0.54) box(bed, 'bedplate_girder_stiffener', M.casing, 0.03, 1.66, 0.2, x, -0.6, s * 1.98);
  }
  box(bed, 'bedplate_oil_pan', M.casing, BL, 0.06, 3.66, BX, -1.42, 0);
  for (let k = 1; k <= N; k++) cyl(bed, 'bedplate_oil_outlet', M.dark, 0.18, 0.12, 'y', xk(k), -1.5, -0.8, 16);
  for (let j = 0; j <= N; j++) {
    box(bed, 'bedplate_main_bearing_girder', M.casing, 0.3, 1.06, 3.6, xb(j), -0.89, 0);
    cyl(bed, 'main_bearing_shell', M.whitemetal, 0.375, 0.3, 'x', xb(j), 0, 0, 32);
    box(bed, 'main_bearing_cap', M.forged, 0.3, 0.34, 1.1, xb(j), 0.53, 0);
    for (const s of [1, -1]) cyl(bed, 'main_bearing_cap', M.forged, 0.05, 0.5, 'y', xb(j), 0.55, s * 0.45, 12);
  }
  const TX = xb(N) - 0.55;
  box(bed, 'thrust_bearing_housing', M.casing, 0.8, 2.3, 3.0, TX, -0.3, 0);
  // B&W-Michell thrust bearing: 240-degree segment arc for engines with <= 8 cylinders (MAN PG 1.06). Segments ahead and astern of the collar.
  for (const sx of [0.2, -0.1]) for (let k = 0; k < 7; k++) { const a = PI - (2 * PI / 3) + k * (4 * PI / 3) / 6; box(bed, 'thrust_pads', M.whitemetal, 0.08, 0.3, 0.3, TX + sx, 0.62 * Math.cos(a), 0.62 * Math.sin(a), 0, a); }

  // ---- crankshaft (rotating) ----
  const crank = G('crankshaft');
  const webGeo = (() => {
    const pts = [];
    for (let i = 0; i < 40; i++) { const a = i * 2 * PI / 40; pts.push([0.58 * Math.cos(a), 0.58 * Math.sin(a) - 0.05], [0.47 * Math.cos(a), r + 0.47 * Math.sin(a)]); }
    pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], hi = [];
    for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    const hull = lo.slice(0, -1).concat(hi.slice(0, -1)), s = new THREE.Shape();
    s.moveTo(hull[0][0], hull[0][1]); hull.slice(1).forEach(p => s.lineTo(p[0], p[1]));
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false }); g.rotateY(PI / 2); g.translate(-0.1, 0, 0); return g;
  })();
  const PHI = {};
  FIRING_ORDER.forEach((c, i) => { PHI[c] = -i * 2 * PI / N; });
  for (let k = 1; k <= N; k++) {
    const t = G(`crank_throw_${k}`, crank); t.position.x = xk(k); t.rotation.x = PHI[k];
    for (const s of [1, -1]) mesh(t, 'crank_web', webGeo, M.crank).position.x = s * 0.27;
    cyl(t, 'crankpin', M.crank, 0.33, 0.34, 'x', 0, r, 0, 32);
  }
  for (let j = 0; j <= N; j++) cyl(crank, 'crank_journal', M.crank, 0.36, 0.3, 'x', xb(j), 0, 0, 32);
  cyl(crank, 'crank_journal', M.crank, 0.36, 1.2, 'x', xb(N) - 0.6, 0, 0, 32);
  cyl(crank, 'thrust_collar', M.crank, 0.78, 0.18, 'x', TX + 0.05, 0, 0, 40);
  const TWX = xb(N) - 1.2;
  cyl(crank, 'turning_wheel', M.forged, 1.15, 0.24, 'x', TWX, 0, 0, 72);
  for (let k = 0; k < 36; k++) { const a = k * PI / 18; box(crank, 'turning_wheel', M.forged, 0.24, 0.1, 0.1, TWX, 1.18 * Math.cos(a), 1.18 * Math.sin(a), 0, a); }
  cyl(crank, 'crank_journal', M.crank, 0.36, 0.55, 'x', xb(0) + 0.35, 0, 0, 32);
  cyl(crank, 'axial_vibration_damper', M.forged, 0.6, 0.3, 'x', xb(0) + 0.52, 0, 0, 40);
  cyl(root, 'axial_vibration_damper_housing', M.casing, 0.68, 0.36, 'x', xb(0) + 0.52, 0, 0, 40).material = M.casing;
  cyl(root, 'angle_encoder', M.dark, 0.14, 0.18, 'x', xb(0) + 0.8, 0, 0, 16);
  cyl(crank, 'hps_drive_gear', M.forged, 0.7, 0.08, 'x', xb(N) - 1.015, 0, 0, 48); // step-up gear wheel on the aft crank flange (MAN PG 1.06)
  cyl(crank, 'thrust_shaft_coupling_flange', M.crank, 0.72, 0.12, 'x', TWX - 0.3, 0, 0, 40);
  for (let i = 0; i < 10; i++) { const a = i * PI / 5; cyl(crank, 'thrust_shaft_coupling_flange', M.forged, 0.04, 0.26, 'x', TWX - 0.3, 0.6 * Math.cos(a), 0.6 * Math.sin(a), 8); }
  const tg = G('turning_gear'); box(tg, 'turning_gear', M.casing, 0.45, 0.5, 0.7, TWX, -1.05, 1.0); cyl(tg, 'turning_gear', M.casing, 0.2, 0.6, 'z', TWX, -1.05, 1.65, 16); cyl(tg, 'turning_gear', M.forged, 0.14, 0.26, 'x', TWX, -1.2, 0.3, 16);

  // ---- frame box, A-frames, crosshead guides ----
  const frame = G('frame_box_a_frames');
  const aGeo = (() => { const s = new THREE.Shape(); s.moveTo(-1.85, 0.35); s.lineTo(1.85, 0.35); s.lineTo(1.72, 3.9); s.quadraticCurveTo(1.6, 4.85, 1.2, 4.85); s.lineTo(-1.2, 4.85); s.quadraticCurveTo(-1.6, 4.85, -1.72, 3.9); s.lineTo(-1.85, 0.35);
    const h = new THREE.Path(); h.moveTo(-1.1, 0.75); h.lineTo(1.1, 0.75); h.lineTo(1.1, 3.1); h.absarc(0, 3.1, 1.1, 0, PI, false); h.lineTo(-1.1, 0.75); s.holes.push(h);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1, curveSegments: 16 }); g.rotateY(PI / 2); g.translate(-0.1, 0, 0); return g; })();
  for (let j = 0; j <= N; j++) { mesh(frame, 'a_frame', aGeo, M.casing).position.x = xb(j); }
  box(frame, 'frame_box_side_plate_exhaust', M.casing, LEN + 0.4, 4.5, 0.05, 0, 2.6, 1.85);
  box(frame, 'frame_box_side_plate_manoeuvring', M.casing, LEN + 0.4, 4.5, 0.05, 0, 2.6, -1.85);
  box(frame, 'diaphragm_plate', M.casing, LEN + 0.4, 0.06, 3.7, 0, 4.85, 0);
  for (let k = 1; k <= N; k++) {
    for (const s of [1, -1]) box(frame, 'crosshead_guide', M.forged, 0.04, 3.4, 0.56, xk(k) + s * 0.4, 3.15, 0);
    rbox(frame, 'crankcase_door', M.casing, 0.74, 1.14, 0.06, xk(k), 2.4, -1.89, 0.03); box(frame, 'crankcase_door', M.dark, 0.78, 1.18, 0.02, xk(k), 2.4, -1.865);
    for (const dy of [0.3, -0.3]) torus(frame, 'crankcase_door', M.forged, 0.07, 0.014, xk(k) + 0.25, 2.4 + dy, -1.95, 0).rotation.set(0, 0, PI / 2);
    cyl(frame, 'crankcase_relief_valve', M.redClip, 0.16, 0.16, 'z', xk(k), 2.9, 1.93, 20);
  }

  // ---- cylinder frame / scavenge box ----
  const cf = G('cylinder_frame');
  { const s = new THREE.Shape(); s.moveTo(-1.6, 4.85); s.lineTo(1.6, 4.85); s.lineTo(1.6, 6.45); s.quadraticCurveTo(1.6, 6.9, 1.15, 6.9); s.lineTo(-1.15, 6.9); s.quadraticCurveTo(-1.6, 6.9, -1.6, 6.45); s.lineTo(-1.6, 4.85);
    const g = new THREE.ExtrudeGeometry(s, { depth: LEN + 0.4, bevelEnabled: false, curveSegments: 10 }); g.rotateY(PI / 2); g.translate(-(LEN + 0.4) / 2, 0, 0); mesh(cf, 'cylinder_frame_scavenge_box', g, M.casing);
    for (let j = 0; j <= N; j++) for (const sd of [1, -1]) box(cf, 'cylinder_frame_rib', M.casing, 0.06, 1.5, 0.08, xb(j), 5.65, sd * 1.63); }
  for (let k = 1; k <= N; k++) box(cf, 'scavenge_box_inspection_cover', M.dark, 0.45, 0.45, 0.04, xk(k), 5.7, -1.62);

  // ---- per-cylinder units ----
  const units = [];
  for (let k = 1; k <= N; k++) {
    const x = xk(k), u = { k, x, phi: PHI[k] };
    // liner + jacket + lubrication
    const la = u.linerAsm = G(`cylinder_liner_assembly_${k}`);
    lathe(la, 'cylinder_liner', M.liner, [[0.3, 5.8], [0.4, 5.8], [0.4, 8.3], [0.47, 8.35], [0.47, 8.75], [0.3, 8.75], [0.3, 5.8]], x, 0, 0);
    lathe(la, 'cylinder_liner_lower', M.liner, [[0.3, 5.0], [0.37, 5.0], [0.37, 5.3], [0.3, 5.3], [0.3, 5.0]], x, 0, 0);
    for (let i = 0; i < 20; i++) { const a = i * 2 * PI / 20, o = box(la, 'scavenge_ports', M.liner, 0.07, 0.5, 0.05, x + 0.335 * Math.cos(a), 5.55, 0.335 * Math.sin(a)); o.rotation.y = -a + 0.35; }
    for (let i = 0; i < 18; i++) { const a = i * 2 * PI / 18; cyl(la, 'liner_cooling_bores', M.darkC, 0.012, 0.36, 'y', x + 0.435 * Math.cos(a), 8.55, 0.435 * Math.sin(a), 5); }
    lathe(la, 'piston_cleaning_ring', M.forgedC, [[0.294, 8.52], [0.3, 8.52], [0.3, 8.66], [0.294, 8.66], [0.294, 8.52]], x, 0, 0, 40);
    lathe(la, 'cooling_jacket', M.jacket, [[0.47, 7.2], [0.56, 7.2], [0.56, 8.3], [0.47, 8.3], [0.47, 7.2]], x, 0, 0);
    for (let i = 0; i < 8; i++) { const a = i * 2 * PI / 8 + PI / 8; const o = cyl(la, 'cylinder_lubrication_quills', M.lo, 0.03, 0.14, 'x', x + 0.46 * Math.cos(a), 7.05, 0.46 * Math.sin(a), 8); o.rotation.y = -a; }
    box(la, 'alpha_cylinder_lubricator', M.lo, 0.3, 0.32, 0.22, x + 0.2, 7.3, -1.2);
    tube(la, 'cylinder_lubrication_quills', M.lo, [x + 0.2, 7.2, -1.1], [x + 0.2, 7.05, -0.5], 0.02, 6);
    tube(la, 'cooling_jacket', M.cw, [x - 0.25, 8.0, 0.52], [x - 0.25, 9.0, 0.5], 0.05, 8);
    lathe(root, 'stuffing_box', M.forgedC, [[0.105, 4.85], [0.24, 4.85], [0.24, 4.88], [0.27, 4.88], [0.27, 5.06], [0.105, 5.06], [0.105, 4.85]], x, 0, 0, 32);
    for (let i = 0; i < 5; i++) torus(root, 'stuffing_box_rings', i < 2 ? M.ringC : M.darkC, 0.112, 0.01, x, 4.9 + i * 0.035, 0);
    tube(root, 'stuffing_box_drain_pipe', M.dark, [x + 0.2, 4.95, -0.2], [x + 0.2, 4.95, -1.0], 0.025, 6);
    // cover assembly
    const ca = u.coverAsm = G(`cylinder_cover_assembly_${k}`);
    lathe(ca, 'cylinder_cover', M.cover, [[0.2, 8.86], [0.33, 8.75], [0.56, 8.75], [0.56, 9.35], [0.2, 9.35], [0.2, 8.86]], x, 0, 0);
    for (let i = 0; i < 8; i++) { const a = i * 2 * PI / 8 + PI / 8; cyl(ca, 'cylinder_cover_studs', M.forged, 0.05, 0.4, 'y', x + 0.49 * Math.cos(a), 9.5, 0.49 * Math.sin(a), 10); cyl(ca, 'cylinder_cover_hydraulic_nuts', M.forged, 0.08, 0.13, 'y', x + 0.49 * Math.cos(a), 9.63, 0.49 * Math.sin(a), 6); }
    for (const s of [1, -1]) { tube(ca, 'fuel_valve', M.forged, [x + s * 0.3, 9.75, -0.26], [x + s * 0.2, 8.85, -0.12], 0.05, 12); cyl(ca, 'fuel_valve', M.forged, 0.08, 0.2, 'y', x + s * 0.3, 9.82, -0.26, 12); box(ca, 'fuel_valve', M.forged, 0.1, 0.1, 0.16, x + s * 0.3, 9.86, -0.38); cyl(ca, 'fuel_valve_nozzle', M.darkC, 0.022, 0.07, 'y', x + s * 0.2, 8.8, -0.12, 8); }
    cyl(ca, 'starting_valve', M.forged, 0.075, 0.42, 'y', x, 9.55, 0.42, 14);
    cyl(ca, 'indicator_cock', M.red, 0.03, 0.22, 'y', x + 0.38, 9.45, -0.34, 8);
    cyl(ca, 'cylinder_cover_safety_valve', M.forged, 0.05, 0.25, 'y', x - 0.38, 9.47, 0.3, 10);
    // exhaust valve assembly
    const ea = u.exvAsm = G(`exhaust_valve_assembly_${k}`);
    lathe(ea, 'exhaust_valve_housing', M.cover, [[0.2, 9.35], [0.32, 9.35], [0.32, 10.3], [0.07, 10.3], [0.07, 9.95], [0.18, 9.7], [0.2, 9.35]], x, 0, 0, 36);
    cyl(ea, 'exhaust_valve_housing', M.cover, 0.3, 0.06, 'z', x, 9.85, 0.33, 24);
    tube(ea, 'exhaust_valve_air_supply_pipe', M.cw, [x + 0.15, 10.45, 0.2], [x + 0.25, 9.8, 0.6], 0.018, 6);
    cyl(ea, 'exhaust_valve_air_spring', M.cover, 0.21, 0.32, 'y', x, 10.46, 0, 24);
    cyl(ea, 'exhaust_valve_hydraulic_actuator', M.hyd, 0.17, 0.5, 'y', x, 10.87, 0, 20);
    const sp = u.spindle = G('exhaust_valve_spindle', ea);
    lathe(sp, 'exhaust_valve_spindle', M.forged, [[0, 8.8], [0.19, 8.8], [0.19, 8.85], [0.05, 8.98], [0, 8.98]], x, 0, 0, 32);
    cyl(sp, 'exhaust_valve_spindle', M.forged, 0.04, 1.6, 'y', x, 9.75, 0, 12);
    for (let i = 0; i < 6; i++) { const a = i * PI / 3; const v = box(sp, 'exhaust_valve_rotation_vanes', M.forged, 0.03, 0.12, 0.09, x + 0.08 * Math.cos(a), 9.25, 0.08 * Math.sin(a)); v.rotation.set(0, -a, 0.4); }
    cyl(sp, 'exhaust_valve_push_rod', M.forged, 0.05, 0.45, 'y', x, 10.82, 0, 12);
    tube(root, 'exhaust_valve_outlet_duct', M.lagging, [x, 9.85, 0.28], [x, 9.95, 1.8], 0.22, 16);
    // piston assembly (moves as one with crosshead)
    const pa = u.pistonAsm = G(`crosshead_and_piston_${k}`); pa.position.x = x;
    cyl(pa, 'crosshead_pin', M.forged, 0.24, 0.56, 'x', 0, 0, 0, 28);
    for (const s of [1, -1]) box(pa, 'crosshead_guide_shoe', M.whitemetal, 0.1, 0.6, 0.54, s * 0.33, 0, 0);
    lathe(pa, 'piston_rod', M.forgedC, [[0.04, 0.3], [0.1, 0.3], [0.1, 3.3], [0.04, 3.3], [0.04, 0.3]], 0, 0, 0, 28);
    cyl(pa, 'piston_rod_foot_flange', M.forged, 0.2, 0.07, 'y', 0, 0.28, 0, 28);
    for (const [bx, bz] of [[0.13, 0.13], [-0.13, 0.13], [0.13, -0.13], [-0.13, -0.13]]) cyl(pa, 'piston_rod_foot_bolts', M.forged, 0.025, 0.14, 'y', bx, 0.3, bz, 8);
    lathe(pa, 'piston_rod', M.forgedC, [[0.1, 3.3], [0.2, 3.3], [0.2, 3.36], [0.1, 3.36]], 0, 0, 0, 28);
    lathe(pa, 'piston_skirt', M.forgedC, [[0.25, 3.36], [0.292, 3.36], [0.292, 3.52], [0.25, 3.52], [0.25, 3.36]], 0, 0, 0);
    lathe(pa, 'piston_crown', M.crownC, [[0, 3.875], [0.13, 3.88], [0.27, 3.925], [0.298, 3.9], [0.298, 3.52], [0.25, 3.52], [0.25, 3.8], [0.13, 3.815], [0, 3.8]], 0, 0, 0, 48);
    lathe(pa, 'piston_cooling_oil_insert', M.forgedC, [[0.04, 3.36], [0.2, 3.52], [0.21, 3.6], [0.19, 3.6], [0.04, 3.4]], 0, 0, 0, 28);
    for (let i = 0; i < 12; i++) { const a = i * PI / 6; cyl(pa, 'piston_crown_bolts', M.forgedC, 0.018, 0.2, 'y', 0.225 * Math.cos(a), 3.43, 0.225 * Math.sin(a), 6); }
    for (let i = 0; i < 4; i++) torus(pa, 'piston_rings', M.ringC, 0.293, 0.013, 0, 3.86 - i * 0.055, 0);
    const flashM = new THREE.MeshStandardMaterial({ name: `me_combustion_flash_${k}`, color: 0xff8a2a, emissive: 0xff6a10, emissiveIntensity: 2, transparent: true, opacity: 0, depthWrite: false });
    u.flash = mesh(root, 'combustion_flash', new THREE.SphereGeometry(0.28, 20, 12), flashM); u.flash.position.set(x, 8.6, 0); u.flash.scale.set(1, 0.35, 1); u.flash.visible = false;
    // connecting rod
    const cr = u.conrod = G(`connecting_rod_${k}`); cr.position.x = x;
    box(cr, 'big_end_bearing_housing', M.forged, 0.32, 0.4, 0.98, 0, 0.25, 0);
    box(cr, 'big_end_bearing_cap', M.forged, 0.32, 0.4, 0.98, 0, -0.25, 0);
    for (const bz of [0.42, -0.42]) for (const bx of [0.08, -0.08]) { cyl(cr, 'big_end_bolts', M.forged, 0.035, 0.95, 'y', bx, 0, bz, 8); cyl(cr, 'big_end_bolts', M.forged, 0.06, 0.08, 'y', bx, -0.49, bz, 6); }
    cyl(cr, 'conrod_shank', M.forged, 0.16, L - 0.95, 'y', 0, (L + 0.1) / 2, 0, 20, 0.12);
    box(cr, 'crosshead_bearing_housing', M.forged, 0.56, 0.3, 0.62, 0, L - 0.17, 0);
    for (const bx of [0.22, -0.22]) for (const bz of [0.25, -0.25]) cyl(cr, 'crosshead_bearing_bolts', M.forged, 0.03, 0.4, 'y', bx, L - 0.12, bz, 8);
    // HCU
    const h = u.hcu = G(`hydraulic_cylinder_unit_${k}`);
    rbox(h, 'hcu_distribution_block', M.hyd, 0.62, 0.42, 0.46, x, 7.3, -2.05, 0.05);
    cyl(h, 'fuel_oil_pressure_booster', M.forged, 0.09, 0.7, 'y', x - 0.15, 7.85, -2.0, 16);
    box(h, 'fiva_valve', M.red, 0.18, 0.22, 0.18, x + 0.18, 7.62, -2.0);
    cyl(h, 'hcu_exhaust_valve_actuator', M.hyd, 0.08, 0.35, 'y', x + 0.1, 7.68, -1.9, 12);
    box(h, 'hcu_leakage_alarm', M.yellow, 0.06, 0.06, 0.06, x - 0.15, 8.24, -2.0);
    for (const s of [1, -1]) cyl(h, 'hcu_accumulators', M.hyd, 0.08, 0.28, 'y', x + s * 0.2, 6.95, -2.2, 14);
    const pipes = u.pipes = G(`hcu_pipes_${k}`);
    for (const s of [1, -1]) route(pipes, 'hcu_hp_fuel_pipe', M.fuel, [[x - 0.15, 8.2, -2.0], [x - 0.15, 9.95, -1.3], [x + s * 0.3, 9.95, -0.35], [x + s * 0.3, 9.75, -0.26]], 0.022);
    route(pipes, 'hcu_exhaust_valve_hydraulic_pipe', M.hyd, [[x + 0.1, 7.5, -1.95], [x + 0.1, 11.2, -1.3], [x, 11.2, -0.2], [x, 11.05, -0.12]], 0.03);
    units.push(u);
  }
  box(root, 'cylinder_frame_top_deck', M.casing, LEN + 0.4, 0.05, 2.3, 0, 6.9, 0).name = 'cylinder_frame_scavenge_box';

  // ---- hydraulic power supply & rail ----
  const hps = G('hydraulic_power_supply');
  rbox(hps, 'hydraulic_power_supply', M.hyd, 1.2, 1.4, 1.4, xb(N) - 1.1, 5.4, -1.9, 0.1);
  for (let i = 0; i < 3; i++) { cyl(hps, 'hps_pump', M.hyd, 0.2, 0.55, 'z', xb(N) - 0.8 + i * 0.3, 6.35, -2.35, 20); for (let f = 0; f < 5; f++) cyl(hps, 'hps_pump', M.hyd, 0.23, 0.02, 'z', xb(N) - 0.8 + i * 0.3, 6.35, -2.15 - f * 0.1, 20); }
  for (let i = 0; i < 3; i++) cyl(hps, 'hps_pump', M.forged, 0.14, 0.5, 'x', xb(N) - 1.1, 6.25, -1.4 - i * 0.3, 14);
  cyl(hps, 'hps_filter_6um', M.hyd, 0.18, 0.7, 'y', xb(N) - 1.6, 5.2, -2.8, 16);
  cyl(hps, 'hps_drive_gear', M.forged, 0.24, 0.08, 'x', xb(N) - 1.015, -0.35, -0.87, 24);
  box(hps, 'hydraulic_power_supply', M.casing, 0.9, 4.3, 0.12, xb(N) - 1.1, 2.55, -1.9); // bracket down to the bedplate
  route(hps, 'hydraulic_oil_supply_rail', M.hyd, [[xb(N) - 1.1, 6.1, -2.05], [xb(N) - 0.2, 6.95, -2.25], [xb(0) + 0.1, 6.95, -2.25]], 0.07);

  // ---- scavenge air receiver, aux blowers ----
  const sr = G('scavenge_air_receiver');
  vessel(sr, 'scavenge_air_receiver', M.casing, 0.85, LEN + 0.6, 0, 6.1, 2.5, 0.38);
  for (let j = 0; j <= N; j++) torus(sr, 'scavenge_air_receiver', M.casing, 0.86, 0.025, xb(j), 6.1, 2.5, 0).rotation.y = PI / 2;
  for (let j = 0; j <= N; j += 2) box(sr, 'scavenge_air_receiver_support', M.casing, 0.14, 1.0, 0.8, xb(j), 4.95, 2.35);
  for (let k = 1; k <= N; k++) { box(sr, 'scavenge_air_non_return_flaps', M.dark, 0.55, 0.55, 0.12, xk(k), 6.0, 1.66); cyl(cf, 'scavenge_box_relief_valve', M.red, 0.1, 0.12, 'z', xk(k) + 0.3, 6.35, -1.66, 12); }
  for (const s of [1, -1]) cyl(sr, 'scavenge_air_receiver', M.forged, 0.3, 0.05, 'x', s * ((LEN + 0.6) / 2 + 0.3), 6.1, 2.5, 20);
  for (const [i, bx] of [[1, 2.6], [2, 0.6]]) { const b = G(`auxiliary_blower_${i}`, sr); cyl(b, 'auxiliary_blower', M.casing, 0.42, 0.45, 'y', bx, 7.15, 2.9, 24); cyl(b, 'auxiliary_blower', M.casing, 0.28, 0.7, 'y', bx, 7.7, 2.9, 20); }

  // ---- exhaust receiver, turbocharger, air cooler ----
  const er = G('exhaust_gas_receiver');
  vessel(er, 'exhaust_gas_receiver', M.lagging, 0.8, LEN + 0.2, 0, 9.95, 2.5, 0.35);
  for (let x = -LEN / 2; x < LEN / 2; x += 0.45) box(er, 'exhaust_receiver_cladding_band', M.forged, 0.01, 0.02, 0.02, x, 10.76, 2.5);
  for (let x = -LEN / 2; x <= LEN / 2 + 0.01; x += 0.9) torus(er, 'exhaust_receiver_cladding_band', M.forged, 0.81, 0.012, x, 9.95, 2.5, 0).rotation.y = PI / 2;
  for (let j = 0; j <= N; j++) box(er, 'exhaust_gas_receiver_support', M.casing, 0.12, 2.3, 0.14, xb(j), 8.05, 2.35);
  tube(er, 'exhaust_receiver_to_tc', M.lagging, [-LEN / 2 - 0.2, 9.95, 2.5], [-LEN / 2 - 1.3, 9.7, 2.9], 0.5, 20);
  const tc = G('turbocharger');
  const TCX = -LEN / 2 - 1.8, TY = 9.7, TZ = 2.9;
  { const P = [[0.001, 0.95], [0.5, 0.95], [0.62, 0.8], [0.9, 0.45], [0.95, 0.2], [0.8, -0.05], [0.42, -0.2], [0.38, -0.55], [0.55, -0.62], [0.9, -0.78], [1.05, -0.95], [1.05, -1.2], [0.92, -1.32], [1.1, -1.4], [1.12, -1.5], [1.12, -2.45], [1.0, -2.55], [0.3, -2.58], [0.001, -2.58]];
    const g = new THREE.LatheGeometry(P.map(q => new THREE.Vector2(q[0], q[1])), 48); g.rotateZ(-PI / 2); const o = mesh(tc, 'tc_turbine_casing', g, M.tcCasing); o.position.set(TCX, TY, TZ);
    torus(tc, 'tc_turbine_gas_inlet_volute', M.tcCasing, 0.82, 0.24, TCX + 0.25, TY, TZ, 0).rotation.y = PI / 2;
    torus(tc, 'tc_compressor_casing', M.tcCasing, 1.02, 0.22, TCX - 1.05, TY, TZ, 0).rotation.y = PI / 2;
    tube(tc, 'tc_compressor_casing', M.tcCasing, [TCX - 1.05, TY - 1.0, TZ + 0.1], [TCX - 1.05, TY - 1.6, TZ + 0.4], 0.28, 18);
    for (let i = 0; i < 9; i++) { const t = torus(tc, 'tc_air_intake_filter_silencer', M.forged, 1.125, 0.018, TCX - 1.55 - i * 0.11, TY, TZ, 0); t.rotation.y = PI / 2; }
    for (const [dz, dy] of [[0.5, -0.9], [-0.5, -0.9]]) box(tc, 'tc_support_foot', M.casing, 0.5, 0.9, 0.18, TCX - 0.4, TY + dy - 0.4, TZ + dz); }



  for (const fx of [TCX + 0.05, TCX - 0.55, TCX - 1.36]) { const f = torus(tc, 'tc_casing_flange', M.forged, fx === TCX - 0.55 ? 0.45 : 0.98, 0.03, fx, TY, TZ, 0); f.rotation.y = PI / 2; }
  route(tc, 'tc_lo_pipe', M.lo, [[TCX - 0.75, TY - 0.38, TZ], [TCX - 0.75, TY - 1.3, TZ + 0.9], [-LEN / 2, TY - 1.3, TZ + 0.9]], 0.03);
  tube(tc, 'tc_exhaust_outlet', M.lagging, [TCX + 0.1, TY + 0.6, TZ], [TCX + 0.1, 12.3, TZ], 0.55, 20);
  const rotor = G('tc_rotor', tc); rotor.position.set(TCX - 0.7, TY, TZ);
  cyl(rotor, 'tc_rotor_shaft', M.forged, 0.09, 1.9, 'x', 0, 0, 0, 14);
  cyl(rotor, 'tc_turbine_wheel', M.blade, 0.3, 0.2, 'x', 0.55, 0, 0, 24);
  for (let i = 0; i < 24; i++) { const a = i * 2 * PI / 24; box(rotor, 'tc_turbine_wheel', M.blade, 0.14, 0.34, 0.02, 0.55, 0.45 * Math.cos(a), 0.45 * Math.sin(a), 0, a, 0).rotation.set(a, 0.5, 0); }
  cyl(rotor, 'tc_compressor_impeller', M.blade, 0.6, 0.35, 'x', -0.7, 0, 0, 32, 0.22);
  for (let i = 0; i < 14; i++) { const a = i * 2 * PI / 14; box(rotor, 'tc_compressor_impeller', M.blade, 0.4, 0.28, 0.02, -0.7, 0.42 * Math.cos(a), 0.42 * Math.sin(a)).rotation.set(a, -0.3, 0); }
  const ac = G('scavenge_air_cooler');
  rbox(ac, 'scavenge_air_cooler', M.casing, 1.4, 1.9, 1.6, TCX + 0.3, 7.0, 2.7, 0.08);
  for (const dz of [0.5, -0.5]) cyl(ac, 'air_cooler_water_box', M.casing, 0.22, 0.35, 'z', TCX + 0.3, 7.0 + dz * 1.2, 3.65, 20);
  box(ac, 'air_cooler_tube_stack', M.coolerCore, 1.2, 1.6, 1.4, TCX + 0.3, 7.0, 2.7);
  box(ac, 'water_mist_catcher', M.casing, 0.55, 1.9, 1.6, TCX + 1.3, 7.0, 2.7);
  tube(ac, 'tc_air_outlet_duct', M.casing, [TCX - 1.4, TY - 0.9, TZ], [TCX + 0.3, 8.0, 2.7], 0.4, 18);
  tube(ac, 'tc_air_outlet_duct', M.casing, [TCX + 1.5, 6.5, 2.6], [-LEN / 2 - 0.5, 6.1, 2.5], 0.45, 18);
  for (const s of [1, -1]) tube(ac, 'air_cooler_tube_stack', M.cw, [TCX + 0.3 + s * 0.4, 7.9, 3.5], [TCX + 0.3 + s * 0.4, 8.8, 3.9], 0.08, 10);

  // ---- galleries ----
  const gal = G('engine_gallery');
  box(gal, 'engine_gallery_platform', M.grating, LEN + 1.2, 0.05, 0.9, -0.2, 6.9, -2.85);
  box(gal, 'engine_gallery_platform', M.grating, LEN + 1.2, 0.05, 0.9, -0.2, 9.6, -1.1);
  for (const [y, z] of [[6.9, -3.28], [9.6, -1.55]]) { for (const hh of [1.0, 0.5]) tube(gal, 'gallery_handrail', M.yellow, [-LEN / 2 - 0.8, y + hh, z], [LEN / 2 + 0.4, y + hh, z], hh > 0.9 ? 0.025 : 0.018, 10); for (let x = -LEN / 2 - 0.8; x <= LEN / 2 + 0.4; x += 1.08) { tube(gal, 'gallery_handrail', M.yellow, [x, y, z], [x, y + 1.0, z], 0.02, 8); box(gal, 'gallery_bracket', M.casing, 0.06, 0.06, 0.9, x, y - 0.1, z + 0.45 * Math.sign(-z) ); } box(gal, 'gallery_toe_plate', M.yellow, LEN + 1.2, 0.1, 0.012, -0.2, y + 0.06, z); }
  box(gal, 'engine_room_floor_plates', M.grating, LEN + 2.6, 0.04, 2.0, -0.4, 0.42, -3.2);
  route(bed, 'main_bearing_lo_supply', M.lo, [[xb(0) + 0.3, 0.55, -1.6], [xb(N) - 0.3, 0.55, -1.6]], 0.06);
  for (let j = 0; j <= N; j++) tube(bed, 'main_bearing_lo_supply', M.lo, [xb(j), 0.55, -1.6], [xb(j), 0.6, -0.55], 0.03, 6);
  { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 160; const cx = cv.getContext('2d'); cx.fillStyle = '#c9ccce'; cx.fillRect(0, 0, 512, 160); cx.fillStyle = '#1b1f23'; cx.font = 'bold 54px Arial'; cx.fillText('MAN B&W', 24, 70); cx.font = '40px Arial'; cx.fillText('7G60ME-C9.5', 24, 130);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const o = mesh(root, 'engine_name_plate', new THREE.PlaneGeometry(0.8, 0.25), new THREE.MeshStandardMaterial({ name: 'me_name_plate', map: t, roughness: 0.4, metalness: 0.5 })); o.position.set(xb(0) - 0.4, 3.7, -1.88); o.rotation.y = PI; }
  box(root, 'engine_control_unit_cabinet', M.casing, 0.6, 1.8, 1.0, xb(0) + 1.3, 8.0, -2.6);


  // ---- secondary detail ----
  const hexNut = (p, name, m, x, y, z, rad = 0.07, h = 0.07) => cyl(p, name, m, rad, h, 'y', x, y, z, 6);
  const sb = G('staybolts');
  for (let j = 0; j <= N; j++) for (const s of [1, -1]) { cyl(sb, 'staybolt', M.forged, 0.045, 8.35, 'y', xb(j), 2.8, s * 1.6, 10); hexNut(sb, 'staybolt_nut', M.forged, xb(j), 6.98, s * 1.6, 0.1, 0.12); hexNut(sb, 'staybolt_nut', M.forged, xb(j), -1.36, s * 1.6, 0.1, 0.12); }
  const hd = G('engine_foundation');
  for (const s of [1, -1]) {
    box(hd, 'resin_chocks', M.dark, LEN + 1.2, 0.06, 0.34, -0.25, -1.53, s * 1.875);
    for (let x = -LEN / 2 - 0.9; x <= LEN / 2 + 0.5; x += 0.52) { cyl(hd, 'holding_down_bolts', M.forged, 0.035, 0.4, 'y', x, -1.45, s * 1.9, 8); hexNut(hd, 'holding_down_bolts', M.forged, x, -1.37, s * 1.9, 0.07, 0.07); }
    box(hd, 'engine_seating_top_plate', M.casing, LEN + 1.6, 0.08, 0.6, -0.25, -1.6, s * 1.875);
  }
  for (let j = 0; j <= N; j++) for (const s of [1, -1]) hexNut(bed, 'main_bearing_cap', M.forged, xb(j), 0.82, s * 0.45, 0.08, 0.08);
  for (const u of units) {
    cyl(u.pistonAsm, 'crosshead_telescopic_lo_pipe', M.lo, 0.045, 2.6, 'y', 0, 1.3, -0.55, 10);
    box(u.pistonAsm, 'crosshead_telescopic_lo_pipe', M.lo, 0.12, 0.1, 0.35, 0, 0.05, -0.42);
    cyl(frame, 'crosshead_telescopic_lo_pipe', M.lo, 0.07, 1.9, 'y', u.x, 3.85, -0.55, 12);
    box(frame, 'crankcase_door', M.forged, 0.2, 0.05, 0.05, u.x, 2.4, -1.93);
    for (const dy of [-0.45, 0.45]) for (const dx of [-0.3, 0.3]) cyl(frame, 'crankcase_door', M.forged, 0.025, 0.05, 'z', u.x + dx, 2.4 + dy, -1.92, 6);
  }
  route(frame, 'crosshead_lo_inlet_main', M.lo, [[xb(0) + 0.4, 4.6, -1.3], [xb(N) - 0.2, 4.6, -1.3]], 0.09);
  for (const u of units) tube(frame, 'crosshead_lo_inlet_main', M.lo, [u.x, 4.6, -1.3], [u.x, 4.6, -0.6], 0.05, 8);
  const omd = G('oil_mist_detector');
  box(omd, 'oil_mist_detector', M.casing, 0.6, 0.8, 0.35, xb(0) + 0.9, 2.6, -2.2);
  route(omd, 'oil_mist_sampling_pipe', M.forged, [[xb(0) + 0.9, 3.1, -2.05], [xb(N), 3.6, -2.05]], 0.03);
  for (const u of units) tube(omd, 'oil_mist_sampling_pipe', M.forged, [u.x + 0.3, 3.6, -2.05], [u.x + 0.3, 3.6, -1.87], 0.025, 6);
  box(root, 'axial_vibration_monitor', M.dark, 0.25, 0.25, 0.25, xb(0) + 0.75, 0.75, 0.3);
  const jw = G('ht_jacket_water_mains');
  route(jw, 'ht_jacket_water_inlet_main', M.cw, [[xb(0) + 0.3, 7.15, 1.2], [xb(N) - 0.3, 7.15, 1.2]], 0.1);
  route(jw, 'ht_jacket_water_outlet_main', M.cw, [[xb(0) + 0.3, 9.5, 0.95], [xb(N) - 0.3, 9.5, 0.95]], 0.11);
  for (const u of units) { tube(jw, 'ht_jacket_water_inlet_main', M.cw, [u.x + 0.25, 7.15, 1.2], [u.x + 0.25, 7.4, 0.55], 0.05, 8); tube(jw, 'ht_jacket_water_outlet_main', M.cw, [u.x - 0.25, 9.05, 0.5], [u.x - 0.25, 9.5, 0.95], 0.05, 8); }
  const fr = G('fuel_oil_rails');
  route(fr, 'fuel_oil_inlet_rail', M.fuel, [[xb(0) + 0.3, 7.95, -2.45], [xb(N) - 0.3, 7.95, -2.45]], 0.06);
  route(fr, 'fuel_oil_return_rail', M.fuel, [[xb(0) + 0.3, 7.7, -2.55], [xb(N) - 0.3, 7.7, -2.55]], 0.05);
  for (const u of units) tube(fr, 'fuel_oil_inlet_rail', M.fuel, [u.x - 0.15, 7.95, -2.45], [u.x - 0.15, 7.95, -2.08], 0.03, 6);
  const sam = G('starting_air_main');
  route(sam, 'starting_air_main_pipe', M.air, [[xb(0) + 0.3, 9.75, 0.62], [xb(N) - 0.3, 9.75, 0.62]], 0.08);
  route(root, 'cylinder_oil_supply_pipe', M.lo, [[xb(0) + 0.3, 7.55, -1.35], [xb(N) - 0.3, 7.55, -1.35]], 0.03);
  for (const u of units) route(cf, 'scavenge_box_drain', M.dark, [[u.x - 0.35, 4.95, -1.62], [u.x - 0.35, 4.95, -2.2], [u.x - 0.35, 4.2, -2.2]], 0.035);
  route(cf, 'scavenge_box_drain', M.dark, [[xb(0), 4.2, -2.2], [xb(N), 4.2, -2.2]], 0.06);
  for (const u of units) for (let i = 0; i < 4; i++) torus(er, 'exhaust_expansion_bellows', M.forged, 0.25, 0.035, u.x, 9.93, 1.4 + i * 0.07, 0);
  for (let i = 0; i < 5; i++) { const t = torus(er, 'exhaust_expansion_bellows', M.forged, 0.53, 0.04, -LEN / 2 - 0.55 - i * 0.08, 9.9, 2.6, 0); t.rotation.y = PI / 2; }
  for (let i = 0; i < 30; i++) { const a = i * 2 * PI / 30; const v = box(tc, 'tc_nozzle_ring', M.blade, 0.12, 0.2, 0.015, TCX - 0.08, TY + 0.66 * Math.cos(a), TZ + 0.66 * Math.sin(a)); v.rotation.set(a, 0.6, 0); }
  cyl(tc, 'tc_diffuser', M.tcCasing, 0.95, 0.12, 'x', TCX - 1.0, TY, TZ, 36);
  for (let i = 0; i < 26; i++) box(ac, 'air_cooler_fins', M.finsC, 1.22, 0.012, 1.42, TCX + 0.3, 6.25 + i * 0.058, 2.7);
  for (let i = 0; i < 4; i++) box(ac, 'scavenge_air_cooler', M.forgedC, 1.45, 0.05, 1.65, TCX + 0.3, 6.08 + i * 0.62, 2.7);
  const lad = (x, y0, y1, z) => { const g = G('engine_ladder', gal); for (const dx of [-0.22, 0.22]) cyl(g, 'engine_ladder', M.yellow, 0.025, y1 - y0, 'y', x + dx, (y0 + y1) / 2, z, 6); for (let y = y0 + 0.25; y < y1; y += 0.28) cyl(g, 'engine_ladder', M.yellow, 0.018, 0.44, 'x', x, y, z, 6); };
  lad(xb(N) - 0.5, -1.5, 6.9, -3.25); lad(xb(0) + 0.7, 6.9, 9.6, -2.0);
  for (const u of units) { lathe(u.coverAsm, 'exhaust_valve_bottom_piece', M.forged, [[0.19, 8.78], [0.3, 8.78], [0.3, 9.1], [0.2, 9.1]], u.x, 0, 0, 32); box(u.coverAsm, 'cylinder_cover', M.dark, 0.12, 0.08, 0.02, u.x + 0.56, 9.2, 0).name = 'cylinder_number_plate'; }

  // ---- realism details ----
  const inst = (p, name, geo, m, list) => { const im = new THREE.InstancedMesh(geo, m, list.length); im.name = name; const o = new THREE.Object3D(); list.forEach((t, i) => { o.position.set(t[0], t[1], t[2]); o.rotation.set(t[3] || 0, t[4] || 0, t[5] || 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); p.add(im); return im; };
  const nut = new THREE.CylinderGeometry(0.035, 0.035, 0.05, 6), nuts = [];
  for (let x = -LEN / 2 - 0.2; x <= LEN / 2 + 0.2; x += 0.18) for (const sz of [1, -1]) { nuts.push([x, 0.37, sz * 1.97]); nuts.push([x, 4.88, sz * 1.8]); nuts.push([x, 6.92, sz * 1.55]); }
  inst(root, 'flange_bolts', nut, M.forgedC, nuts);
  const covNut = [], hbolt = new THREE.CylinderGeometry(0.018, 0.018, 0.03, 6);
  for (const u of units) for (let i = 0; i < 16; i++) { const a = i * 2 * PI / 16; covNut.push([u.x + 0.37 * Math.cos(a), 2.4 + 0.57 * Math.sin(a), -1.905, PI / 2, 0, 0]); }
  inst(frame, 'crankcase_door', hbolt, M.forged, covNut);
  const lip = G('local_instrument_panel'); box(lip, 'local_instrument_panel', M.casing, 1.3, 1.0, 0.12, xb(0) + 0.2, 8.2, -2.95);
  const face = new THREE.MeshStandardMaterial({ name: 'me_gauge_face', color: 0xf4f2ea, roughness: 0.3, emissive: 0x333330 });
  for (let i = 0; i < 8; i++) { const gx = xb(0) - 0.25 + (i % 4) * 0.3, gy = 8.45 - Math.floor(i / 4) * 0.4; cyl(lip, 'pressure_gauges', face, 0.1, 0.03, 'z', gx, gy, -3.02, 20); cyl(lip, 'pressure_gauges', M.forged, 0.11, 0.04, 'z', gx, gy, -3.0, 20); box(lip, 'pressure_gauges', M.dark, 0.008, 0.08, 0.005, gx, gy + 0.02, -3.04, 0, 0, 0.6 - i * 0.3); }
  const tray = G('cable_trays'); box(tray, 'cable_trays', M.grating, LEN + 0.6, 0.03, 0.35, 0, 8.6, -2.72); for (let i = 0; i < 5; i++) cyl(tray, 'cable_trays', M.dark, 0.018, LEN + 0.6, 'x', 0, 8.64, -2.85 + i * 0.065, 6);
  for (const u of units) { cyl(root, 'exhaust_temperature_sensor', M.forged, 0.025, 0.25, 'y', u.x + 0.12, 10.12, 0.9, 8); cyl(root, 'jacket_temperature_sensor', M.forged, 0.02, 0.18, 'y', u.x - 0.25, 9.62, 0.95, 8); tube(tray, 'cable_trays', M.dark, [u.x, 8.62, -2.6], [u.x + 0.1, 8.0, -2.15], 0.015, 5); }
  for (let i = 0; i < 3; i++) cyl(hps, 'pressure_gauges', face, 0.08, 0.03, 'x', xb(N) - 1.72, 5.6 + i * 0.25, -1.6, 16);

  // ---- animation ----
  const explodeOf = u => [[u.exvAsm, 0, 6.4, 0], [u.coverAsm, 0, 5.2, 0], [u.linerAsm, 0, 4.0, 0], [u.hcu, 0, 0, -1.4]];
  const state = { theta: 0, tcSpeed: 1 };
  function update(theta, explode = 0, exCyl = 1, dt = 0) {
    state.theta = theta; crank.rotation.x = theta;
    let firing = null;
    for (const u of units) {
      const a = theta + u.phi, sa = Math.sin(a), ca = Math.cos(a);
      const yc = r * ca + Math.sqrt(L * L - r * r * sa * sa);
      const ex = u.k === exCyl ? explode : 0;
      u.pistonAsm.position.y = yc + ex * 0.4;
      u.conrod.position.set(u.x, r * ca, r * sa);
      u.conrod.rotation.x = Math.atan2(-r * sa, yc - r * ca);
      const deg = ((a * 180 / PI) % 360 + 360) % 360;
      u.spindle.position.y = deg > 110 && deg < 265 ? -0.1 * Math.sin(PI * (deg - 110) / 155) : 0;
      const f = deg < 45 ? 1 - deg / 45 : 0;
      u.flash.visible = f > 0 && ex === 0; u.flash.material.opacity = 0.85 * f;
      if (deg < 360 / N && (firing === null || deg < firing.d)) firing = { k: u.k, d: deg };
      for (const [o, dx, dy, dz] of explodeOf(u)) o.position.set(dx * ex, dy * ex, dz * ex);
      u.pipes.visible = ex < 0.02;
    }
    rotor.rotation.x += dt * 40 * (state.tcSpeed ?? 1);
    return { firing: firing?.k, deg: ((theta * 180 / PI) % 360 + 360) % 360 };
  }
  // crank angle at which cylinder k is at TDC
  const tdcTheta = k => -PHI[k];
  update(0);
  return { root, M, update, tdcTheta, units, state };
}
