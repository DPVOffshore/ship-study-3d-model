// Single-zone thermodynamic model of one cylinder of the 7G60ME-C9.5.
// Published inputs: bore 600 mm, stroke 2,790 mm, L1 = 2,680 kW/cyl at 97 r/min, MEP 21.0 bar, layout points L1-L4.
// Estimated inputs (flagged in the UI): con-rod length, compression ratio, valve/port timing, gamma, friction MEP,
// Wiebe parameters, scavenge pressure vs load (shape calibrated to a published 6G60ME-C9.5 shop-test report).

export const GEO = {
  bore: 0.6,
  stroke: 2.79,
  rod: 3.1, // estimated
  cr: 19.0, // geometric compression ratio, estimated
  cyl: 7,
};
export const r = GEO.stroke / 2;
export const AREA = (Math.PI / 4) * GEO.bore ** 2;
export const VS = AREA * GEO.stroke; // swept volume, m3 (0.789)
export const VC = VS / (GEO.cr - 1);

// Timing in crank degrees after TDC (firing). Typical values for a uniflow two-stroke, estimated.
export const TIMING = { evo: 110, po: 141, pc: 219, evc: 265 };

// Layout diagram of the G60ME-C9.5 (MAN Project Guide fig. 1.03.01), kW per cylinder.
export const LAYOUT = {
  L1: { n: 97, p: 2680 },
  L2: { n: 97, p: 2010 },
  L3: { n: 72, p: 1990 },
  L4: { n: 72, p: 1500 },
};
export const MEP_L1 = 21.0;
// Published SFOC, high-load tuning, at L1 (MAN PG 1.03)
export const SFOC_PUBLISHED = [
  { load: 0.5, g: 165.5 },
  { load: 0.75, g: 163.0 },
  { load: 1.0, g: 167.0 },
];

const deg = Math.PI / 180;
/** Piston displacement from TDC (m) for crank angle in degrees. */
export function pistonX(thDeg: number) {
  const t = thDeg * deg, s = Math.sin(t);
  return r * (1 - Math.cos(t)) + GEO.rod - Math.sqrt(GEO.rod ** 2 - r * r * s * s);
}
export const volume = (thDeg: number) => VC + AREA * pistonX(thDeg);

export interface Smcr { pFrac: number; nFrac: number } // fractions of L1 power and speed
export interface CycleInput { load: number; soi: number; smcr: Smcr; pmaxControl?: boolean }
export interface CycleResult {
  th: Float32Array; // crank angle, deg (0..360 from TDC firing)
  v: Float32Array; // m3
  p: Float32Array; // bar abs
  pMot: Float32Array; // motored (no combustion) pressure, bar abs
  pmax: number; thPmax: number; pcomp: number; pscav: number;
  imep: number; bmep: number; fmep: number;
  rpm: number; powerCyl: number; powerTotal: number; torque: number;
  sfoc: number; mepSmcr: number; soiUsed: number; limited: boolean;
}

export const GAMMA = 1.34;
const LCV = 42700; // kJ/kg
const ETA_HR = 0.945; // share of fuel energy released into the gas (wall heat loss lumped in), estimated
/** Pmax the ECS holds at high load (estimated for a Mk 9 engine). */
export const PMAX_LIMIT = 190; // share of fuel energy released into the gas (wall heat loss lumped in), estimated

/** MEP at the chosen SMCR point, bar. */
export const mepAt = (s: Smcr) => (MEP_L1 * s.pFrac) / s.nFrac;

/** Scavenge-air pressure (bar gauge) vs load on the propeller curve. Shape from a 6G60ME-C9.5 test report, scaled by SMCR MEP. Estimated. */
export function scavGauge(load: number, mepSmcr: number) {
  return 3.86 * Math.pow(Math.max(load, 0.05), 1.35) * Math.pow(mepSmcr / 16.9, 0.3);
}

function wiebe(th: number, start: number, dur: number) {
  if (th <= start) return 0;
  const x = (th - start) / dur;
  return x >= 1.6 ? 1 : 1 - Math.exp(-6.9 * Math.pow(x, 1.7));
}

/** Integrates the closed part of the cycle (EVC → EVO) for a given heat input per cycle, J. */
function closedCycle(qJ: number, pEvc: number, soi: number, load: number, out?: { th: number[]; p: number[]; pm: number[] }) {
  const step = 0.25;
  const dur = 24 + 14 * Math.min(1.1, load); // combustion duration, deg (estimated)
  const start = soi + 1.5; // ignition delay ≈ 1.5° (estimated)
  let p = pEvc * 1e5, pm = p, work = 0, pmax = 0, thPmax = 0, pcomp = 0;
  let prevV = volume(TIMING.evc);
  for (let th = TIMING.evc; th <= 360 + TIMING.evo; th += step) {
    const a = th % 360, V = volume(a), dV = V - prevV;
    const t = th - 360; // angle relative to firing TDC
    const dQ = qJ * (wiebe(t + step, start, dur) - wiebe(t, start, dur));
    // First law, single zone: dp = ((γ-1) dQ - γ p dV) / V
    p += ((GAMMA - 1) * dQ - GAMMA * p * dV) / V;
    pm += (-GAMMA * pm * dV) / V;
    work += p * dV;
    if (p > pmax) { pmax = p; thPmax = t; }
    if (Math.abs(t) < step / 2) pcomp = pm;
    if (out && Math.abs((th * 4) % 4) < 1e-6) { out.th.push(a); out.p.push(p / 1e5); out.pm.push(pm / 1e5); }
    prevV = V;
  }
  return { pEvo: p / 1e5, work, pmax: pmax / 1e5, thPmax, pcomp: pcomp / 1e5 };
}

export function computeCycle({ load, soi, smcr, pmaxControl = true }: CycleInput): CycleResult {
  const mepSmcr = mepAt(smcr);
  const nSmcr = LAYOUT.L1.n * smcr.nFrac;
  const rpm = nSmcr * Math.cbrt(load); // propeller law: P ∝ n³
  const bmepTarget = mepSmcr * Math.pow(load, 2 / 3); // MEP ∝ n² on the propeller curve
  const fmep = 0.9 + 0.35 * (rpm / 97) ** 2; // friction MEP, bar (estimated)
  const pscav = 1.013 + scavGauge(load, mepSmcr);
  const pEvc = pscav * 0.96; // cylinder ≈ exhaust receiver pressure when the exhaust valve closes

  // Open-cycle (gas exchange) work is small for a uniflow engine with ports open near BDC; take the closed cycle as indicated work.
  const imepTarget = bmepTarget + fmep;
  const solve = (s: number) => {
    let lo = 0, hi = 12e6; // J per cycle
    let rr = closedCycle(1, pEvc, s, load);
    for (let i = 0; i < 34; i++) {
      const mid = (lo + hi) / 2;
      rr = closedCycle(mid, pEvc, s, load);
      if (rr.work / VS / 1e5 < imepTarget) lo = mid; else hi = mid;
    }
    return { q: (lo + hi) / 2, rr };
  };
  // ECS Pmax control: retard the start of injection until Pmax is at or below the limit.
  let soiUsed = soi, sol = solve(soi), limited = false;
  if (pmaxControl) {
    for (let k = 0; k < 24 && sol.rr.pmax > PMAX_LIMIT; k++) { soiUsed += 0.5; sol = solve(soiUsed); limited = true; }
  }
  const q = sol.q;
  soi = soiUsed;
  let res = sol.rr;
  const out = { th: [] as number[], p: [] as number[], pm: [] as number[] };
  res = closedCycle(q, pEvc, soi, load, out);
  const imep = res.work / VS / 1e5;
  const bmep = imep - fmep;

  // Build a full 0..360 table at 1° resolution, adding blowdown and scavenging.
  const N = 361;
  const th = new Float32Array(N), v = new Float32Array(N), p = new Float32Array(N), pMot = new Float32Array(N);
  const lookup = (a: number, arr: number[]) => {
    // closed-cycle samples are every 1° from EVC (265) through 360 and on to EVO (110)
    let idx = out.th.findIndex(x => Math.abs(x - a) < 1e-6);
    if (idx < 0) idx = 0;
    return arr[idx];
  };
  const { evo, po, pc, evc } = TIMING;
  for (let i = 0; i < N; i++) {
    const a = i;
    th[i] = a; v[i] = volume(a);
    let pv: number, pmv: number;
    if (a <= evo || a >= evc) {
      pv = lookup(a % 360, out.p);
      pmv = lookup(a % 360, out.pm);
    } else if (a < po) {
      // blowdown: from EVO pressure down to scavenge pressure as the valve opens
      const f = (a - evo) / (po - evo);
      pv = res.pEvo * Math.pow(pscav / res.pEvo, Math.pow(f, 0.55));
      const pmEvo = lookup(evo, out.pm);
      pmv = pmEvo * Math.pow(pscav / pmEvo, Math.pow(f, 0.55));
    } else if (a <= pc) {
      pv = pmv = pscav * 0.985; // ports open, scavenging
    } else {
      const f = (a - pc) / (evc - pc);
      pv = pmv = pscav * (0.985 - 0.025 * f); // ports closed, exhaust valve still open
    }
    p[i] = pv; pMot[i] = pmv;
  }
  const powerCyl = (bmep * 1e5 * VS * rpm) / 60 / 1000; // kW (one cycle per revolution)
  const fuelPerCycle = q / ETA_HR / (LCV * 1000); // kg
  const sfoc = (fuelPerCycle * (rpm / 60) * 3600 * 1000) / powerCyl; // g/kWh
  return {
    th, v, p, pMot,
    pmax: res.pmax, thPmax: res.thPmax, pcomp: res.pcomp, pscav,
    imep, bmep, fmep, rpm, powerCyl, powerTotal: powerCyl * GEO.cyl,
    torque: (powerCyl * GEO.cyl * 60) / (2 * Math.PI * rpm), // kNm
    sfoc, mepSmcr, soiUsed, limited,
  };
}

/** Clamp an SMCR point into the layout area (MEP between the L2–L4 and L1–L3 lines, speed between 72 and 97 r/min). */
export function clampSmcr(s: Smcr): Smcr {
  const nMin = LAYOUT.L3.n / LAYOUT.L1.n;
  const nFrac = Math.min(1, Math.max(nMin, s.nFrac));
  const mepMin = MEP_L1 * (LAYOUT.L2.p / LAYOUT.L1.p); // 15.75 bar
  const pLo = (mepMin / MEP_L1) * nFrac, pHi = nFrac;
  return { nFrac, pFrac: Math.min(pHi, Math.max(pLo, s.pFrac)) };
}
