'use client';
import Link from 'next/link';
import { useState } from 'react';

// Starboard elevation drawn in metres from the same constants as the 3D model (x forward, y up; SVG y is flipped).
const D = 17.9, T = 11.0, DF = 20.6, LV = 3.1;
const BAYS: [number, number][] = (() => { const out: [number, number][] = []; let x = -70.6; const gaps = [1.8, 4.2, 1.8, 1.8, 4.2, 1.8, 1.8, 4.2, 1.8]; for (let i = 0; i < 10; i++) { out.push([x, x + 12.5]); x += 12.5 + (gaps[i] ?? 0); } return out; })();
const CRANES = [[(BAYS[1][1] + BAYS[2][0]) / 2, 15], [(BAYS[4][1] + BAYS[5][0]) / 2, 15], [(BAYS[7][1] + BAYS[8][0]) / 2, 2]] as const;
const TIERS = [3, 5, 6, 6, 6, 6, 6, 6, 5, 3];
const y = (v: number) => -v;
const HULL = `M -93 ${y(D)} L -93 ${y(12.5)} C -90 ${y(11.8)} -87 ${y(9.5)} -85.5 ${y(8.4)} L -83.5 ${y(8.2)} C -80 ${y(7.8)} -78.5 ${y(3)} -75 0 L 80 0 C 86 0 90 ${y(1.2)} 91.8 ${y(3.6)} C 92.8 ${y(5)} 92.4 ${y(7.4)} 90.3 ${y(8.3)} C 91 ${y(12)} 92 ${y(16)} 93 ${y(DF)} L 78.3 ${y(DF)} C 72 ${y(DF)} 66 ${y(18.2)} 61.5 ${y(D)} Z`;

type Part = { id: string; href: string; label: string };
const P: Record<string, Part> = {
  house: { id: 'house', href: '/ship/?part=house', label: 'Accommodation, 7 levels + wheelhouse' },
  crane: { id: 'crane', href: '/ship/?part=crane', label: 'Deck cranes, 32 m jib' },
  stow: { id: 'deck_stow', href: '/ship/?part=deck_stow', label: 'Deck stows, 10 bays of 40 ft' },
  me: { id: 'main_engine', href: '/engine/?part=main_engine', label: 'Main engine 7G60ME-C9.5' },
  prop: { id: 'propeller', href: '/ship/?part=propeller', label: 'Propeller and rudder' },
  bw: { id: 'breakwater', href: '/ship/?part=breakwater', label: 'Breakwater' },
  hatch: { id: 'hatch', href: '/ship/?part=hatch', label: 'Hatch covers' },
  funnel: { id: 'funnel', href: '/ship/?part=funnel', label: 'Funnel' },
};

function Part({ k, hot, setHot, children }: { k: keyof typeof P; hot: string | null; setHot: (k: string | null) => void; children: React.ReactNode }) {
  return (
    <Link href={P[k].href} aria-label={`${P[k].label}: open in 3D`} onMouseEnter={() => setHot(k)} onMouseLeave={() => setHot(null)} onFocus={() => setHot(k)} onBlur={() => setHot(null)}
      className="elev-part" data-hot={hot === k || undefined}>
      <title>{P[k].label}</title>
      {children}
    </Link>
  );
}

export default function ShipElevation() {
  const [hot, setHot] = useState<string | null>(null);
  const ink = 'var(--color-ink)';
  return (
    <figure className="relative">
      <style>{`.elev-part{cursor:pointer;outline:none}.elev-part *{transition:stroke .12s, fill .12s}.elev-part[data-hot] .hl{stroke:var(--color-red)!important}.elev-part[data-hot] .hf{fill:var(--color-red-wash)!important}`}</style>
      <svg viewBox="-110 -53 222 63" className="h-auto w-full" role="img" aria-labelledby="elev-t">
        <title id="elev-t">Starboard elevation of the 2,806 TEU geared container ship, 186 m overall</title>
        <defs>
          <clipPath id="below-wl"><rect x="-110" y={y(T)} width="220" height="30" /></clipPath>
          <pattern id="hatch45" width="1.2" height="1.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="1.2" stroke="var(--color-rule)" strokeWidth="0.25" /></pattern>
        </defs>

        {/* Hull with anti-fouling below the design waterline */}
        <path d={HULL} fill="#d9f0f3" stroke="none" />
        <path d={HULL} fill="#f4d6d3" clipPath="url(#below-wl)" />
        <path d={HULL} fill="none" stroke={ink} strokeWidth="0.35" strokeLinejoin="round" />
        <line x1="-104" x2="100" y1={y(T)} y2={y(T)} stroke="var(--color-blue)" strokeWidth="0.25" strokeDasharray="1.6 0.8" />
        <text x="96" y={y(T) - 0.8} fontSize="2.1" fill="var(--color-blue)" fontFamily="var(--font-mono)">DWL</text>

        {/* Hidden lines: engine room and main engine */}
        <Part k="me" hot={hot} setHot={setHot}>
          <rect x="-81" y={y(D - 0.3)} width="23.8" height={D - 2.1} fill="transparent" stroke="var(--color-ink-2)" strokeWidth="0.22" strokeDasharray="1 0.6" className="hl" />
          <rect x="-72.5" y={y(12.4)} width="9.6" height="10.6" fill="url(#hatch45)" stroke={ink} strokeWidth="0.25" strokeDasharray="0.8 0.5" className="hl hf" />
          <text x="-69.1" y={y(14.2)} fontSize="1.9" fill="var(--color-ink-2)" textAnchor="middle">Engine room</text>
        </Part>

        {/* Propeller, rudder */}
        <Part k="prop" hot={hot} setHot={setHot}>
          <path d={`M -84 ${y(7.6)} C -83.2 ${y(5.5)} -83.2 ${y(2.9)} -84 ${y(0.9)} C -84.8 ${y(2.9)} -84.8 ${y(5.5)} -84 ${y(7.6)} Z`} fill="#eadcc0" stroke={ink} strokeWidth="0.25" className="hl hf" />
          <path d={`M -86.5 ${y(9.2)} L -92.1 ${y(9.2)} L -91.6 ${y(0.9)} L -86.8 ${y(0.9)} Z`} fill="#f4d6d3" stroke={ink} strokeWidth="0.25" className="hl hf" />
        </Part>

        {/* Hatch covers and deck stows */}
        <Part k="hatch" hot={hot} setHot={setHot}>
          {BAYS.map(([a, b], i) => <rect key={i} x={a} y={y(D + 2.5)} width={b - a} height={2.5} fill="#e4e7e9" stroke={ink} strokeWidth="0.2" className="hl hf" />)}
        </Part>
        <Part k="stow" hot={hot} setHot={setHot}>
          {BAYS.map(([a, b], i) => (
            <g key={i}>
              {Array.from({ length: TIERS[i] }, (_, t) => <rect key={t} x={a + 0.15} y={y(D + 2.6 + (t + 1) * 2.59)} width={b - a - 0.3} height={2.59} fill="var(--color-sheet)" stroke={ink} strokeWidth="0.14" className="hl hf" />)}
            </g>
          ))}
        </Part>

        {/* Cranes: pedestal, house, luffing tower, jib stowed forward */}
        <Part k="crane" hot={hot} setHot={setHot}>
          {CRANES.map(([x, luff], i) => {
            const a = (luff * Math.PI) / 180, hx = x + 2.9, hy = D + 15 + 0.45 + 2, tx = hx + 32 * Math.cos(a), ty = hy + 32 * Math.sin(a);
            return (
              <g key={i} fill="#eceeef" stroke={ink} strokeWidth="0.22" className="hl">
                <rect x={x - 1.6} y={y(D + 15)} width="3.2" height="15" className="hl hf" />
                <rect x={x - 2.8} y={y(D + 19)} width="6.4" height="4" className="hl hf" />
                <line x1={x + 0.4} y1={y(D + 19)} x2={x + 0.4} y2={y(D + 28)} />
                <path d={`M ${hx} ${y(hy - 0.5)} L ${tx} ${y(ty)} L ${hx} ${y(hy + 0.7)} Z`} className="hl hf" />
                <line x1={x + 0.4} y1={y(D + 28)} x2={tx} y2={y(ty)} strokeWidth="0.12" />
                <line x1={tx} y1={y(ty)} x2={tx} y2={y(ty - 4)} strokeWidth="0.12" />
              </g>
            );
          })}
        </Part>

        {/* Breakwater and foremast */}
        <Part k="bw" hot={hot} setHot={setHot}><rect x="77.9" y={y(DF + 5.5)} width="0.6" height="5.5" fill="#bfc4c8" stroke={ink} strokeWidth="0.2" className="hl hf" /></Part>
        <line x1="88" x2="88" y1={y(DF)} y2={y(DF + 11)} stroke={ink} strokeWidth="0.3" />
        <circle cx="88" cy={y(DF + 11.3)} r="0.35" fill={ink} />

        {/* Accommodation house, funnel and radar mast */}
        <Part k="funnel" hot={hot} setHot={setHot}>
          <path d={`M -88.4 ${y(D + 6 * LV)} L -82.6 ${y(D + 6 * LV)} L -83.0 ${y(45.8)} L -88.8 ${y(45.8)} Z`} fill="#bfe1f0" stroke={ink} strokeWidth="0.3" className="hl hf" />
          <path d={`M -88.8 ${y(45.8)} L -83.0 ${y(45.8)} L -83.1 ${y(47.4)} L -88.9 ${y(47.4)} Z`} fill="#2b2f33" />
        </Part>
        <Part k="house" hot={hot} setHot={setHot}>
          <rect x="-87.5" y={y(D + 7 * LV)} width="14.5" height={7 * LV} fill="#f4efdc" stroke={ink} strokeWidth="0.3" className="hl hf" />
          {Array.from({ length: 6 }, (_, k) => <line key={k} x1="-87.5" x2="-73" y1={y(D + (k + 1) * LV)} y2={y(D + (k + 1) * LV)} stroke={ink} strokeWidth="0.12" />)}
          {Array.from({ length: 6 }, (_, k) => Array.from({ length: 5 }, (_, w) => <rect key={`${k}-${w}`} x={-86.2 + w * 2.6} y={y(D + (k + 1) * LV + 1.9)} width="1.2" height="1" fill="#9fb4c2" />))}
          <rect x="-86.3" y={y(D + 7 * LV + 3.3)} width="12.8" height="3.3" fill="#f4efdc" stroke={ink} strokeWidth="0.3" className="hl hf" />
          {Array.from({ length: 6 }, (_, w) => <rect key={w} x={-85.6 + w * 2.1} y={y(D + 7 * LV + 2.6)} width="1.6" height="1.5" fill="#6f8797" />)}
          <line x1="-80" x2="-80" y1={y(D + 7 * LV + 3.3)} y2={y(D + 7 * LV + 10)} stroke={ink} strokeWidth="0.3" />
          <line x1="-82.2" x2="-77.8" y1={y(D + 7 * LV + 8.4)} y2={y(D + 7 * LV + 8.4)} stroke={ink} strokeWidth="0.3" />
        </Part>

        {/* Dimensions */}
        <g stroke="var(--color-ink-2)" strokeWidth="0.15" fill="var(--color-ink-2)" fontFamily="var(--font-mono)" fontSize="2.2">
          <line x1="-93" x2="-93" y1="1" y2="6" /><line x1="93" x2="93" y1={y(DF) + 2} y2="6" />
          <line x1="-93" x2="93" y1="4.8" y2="4.8" />
          <path d="M -93 4.8 l 2 -0.7 v 1.4 z M 93 4.8 l -2 -0.7 v 1.4 z" stroke="none" />
          <text x="0" y="8.4" textAnchor="middle" stroke="none">LOA 186.0 m</text>
          <line x1="-97" x2="-106" y1="0" y2="0" /><line x1="-94" x2="-106" y1={y(D)} y2={y(D)} />
          <line x1="-100" x2="-100" y1="0" y2={y(T)} /><path d={`M -100 0 l -0.7 -2 h 1.4 z M -100 ${y(T)} l -0.7 2 h 1.4 z`} stroke="none" />
          <line x1="-104" x2="-104" y1="0" y2={y(D)} /><path d={`M -104 0 l -0.7 -2 h 1.4 z M -104 ${y(D)} l -0.7 2 h 1.4 z`} stroke="none" />
          <text transform={`translate(-100.9 ${y(T / 2)}) rotate(-90)`} textAnchor="middle" stroke="none">T 11.0</text>
          <text transform={`translate(-104.9 ${y(D / 2)}) rotate(-90)`} textAnchor="middle" stroke="none">D 17.9</text>
        </g>
      </svg>
      <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-2 text-[13px] text-mute">
        <span>{hot ? <span className="text-red">{P[hot].label}: open in 3D</span> : 'Starboard elevation. Click the house, cranes, deck stows, engine room or propeller to open them in 3D.'}</span>
        <span className="font-mono text-[12px]">Dashed: hidden lines</span>
      </figcaption>
    </figure>
  );
}
