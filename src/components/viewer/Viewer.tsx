'use client';
import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { buildShip } from '@/lib/models/ship-model';
import { buildEngine, type EngineBuild } from '@/lib/models/engine-model';
import { applyRealism } from '@/lib/models/realism';
import { KB_BY_ID, matchName } from '@/lib/kb';
import { runtime } from '@/lib/runtime';
import { useHover, useStudio, type Mode } from '@/lib/store';
import { DEFAULT_VIEW, ENG_VIEWS, SHIP_VIEWS } from '@/lib/views';

// ---------- model cache (built once per page load) ----------
const INTERNAL = new Set(['engine_room', 'cargo_holds_internal', 'hull_structure', 'tanks', 'bridge_equipment', 'electrical_power', 'fire_fighting', 'bow_thruster', 'propulsion_and_steering']);
type Ship = ReturnType<typeof buildShip>;
interface Models { ship: Ship; eng: EngineBuild; clip: THREE.Plane; idx: Record<Mode, Map<string, THREE.Mesh[]>>; realismFor: WeakSet<THREE.Scene> }
let MODELS: Models | null = null;

function tag(root: THREE.Object3D) {
  const exact = new Map<string, THREE.Mesh[]>(), all_ = new Map<string, THREE.Mesh[]>();
  root.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh) return;
    const m = o as THREE.Mesh;
    m.castShadow = true; m.receiveShadow = true;
    let p: THREE.Object3D | null = m, hit = null, internal = false;
    const all = new Set<string>();
    while (p) {
      const h = matchName(p.name);
      if (h) { if (!hit) hit = h; all.add(h.id); }
      if (INTERNAL.has(p.name)) internal = true;
      p = p.parent;
    }
    // kb = most specific entry (used for picking and isolate)
    m.userData.kb = hit?.id; m.userData.sys = hit?.sys; m.userData.orig = m.material; m.userData.internal = internal;
    for (const id of all) { if (!all_.has(id)) all_.set(id, []); all_.get(id)!.push(m); }
    if (hit) { if (!exact.has(hit.id)) exact.set(hit.id, []); exact.get(hit.id)!.push(m); }
  });
  // Selection set per entry: its own meshes; only an entry with none of its own (e.g. Deck cranes) takes the whole assembly under it.
  const idx = new Map<string, THREE.Mesh[]>();
  for (const [id, ms] of all_) idx.set(id, exact.get(id) ?? ms);
  return idx;
}
function getModels(): Models {
  if (!MODELS) {
    const clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    const ship = buildShip(THREE);
    const eng = buildEngine(THREE, clip);
    const idx = { ship: tag(ship.root), engine: tag(eng.root) };
    ship.xray.forEach((m) => { m.userData.o = { opacity: m.opacity, transparent: m.transparent, depthWrite: m.depthWrite }; });
    MODELS = { ship, eng, clip, idx, realismFor: new WeakSet() };
  }
  return MODELS;
}

const ghost = new THREE.MeshStandardMaterial({ name: 'ghost', color: 0x9aa3a8, transparent: true, opacity: 0.06, depthWrite: false });
const hiCache = new Map<THREE.Material, THREE.Material>();
const hiMat = (m: THREE.Material) => {
  if (!hiCache.has(m)) {
    const c = m.clone() as THREE.MeshStandardMaterial;
    // Lit materials glow red; unlit ones (labels, plates) have no emissive term, so tint their colour instead
    if ((c as THREE.MeshStandardMaterial).isMeshStandardMaterial || 'emissive' in c) { c.emissive = new THREE.Color(0xff2a1f); c.emissiveIntensity = 0.55; }
    else if ('color' in c) (c as unknown as THREE.MeshBasicMaterial).color.lerp(new THREE.Color(0xff2a1f), 0.55);
    if (c.transparent && c.opacity < 0.5) c.opacity = 0.7;
    hiCache.set(m, c);
  }
  return hiCache.get(m)!;
};
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface Anim { p0: THREE.Vector3; t0: THREE.Vector3; p1: THREE.Vector3; t1: THREE.Vector3; start: number; dur: number }

function SceneController({ onPick }: { onPick: (id: string | null) => void }) {
  const { gl, scene, camera, size } = useThree();
  const get = useThree((s) => s.get);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const ctl = () => get().controls as unknown as OrbitControlsImpl | null;
  const models = useMemo(getModels, []);
  const mode = useStudio((s) => s.mode);
  const sel = useStudio((s) => s.sel);
  const iso = useStudio((s) => s.iso);
  const xray = useStudio((s) => s.xray), tanks = useStudio((s) => s.tanks), cargo = useStudio((s) => s.cargo), sea = useStudio((s) => s.sea);
  const cut = useStudio((s) => s.cut);
  const flyNonce = useStudio((s) => s.flyNonce);
  const view = useStudio((s) => s.view);
  const quality = useStudio((s) => s.quality);
  const anim = useRef<Anim | null>(null);
  const modeRef = useRef(mode); modeRef.current = mode;

  // --- lights, ground, sea (created once per scene) ---
  const rig = useMemo(() => {
    const hemi = new THREE.HemisphereLight(0xffffff, 0xd4d8d6, 1.0);
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.castShadow = true; key.shadow.mapSize.set(4096, 4096); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.04;
    const fill = new THREE.DirectionalLight(0xf2f6ff, 0.5); fill.position.set(-5, 3, -4);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.16 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    const seaMesh = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshStandardMaterial({ color: 0x2e4d5e, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.82 }));
    seaMesh.rotation.x = -Math.PI / 2; seaMesh.position.y = 11.0; seaMesh.visible = false;
    return { hemi, key, fill, ground, seaMesh };
  }, []);

  useEffect(() => {
    scene.background = new THREE.Color('#e3e8ea');
    const { hemi, key, fill, ground, seaMesh } = rig;
    scene.add(hemi, key, key.target, fill, ground, seaMesh);
    if (!models.realismFor.has(scene)) { applyRealism(THREE, gl, scene, models.ship, models.eng); models.realismFor.add(scene); }
    gl.localClippingEnabled = true;
    runtime.index = models.idx;
    runtime.listeners.forEach((f) => f());
    useStudio.getState().set({ ready: true });
    if (useStudio.getState().sel) setTimeout(() => useStudio.getState().fly(), 50);
    return () => { scene.remove(hemi, key, key.target, fill, ground, seaMesh); };
  }, [scene, gl, models, rig]);

  // --- camera animation helpers ---
  const flyTo = (pos: THREE.Vector3, target: THREE.Vector3, dur = 900) => {
    const controls = ctl();
    if (!controls) { camera.position.copy(pos); return; }
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    anim.current = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, start: performance.now(), dur: reduce ? 1 : dur };
  };
  useEffect(() => {
    if (!controls) return;
    const cancel = () => { anim.current = null; };
    controls.addEventListener('start', cancel);
    return () => controls.removeEventListener('start', cancel);
  }, [controls]);

  // --- mode switch: swap root, fit key light + shadow frustum, default view ---
  useEffect(() => {
    const root = mode === 'engine' ? models.eng.root : models.ship.root;
    scene.add(root);
    const box = new THREE.Box3().setFromObject(root), c = box.getCenter(new THREE.Vector3()), rad = box.getBoundingSphere(new THREE.Sphere()).radius;
    const k = rig.key;
    k.position.copy(c).add(new THREE.Vector3(0.45, 0.8, 0.55).normalize().multiplyScalar(rad * 2));
    k.target.position.copy(c);
    Object.assign(k.shadow.camera, { left: -rad * 1.1, right: rad * 1.1, top: rad * 1.1, bottom: -rad * 1.1, near: 0.5, far: rad * 4.5 });
    k.shadow.camera.updateProjectionMatrix();
    if (k.shadow.map) { k.shadow.map.dispose(); (k.shadow as unknown as { map: null }).map = null; }
    rig.ground.position.y = box.min.y - 0.01;
    rig.ground.scale.setScalar(mode === 'ship' ? 5 : 1);
    const cam = camera as THREE.PerspectiveCamera;
    cam.near = mode === 'ship' ? 0.3 : 0.05; cam.far = mode === 'ship' ? 6000 : 600; cam.updateProjectionMatrix();
    const [p, t] = (mode === 'engine' ? ENG_VIEWS : SHIP_VIEWS)[DEFAULT_VIEW[mode]];
    anim.current = null;
    camera.position.copy(fitPreset(p, t));
    const c0 = ctl();
    if (c0) { c0.target.set(...t); c0.update(); }
    return () => { scene.remove(root); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, models, scene, camera, rig]);

  // --- quality ---
  useEffect(() => {
    rig.key.castShadow = quality === 'high';
    rig.key.shadow.mapSize.setScalar(quality === 'high' ? 4096 : 1024);
    if (rig.key.shadow.map) { rig.key.shadow.map.dispose(); (rig.key.shadow as unknown as { map: null }).map = null; }
  }, [quality, rig]);

  // --- ship layers ---
  useEffect(() => {
    models.ship.xray.forEach((m) => {
      if (xray) { m.transparent = true; m.opacity = 0.13; m.depthWrite = false; } else Object.assign(m, m.userData.o);
      m.needsUpdate = true;
    });
    models.ship.tanks.visible = tanks;
    const dc = models.ship.root.getObjectByName('deck_cargo'); if (dc) dc.visible = cargo;
    rig.seaMesh.visible = sea && mode === 'ship';
  }, [xray, tanks, cargo, sea, mode, models, rig]);

  // --- selection + isolate materials ---
  useEffect(() => {
    const root = mode === 'engine' ? models.eng.root : models.ship.root;
    const selSet = new Set<THREE.Object3D>(sel ? models.idx[mode].get(sel) ?? [] : []);
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !m.userData.orig) return;
      let mat: THREE.Material = m.userData.orig;
      if (iso && m.userData.sys !== iso) mat = ghost;
      if (selSet.has(m)) mat = hiMat(m.userData.orig);
      m.material = mat;
    });
  }, [sel, iso, mode, models]);

  // --- section cut ---
  useEffect(() => { models.clip.constant = 4.6 - (cut / 100) * 4.6; }, [cut, models]);

  /** Camera position for a preset, pulled back so the view fits the screen area left free by the panels. */
  const fitPreset = (p: [number, number, number], t: [number, number, number]) => {
    measure();
    const k = Math.min(1.9, Math.max(1, 1 / Math.min(off.current.fw, off.current.fh)));
    const T = new THREE.Vector3(...t);
    return new THREE.Vector3(...p).sub(T).multiplyScalar(k).add(T);
  };

  // --- fly to selection ---
  useEffect(() => {
    if (!flyNonce) return;
    const { sel: id } = useStudio.getState();
    const ms = id ? models.idx[modeRef.current].get(id) ?? [] : [];
    if (!ms.length) return;
    if (modeRef.current === 'ship') {
      const patch: { xray?: boolean; tanks?: boolean } = {};
      if (ms.some((m) => m.userData.internal)) patch.xray = true;
      if (KB_BY_ID[id!]?.sys === 'tanks' && ms.some((m) => m.parent?.name === 'tanks' || m.parent?.parent?.name === 'tanks')) patch.tanks = true;
      // Engine-room parts sit behind decks and tanks: fade every other chapter so the part can be seen
      const st = useStudio.getState();
      const p2: { iso?: string } = {};
      if (ms.some((m) => m.userData.internal) && !st.iso && KB_BY_ID[id!]) p2.iso = KB_BY_ID[id!].sys;
      if (Object.keys(patch).length || p2.iso) st.set({ ...patch, ...p2 });
    }
    const box = new THREE.Box3(); ms.forEach((m) => box.expandByObject(m));
    if (box.isEmpty()) return;
    const c = box.getCenter(new THREE.Vector3()), bsize = box.getSize(new THREE.Vector3()).length();
    const tgt = ctl()?.target ?? new THREE.Vector3();
    let dir = camera.position.clone().sub(tgt).normalize();
    const internal = ms.some((m) => m.userData.internal);
    // On the ship, come in from the side the camera is already on, slightly from above, so the camera ends up outside the hull
    if (modeRef.current === 'ship') dir = new THREE.Vector3(dir.x * 0.5, Math.max(dir.y, 0.3), Math.sign(dir.z) || 1).normalize();
    // Frame by the tighter of the vertical and horizontal field of view (portrait phones are narrow)
    const pc = camera as THREE.PerspectiveCamera, vf = (pc.fov * Math.PI) / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * pc.aspect);
    // ...and only the part of the screen not covered by panels counts
    measure();
    const fit = Math.max((bsize / 2) / Math.tan(vf / 2) / off.current.fh, (bsize / 2) / Math.tan(hf / 2) / off.current.fw);
    const dist = Math.max(fit * (modeRef.current === 'engine' ? 1.25 : 1.1), modeRef.current === 'engine' ? 2.5 : internal ? 26 : 8);
    flyTo(c.clone().add(dir.multiplyScalar(dist)), c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyNonce]);

  // --- view presets ---
  useEffect(() => {
    if (!view) return;
    const V = modeRef.current === 'engine' ? ENG_VIEWS : SHIP_VIEWS;
    const v = V[view.name]; if (!v) return;
    if (v[2] && modeRef.current === 'ship') useStudio.getState().set({ xray: true });
    flyTo(fitPreset(v[0], v[1]), new THREE.Vector3(...v[1]), 1100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // --- picking + hover ---
  useEffect(() => {
    const el = gl.domElement, ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const shown = (o: THREE.Object3D | null) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
    const pick = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const root = modeRef.current === 'engine' ? models.eng.root : models.ship.root;
      for (const h of ray.intersectObject(root, true)) {
        const o = h.object as THREE.Mesh, m = o.material as THREE.Material & { clippingPlanes?: THREE.Plane[] };
        if (!o.isMesh || !shown(o)) continue;
        if (m === ghost || (m.transparent && m.opacity < 0.3)) continue;
        if (m.clippingPlanes?.length && models.clip.distanceToPoint(h.point) < 0) continue;
        return o;
      }
      return null;
    };
    let down: [number, number] | null = null, last = 0;
    const onDown = (e: PointerEvent) => { down = [e.clientX, e.clientY]; };
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      const o = pick(e); onPick((o?.userData.kb as string) || null);
    };
    const onMove = (e: PointerEvent) => {
      const hover = useHover.getState();
      if (e.buttons || e.pointerType === 'touch') { if (hover.label) hover.set(null); return; }
      const now = performance.now(); if (now - last < 70) return; last = now;
      const o = pick(e);
      if (!o) { hover.set(null); el.style.cursor = ''; return; }
      const x = KB_BY_ID[o.userData.kb];
      hover.set(x ? x.name : o.name.replace(/_/g, ' '), e.clientX, e.clientY);
      el.style.cursor = x ? 'pointer' : '';
    };
    const onLeave = () => useHover.getState().set(null);
    el.addEventListener('pointerdown', onDown); el.addEventListener('pointerup', onUp);
    el.addEventListener('pointermove', onMove); el.addEventListener('pointerleave', onLeave);
    return () => { el.removeEventListener('pointerdown', onDown); el.removeEventListener('pointerup', onUp); el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerleave', onLeave); };
  }, [gl, camera, models, onPick]);

  // --- keep the model centred in the free area between panels (smoothly follows panels opening/closing) ---
  const off = useRef({ x: 0, y: 0, tx: 0, ty: 0, fw: 1, fh: 1, last: 0 });
  const measure = () => {
    const W = window.innerWidth, H = window.innerHeight;
    // Note: offsetParent is always null for position:fixed panels, so test the layout box instead
    const r = (sel: string) => { const el = document.querySelector(sel) as HTMLElement | null; if (!el || !el.getClientRects().length) return null; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 ? b : null; };
    let L = 0, R = 0, B = 0; const T = 52;
    const idx = r('aside[aria-label="Contents"]'); if (idx && idx.left >= 0 && idx.right < W * 0.5) L = idx.right;
    const card = r('aside[aria-label="Study card"]'); if (card && card.left > W * 0.5) R = W - card.left;
    const cyc = r('section[aria-label="Engine cycle"]'); if (cyc && cyc.top > H * 0.3) B = H - cyc.top;
    if (card && card.top > H * 0.35) B = Math.max(B, H - card.top);
    off.current.tx = (R - L) / 2; off.current.ty = (B - T) / 2;
    off.current.fw = Math.max(0.25, (W - L - R) / W); off.current.fh = Math.max(0.25, (H - T - B) / H);
  };

  // --- per-frame: camera animation + engine ---
  useFrame((_, dtRaw) => {
    const dt = Math.min(0.1, dtRaw);
    const o = off.current, now = performance.now();
    if (now - o.last > 250) { o.last = now; measure(); }
    const k = Math.min(1, dt * 8);
    o.x += (o.tx - o.x) * k; o.y += (o.ty - o.y) * k;
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(o.x) > 0.5 || Math.abs(o.y) > 0.5) cam.setViewOffset(size.width, size.height, o.x, o.y, size.width, size.height);
    else if (cam.view) cam.clearViewOffset();
    const a = anim.current;
    const controls = ctl();
    if (a && controls) {
      const t = Math.min(1, (performance.now() - a.start) / a.dur), e = ease(t);
      camera.position.lerpVectors(a.p0, a.p1, e);
      controls.target.lerpVectors(a.t0, a.t1, e);
      controls.update();
      if (t >= 1) anim.current = null;
    }
    if (modeRef.current === 'engine') {
      const s = useStudio.getState();
      if (s.running) runtime.theta += (dt * s.rpm) / 60 * 2 * Math.PI;
      models.eng.state.tcSpeed = 0.15 + 1.1 * s.load;
      const info = models.eng.update(runtime.theta, s.explode, s.exCyl, s.running ? dt : 0);
      runtime.deg = info.deg; runtime.firing = info.firing;
    }
  });

  return null;
}

export default function Viewer({ onPick }: { onPick: (id: string | null) => void }) {
  const quality = useStudio((s) => s.quality);
  return (
    <Canvas
      shadows={quality === 'high'}
      dpr={quality === 'high' ? [1, 2] : 1}
      camera={{ fov: 45, near: 0.3, far: 6000, position: [150, 40, 90] }}
      gl={{ antialias: true, preserveDrawingBuffer: false }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        // If the GPU drops the context (driver reset, too many tabs), stop drawing instead of throwing every frame
        gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); useStudio.getState().set({ running: false }); });
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      <SceneController onPick={onPick} />
    </Canvas>
  );
}
