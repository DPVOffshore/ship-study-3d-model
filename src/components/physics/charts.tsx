'use client';
import { useEffect, useMemo, useRef } from 'react';
import type { CycleResult, Smcr } from '@/lib/physics/cycle';
import { LAYOUT, TIMING } from '@/lib/physics/cycle';
import { FIRING_ORDER } from '@/lib/models/engine-model';
import { runtime } from '@/lib/runtime';

const W = 560, H = 250, M = { l: 46, r: 14, t: 14, b: 34 };
const IW = W - M.l - M.r, IH = H - M.t - M.b;
const PHI = (k: number) => -FIRING_ORDER.indexOf(k) * 2 * Math.PI / 7;
/** Current crank angle (deg after TDC) of cylinder k, from the live animation. */
const cylDeg = (k: number) => { const d = ((runtime.theta + PHI(k)) * 180) / Math.PI; return ((d % 360) + 360) % 360; };

function useLiveDot(cyl: number, place: (deg: number) => [number, number] | null) {
  const ref = useRef<SVGCircleElement>(null);
  const placeRef = useRef(place); placeRef.current = place;
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = placeRef.current(cylDeg(cyl));
      if (ref.current && p) { ref.current.setAttribute('cx', p[0].toFixed(1)); ref.current.setAttribute('cy', p[1].toFixed(1)); }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [cyl]);
  return ref;
}

function Axes({ xt, yt, xl, yl }: { xt: [number, string][]; yt: [number, string][]; xl: string; yl: string }) {
  return (
    <g fontSize="10.5" fill="var(--color-mute)" fontFamily="var(--font-mono)">
      {yt.map(([y, s]) => <g key={'y' + s}><line x1={M.l} x2={W - M.r} y1={y} y2={y} stroke="var(--color-rule-2)" /><text x={M.l - 6} y={y + 3.5} textAnchor="end">{s}</text></g>)}
      {xt.map(([x, s]) => <g key={'x' + s}><line x1={x} x2={x} y1={M.t} y2={H - M.b} stroke="var(--color-rule-2)" /><text x={x} y={H - M.b + 14} textAnchor="middle">{s}</text></g>)}
      <rect x={M.l} y={M.t} width={IW} height={IH} fill="none" stroke="var(--color-rule)" />
      <text x={M.l + IW / 2} y={H - 4} textAnchor="middle" fontFamily="var(--font-sans)" fontSize="11.5" fill="var(--color-ink-2)">{xl}</text>
      <text transform={`translate(12 ${M.t + IH / 2}) rotate(-90)`} textAnchor="middle" fontFamily="var(--font-sans)" fontSize="11.5" fill="var(--color-ink-2)">{yl}</text>
    </g>
  );
}

export function PVChart({ c, cyl, log }: { c: CycleResult; cyl: number; log: boolean }) {
  const pTop = Math.max(200, Math.ceil(c.pmax / 20) * 20 + 20);
  const sx = useMemo(() => (log ? (v: number) => M.l + ((Math.log(v) - Math.log(0.035)) / (Math.log(0.95) - Math.log(0.035))) * IW : (v: number) => M.l + (v / 0.9) * IW), [log]);
  const sy = useMemo(() => (log ? (p: number) => M.t + IH - ((Math.log(Math.max(p, 1)) - Math.log(1)) / (Math.log(300) - Math.log(1))) * IH : (p: number) => M.t + IH - (p / pTop) * IH), [log, pTop]);
  const fired = Array.from(c.th, (_, i) => `${sx(c.v[i]).toFixed(1)},${sy(c.p[i]).toFixed(1)}`).join(' ');
  const mot = Array.from(c.th, (_, i) => i).filter((i) => i <= TIMING.evo || i >= TIMING.evc).sort((a, b) => ((a + 180) % 360) - ((b + 180) % 360))
    .map((i) => `${sx(c.v[i]).toFixed(1)},${sy(c.pMot[i]).toFixed(1)}`).join(' ');
  const xt: [number, string][] = log ? [0.05, 0.1, 0.2, 0.5].map((v) => [sx(v), String(v)]) : [0, 0.2, 0.4, 0.6, 0.8].map((v) => [sx(v), v.toFixed(1)]);
  const yt: [number, string][] = log ? [1, 3, 10, 30, 100, 300].map((p) => [sy(p), String(p)]) : Array.from({ length: pTop / 40 + 1 }, (_, i) => i * 40).map((p) => [sy(p), String(p)]);
  const dot = useLiveDot(cyl, (d) => { const i = Math.round(d) % 361; return [sx(c.v[i]), sy(c.p[i])]; });
  const ev = (i: number, label: string, dy = -8) => <g><circle cx={sx(c.v[i])} cy={sy(c.p[i])} r="2.6" fill="var(--color-ink)" /><text x={sx(c.v[i]) + 5} y={sy(c.p[i]) + dy} fontSize="10.5" fill="var(--color-ink-2)">{label}</text></g>;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto max-h-[250px] w-full" role="img" aria-label="Pressure–volume indicator diagram">
      <Axes xt={xt} yt={yt} xl="Cylinder volume, m³" yl="Pressure, bar abs" />
      <polygon points={fired} fill="var(--color-blue)" fillOpacity="0.08" stroke="none" />
      <polyline points={mot} fill="none" stroke="var(--color-mute)" strokeDasharray="4 3" strokeWidth="1.2" />
      <polyline points={fired} fill="none" stroke="var(--color-blue)" strokeWidth="1.8" strokeLinejoin="round" />
      {ev(TIMING.evo, 'EVO')}{ev(TIMING.po, 'Ports open', -8)}{ev(TIMING.evc, 'EVC', -6)}
      <circle ref={dot} r="5" fill="var(--color-red)" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

export function PThetaChart({ c, cyl }: { c: CycleResult; cyl: number }) {
  const pTop = Math.max(200, Math.ceil(c.pmax / 20) * 20 + 20);
  const sx = (a: number) => M.l + ((a + 180) / 360) * IW; // a in [-180, 180]
  const sy = (p: number) => M.t + IH - (p / pTop) * IH;
  const at = (a: number) => ((Math.round(a) % 360) + 360) % 360;
  const pts = (arr: Float32Array) => Array.from({ length: 361 }, (_, i) => i - 180).map((a) => `${sx(a).toFixed(1)},${sy(arr[at(a)]).toFixed(1)}`).join(' ');
  const events: [number, string][] = [[c.soiUsed, 'SOI'], [TIMING.evo, 'EVO'], [TIMING.po, 'PO'], [TIMING.pc - 360, 'PC'], [TIMING.evc - 360, 'EVC']];
  const dot = useLiveDot(cyl, (d) => { const a = d > 180 ? d - 360 : d; return [sx(a), sy(c.p[at(a)])]; });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto max-h-[250px] w-full" role="img" aria-label="Cylinder pressure against crank angle">
      <Axes xt={[-180, -90, 0, 90, 180].map((a) => [sx(a), a === 0 ? 'TDC' : `${a}°`])} yt={Array.from({ length: pTop / 40 + 1 }, (_, i) => i * 40).map((p) => [sy(p), String(p)])} xl="Crank angle after TDC" yl="Pressure, bar abs" />
      {events.map(([a, l]) => <g key={l}><line x1={sx(a)} x2={sx(a)} y1={M.t} y2={H - M.b} stroke="var(--color-ink-2)" strokeDasharray="2 3" strokeWidth="0.8" /><text x={sx(a) + 3} y={M.t + 11} fontSize="10.5" fill="var(--color-ink-2)">{l}</text></g>)}
      <polyline points={pts(c.pMot)} fill="none" stroke="var(--color-mute)" strokeDasharray="4 3" strokeWidth="1.2" />
      <polyline points={pts(c.p)} fill="none" stroke="var(--color-blue)" strokeWidth="1.8" />
      <g fontSize="10.5" fill="var(--color-ink-2)">
        <circle cx={sx(c.thPmax)} cy={sy(c.pmax)} r="2.6" fill="var(--color-ink)" />
        <text x={sx(c.thPmax) + 6} y={sy(c.pmax) - 4}>Pmax {c.pmax.toFixed(0)} bar</text>
        <text x={sx(0) - 6} y={sy(c.pcomp) + 14} textAnchor="end">Pcomp {c.pcomp.toFixed(0)}</text>
      </g>
      <circle ref={dot} r="5" fill="var(--color-red)" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

export function LoadDiagram({ smcr, load }: { smcr: Smcr; load: number }) {
  const nM = smcr.nFrac * 100, pM = smcr.pFrac * 100;
  const X0 = 55, X1 = 112, Y0 = 25, Y1 = 120;
  const sx = (n: number) => M.l + ((Math.log(n) - Math.log(X0)) / (Math.log(X1) - Math.log(X0))) * IW;
  const sy = (p: number) => M.t + IH - ((Math.log(p) - Math.log(Y0)) / (Math.log(Y1) - Math.log(Y0))) * IH;
  const line = (f: (n: number) => number, a: number, b: number) => Array.from({ length: 40 }, (_, i) => a + ((b - a) * i) / 39).map((n) => `${sx(n).toFixed(1)},${sy(Math.max(Y0, Math.min(Y1, f(n)))).toFixed(1)}`).join(' ');
  const L = Object.fromEntries(Object.entries(LAYOUT).map(([k, v]) => [k, [(v.n / 97) * 100, (v.p / 2680) * 100]])) as Record<string, [number, number]>;
  const n3 = Math.min(1.1 * nM, 105), n57 = 0.969 * nM, n45 = 0.9 * nM;
  const p5 = (n: number) => pM * (n / n57), p4 = (n: number) => p5(n45) * (n / n45) ** 2;
  const n8 = n45 * Math.sqrt((1.1 * pM) / p5(n45));
  const opN = nM * Math.cbrt(load), opP = pM * load;
  const lbl = (n: number, p: number, t: string) => <text x={sx(n)} y={sy(p)} fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--color-ink)" textAnchor="middle" dy="-4">{t}</text>;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto max-h-[250px] w-full" role="img" aria-label="Engine layout and load diagram">
      <Axes xt={[60, 70, 80, 90, 100, 110].map((n) => [sx(n), `${n}`])} yt={[30, 40, 50, 60, 80, 100].map((p) => [sy(p), `${p}`])} xl="Engine speed, % of L1 (97 r/min)" yl="Power, % of L1" />
      <polygon points={[L.L1, L.L2, L.L4, L.L3].map(([n, p]) => `${sx(n)},${sy(p)}`).join(' ')} fill="var(--color-blue)" fillOpacity="0.09" stroke="var(--color-blue)" strokeWidth="1" />
      {(['L1', 'L2', 'L3', 'L4'] as const).map((k) => <text key={k} x={sx(L[k][0]) + (k === 'L1' || k === 'L2' ? 5 : -5)} y={sy(L[k][1]) + 4} fontSize="10.5" fill="var(--color-blue)" textAnchor={k === 'L1' || k === 'L2' ? 'start' : 'end'} fontFamily="var(--font-mono)">{k}</text>)}
      <g fill="none" strokeWidth="1.3">
        <polyline points={line((n) => pM * (n / nM) ** 3, Math.max(X0, nM * Math.cbrt(Y0 / pM)), n3)} stroke="var(--color-ink)" />
        <polyline points={line((n) => pM * (n / (1.05 * nM)) ** 3, Math.max(X0, 1.05 * nM * Math.cbrt(Y0 / pM)), n3)} stroke="var(--color-ink-2)" strokeDasharray="5 3" />
        <polyline points={line(() => pM, n57, n3)} stroke="var(--color-ink)" />
        <polyline points={line(p5, n45, n57)} stroke="var(--color-ink)" />
        <polyline points={line(p4, Math.max(X0 + 1, n45 * Math.sqrt(Y0 / p5(n45))), n45)} stroke="var(--color-ink)" />
        <line x1={sx(n3)} x2={sx(n3)} y1={sy(pM)} y2={sy(pM * (n3 / nM) ** 3)} stroke="var(--color-ink)" />
        <polyline points={line(() => 1.1 * pM, n8, n3)} stroke="var(--color-ink)" strokeDasharray="2 3" />
      </g>
      {lbl(66, pM * (66 / nM) ** 3, '1')}{lbl(78, pM * (78 / (1.05 * nM)) ** 3, '6')}{lbl(n3 - 1.2, pM, '7')}{lbl((n45 + n57) / 2, p5((n45 + n57) / 2), '5')}{lbl(64, p4(64), '4')}{lbl((n8 + n3) / 2, 1.1 * pM, '8')}
      <text x={sx(n3) + 4} y={sy(pM * 0.93)} fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--color-ink)">3</text>
      <circle cx={sx(nM)} cy={sy(pM)} r="3.5" fill="var(--color-ink)" /><text x={sx(nM) - 5} y={sy(pM) + 13} fontSize="11" textAnchor="end" fill="var(--color-ink)">M</text>
      <circle cx={sx(opN)} cy={sy(opP)} r="5" fill="var(--color-red)" stroke="white" strokeWidth="1.5" />
      <text x={sx(opN) + 8} y={sy(opP) + 14} fontSize="10.5" fill="var(--color-red)">{Math.round(load * 100)} % SMCR</text>
    </svg>
  );
}
