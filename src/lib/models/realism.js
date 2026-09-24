// Realism pass: studio environment reflections, tone mapping and procedural surface textures.
export function applyRealism(THREE, renderer, scene, ship, eng) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  // --- environment for reflections ---
  const es = new THREE.Scene(), sg = new THREE.SphereGeometry(40, 48, 24), p = sg.attributes.position, col = [];
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 40; const c = y > 0 ? mix([0.66, 0.72, 0.78], [0.96, 0.97, 0.98], Math.pow(y, 0.5)) : mix([0.52, 0.52, 0.5], [0.16, 0.15, 0.14], Math.pow(-y, 0.6)); col.push(...c); }
  sg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  es.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  for (const [x, y, z, w, h] of [[0, 30, 0, 30, 30], [30, 12, 10, 8, 18], [-25, 14, -18, 10, 14]]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 3, 3), side: THREE.DoubleSide })); pl.position.set(x, y, z); pl.lookAt(0, 0, 0); es.add(pl); }
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(es, 0.03).texture; if ('environmentIntensity' in scene) scene.environmentIntensity = 0.75;

  // --- procedural textures ---
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const cv = (n, draw) => { const c = document.createElement('canvas'); c.width = c.height = n; draw(c.getContext('2d'), n); return c; };
  const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const blobs = (x, n, count, rMax, colFn) => { for (let i = 0; i < count; i++) { const r = 2 + rnd() * rMax, px = rnd() * n, py = rnd() * n, g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, colFn()); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, 2 * r, 2 * r); } };
  const streaks = (x, n, count, rgb, aMax) => { for (let i = 0; i < count; i++) { const sx = rnd() * n, w = 1 + rnd() * 5, sy = rnd() * n * 0.6, len = n * (0.15 + rnd() * 0.6), g = x.createLinearGradient(0, sy, 0, sy + len); g.addColorStop(0, `rgba(${rgb},${aMax * rnd()})`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(sx, sy, w, len); } };
  const grime = (base, count, rgb, a) => tex(cv(512, (x, n) => { x.fillStyle = base; x.fillRect(0, 0, n, n); streaks(x, n, count, rgb, a); blobs(x, n, 500, 18, () => `rgba(60,55,50,${0.04 * rnd()})`); blobs(x, n, 40, 6, () => `rgba(120,60,25,${0.25 * rnd()})`); }), true);
  const mottle = tex(cv(256, (x, n) => { x.fillStyle = '#d8d8d8'; x.fillRect(0, 0, n, n); blobs(x, n, 900, 14, () => { const v = 150 + rnd() * 105 | 0; return `rgba(${v},${v},${v},0.5)`; }); }));
  const nonslip = tex(cv(256, (x, n) => { x.fillStyle = '#808080'; x.fillRect(0, 0, n, n); for (let i = 0; i < 9000; i++) { const v = rnd() * 255 | 0; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(rnd() * n, rnd() * n, 1.5, 1.5); } }));
  const grating = tex(cv(128, (x, n) => { x.clearRect(0, 0, n, n); x.fillStyle = '#fff'; for (let i = 0; i < n; i += 16) { x.fillRect(i, 0, 3, n); } for (let i = 0; i < n; i += 32) x.fillRect(0, i, n, 3); }));
  const contDirt = tex(cv(256, (x, n) => { x.fillStyle = '#fff'; x.fillRect(0, 0, n, n); const g = x.createLinearGradient(0, n, 0, n * 0.6); g.addColorStop(0, 'rgba(70,55,40,0.45)'); g.addColorStop(1, 'rgba(70,55,40,0)'); x.fillStyle = g; x.fillRect(0, 0, n, n); streaks(x, n, 40, '70,55,40', 0.14); blobs(x, n, 60, 6, () => `rgba(110,60,30,${0.25 * rnd()})`); x.fillStyle = 'rgba(40,40,40,0.35)'; x.fillRect(0, 0, n, 5); x.fillRect(0, n - 6, n, 6); }), true);
  const oily = tex(cv(256, (x, n) => { x.fillStyle = '#fff'; x.fillRect(0, 0, n, n); blobs(x, n, 70, 22, () => `rgba(40,38,30,${0.05 * rnd()})`); streaks(x, n, 18, '40,35,25', 0.08); }), true);

  const boxUV = (geo, s) => {
    if (!geo.attributes.normal) geo.computeVertexNormals();
    const P = geo.attributes.position, N = geo.attributes.normal, uv = new Float32Array(P.count * 2);
    for (let i = 0; i < P.count; i++) {
      const ax = Math.abs(N.getX(i)), ay = Math.abs(N.getY(i)), az = Math.abs(N.getZ(i)), x = P.getX(i) * s, y = P.getY(i) * s, z = P.getZ(i) * s;
      if (ay >= ax && ay >= az) { uv[2 * i] = x; uv[2 * i + 1] = z; } else if (ax >= az) { uv[2 * i] = z; uv[2 * i + 1] = y; } else { uv[2 * i] = x; uv[2 * i + 1] = y; }
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  };
  const SM = ship.M, EM = eng.M;
  const shipTex = new Map([
    [SM.hull, { map: grime('#ffffff', 160, '70,50,35', 0.16), roughnessMap: mottle, s: 1 / 7 }],
    [SM.af, { map: grime('#f4f4f4', 60, '60,40,30', 0.2), roughnessMap: mottle, s: 1 / 7 }],
    [SM.white, { map: grime('#ffffff', 160, '110,95,70', 0.16), roughnessMap: mottle, s: 1 / 5 }],
    [SM.deck, { map: grime('#f2f2f2', 60, '60,50,40', 0.2), roughnessMap: nonslip, bumpMap: nonslip, bumpScale: 0.4, s: 1 / 3 }],
    [SM.hatch, { map: grime('#ffffff', 120, '70,55,40', 0.25), roughnessMap: mottle, s: 1 / 5 }],
    [SM.crane, { map: grime('#ffffff', 140, '70,55,40', 0.22), roughnessMap: mottle, s: 1 / 4 }],
    [SM.breakw, { map: grime('#ffffff', 120, '90,50,30', 0.3), roughnessMap: mottle, s: 1 / 4 }],
    [SM.funnel, { map: grime('#ffffff', 120, '30,30,30', 0.22), roughnessMap: mottle, s: 1 / 4 }],
    [SM.grating, { alphaMap: grating, alphaTest: 0.5, s: 2.5 }]
  ]);
  const engTex = new Map([
    [EM.casing, { map: oily, s: 1 / 3 }], [EM.cover, { roughnessMap: mottle, s: 1 }], [EM.liner, { roughnessMap: mottle, s: 1 }],
    [EM.receiver, { map: oily, s: 1 / 2 }], [EM.lagging, { map: oily, s: 1 / 2 }], [EM.grating, { alphaMap: grating, alphaTest: 0.5, s: 2.5 }]
  ]);
  for (const [root, T] of [[ship.root, shipTex], [eng.root, engTex]]) {
    for (const [m, o] of T) { if (!m) continue; for (const k of ['map', 'roughnessMap', 'bumpMap', 'alphaMap', 'alphaTest', 'bumpScale']) if (o[k] !== undefined) m[k] = o[k]; m.needsUpdate = true; }
    const done = new Set();
    root.traverse(o => { if (!o.isMesh) return; const t = T.get(o.userData.orig || o.material); if (t && !done.has(o.geometry)) { boxUV(o.geometry, t.s); done.add(o.geometry); } });
  }
  Object.keys(SM).filter(k => k.startsWith('container_')).forEach(k => { SM[k].map = contDirt; SM[k].roughness = 0.7; SM[k].needsUpdate = true; });
  Object.assign(SM.glass, { roughness: 0.04, metalness: 0.85, envMapIntensity: 1.6 }); SM.glass.needsUpdate = true;
  for (const m of [SM.galv, SM.steel, EM.forged, EM.crank, EM.ring, EM.blade, SM.bronze].filter(Boolean)) { m.envMapIntensity = 1.3; m.needsUpdate = true; }
}
