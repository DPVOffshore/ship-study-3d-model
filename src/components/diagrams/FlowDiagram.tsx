'use client';
import { useMemo, useState } from 'react';
import type { Diagram } from '@/lib/diagrams';
import { FLOW_SPEED, MEDIA } from '@/lib/diagrams';
import { KB_BY_ID } from '@/lib/kb';
import { cx } from '../ui';

/** Split a label onto two lines when it would not fit the box (≈ 6.7 px per character at 12.5 px semibold). */
function wrap(label: string, width: number): string[] {
  if (label.length * 6.7 <= width) return [label];
  const mid = label.length / 2;
  let best = -1;
  for (let i = 0; i < label.length; i++) if (label[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best < 0 ? [label] : [label.slice(0, best), label.slice(best + 1)];
}

interface Props { d: Diagram; animate: boolean; highlight?: string | null; onNode: (part: string) => void }

export default function FlowDiagram({ d, animate, highlight, onNode }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const N = useMemo(() => Object.fromEntries(d.nodes.map((x) => [x.id, x])), [d]);
  const links = useMemo(() => d.links.map(([a, b, med, via], i) => {
    const A = N[a], B = N[b];
    const pts: [number, number][] = via ? [[A.x, A.y], ...via, [B.x, B.y]]
      : A.y === B.y || A.x === B.x ? [[A.x, A.y], [B.x, B.y]]
      : [[A.x, A.y], [(A.x + B.x) / 2, A.y], [(A.x + B.x) / 2, B.y], [B.x, B.y]];
    let best = 0, bi = 0;
    for (let k = 0; k < pts.length - 1; k++) { const l = Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]); if (l > best) { best = l; bi = k; } }
    const [p, q] = [pts[bi], pts[bi + 1]];
    return { i, a, b, med, pts: pts.map((x) => x.join(',')).join(' '), mx: (p[0] + q[0]) / 2, my: (p[1] + q[1]) / 2, ang: (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI };
  }), [d, N]);
  const focus = hover ?? (highlight && d.nodes.find((n) => n.part === highlight)?.id) ?? null;
  const connected = useMemo(() => focus ? new Set(links.filter((l) => l.a === focus || l.b === focus).map((l) => l.i)) : null, [focus, links]);
  const neighbours = useMemo(() => focus ? new Set(links.filter((l) => l.a === focus || l.b === focus).flatMap((l) => [l.a, l.b])) : null, [focus, links]);
  const used = [...new Set(d.links.map((l) => l[2]))];

  return (
    <svg viewBox="0 0 1080 610" className={cx('block h-auto w-full', !animate && 'flow-paused')} role="img" aria-labelledby={`dt-${d.id}`} style={{ fontFamily: 'var(--font-sans)' }}>
      <title id={`dt-${d.id}`}>{d.title}, schematic</title>
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="var(--color-rule-2)" strokeWidth="0.6" /></pattern>
      </defs>
      <rect width="1080" height="570" fill="url(#grid)" />
      {links.map((l) => {
        const [col, , dash] = MEDIA[l.med];
        const dim = connected && !connected.has(l.i);
        return (
          <g key={l.i} opacity={dim ? (hover ? 0.18 : 0.45) : 1} style={{ transition: 'opacity .15s' }}>
            <polyline points={l.pts} fill="none" stroke={col} strokeWidth={connected?.has(l.i) ? 4.4 : 3.4} strokeDasharray={dash} strokeLinejoin="round" />
            {animate && !dash && (
              <polyline className="flow-line" points={l.pts} fill="none" stroke="white" strokeOpacity="0.85" strokeWidth="1.6" strokeDasharray="6 30" strokeLinecap="round"
                style={{ ['--flow-dur' as string]: `${FLOW_SPEED[l.med] ?? 1.2}s` }} />
            )}
            {animate && dash && (
              <polyline className="flow-line" points={l.pts} fill="none" stroke={col} strokeWidth="5.5" strokeDasharray="3 33" strokeLinecap="round"
                style={{ ['--flow-dur' as string]: `${FLOW_SPEED[l.med] ?? 1.2}s` }} />
            )}
            <path d="M -8 -6.5 L 8 0 L -8 6.5 Z" fill={col} transform={`translate(${l.mx},${l.my}) rotate(${l.ang})`} />
          </g>
        );
      })}
      {d.nodes.map((x) => {
        const link = !!x.part && !!KB_BY_ID[x.part];
        const dim = neighbours && !neighbours.has(x.id);
        const isHi = highlight && x.part === highlight;
        return (
          <g key={x.id} opacity={dim ? (hover ? 0.35 : 0.6) : 1} style={{ transition: 'opacity .15s', cursor: link ? 'pointer' : 'default' }}
            onMouseEnter={() => setHover(x.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(x.id)} onBlur={() => setHover(null)}
            onClick={() => link && onNode(x.part!)} onKeyDown={(e) => { if (link && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onNode(x.part!); } }}
            tabIndex={link ? 0 : -1} role={link ? 'link' : undefined} aria-label={link ? `${x.label}: open in 3D` : undefined}>
            <rect x={x.x - x.w / 2} y={x.y - x.h / 2} width={x.w} height={x.h} rx="3"
              fill={isHi ? 'var(--color-red-wash)' : hover === x.id && link ? 'var(--color-blue-wash)' : 'var(--color-sheet)'}
              stroke={isHi ? 'var(--color-red)' : link ? 'var(--color-ink)' : 'var(--color-mute)'} strokeWidth={isHi ? 2 : link ? 1.4 : 0.9} strokeDasharray={link ? undefined : '3 2'} />
            {(() => {
              const lines = wrap(x.label, x.w - 14);
              const top = x.y - ((lines.length - 1) * 14 + (x.sub ? 15 : 0)) / 2 + 4;
              return (
                <>
                  {lines.map((t, i) => <text key={i} x={x.x} y={top + i * 14} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="var(--color-ink)">{t}</text>)}
                  {x.sub && <text x={x.x} y={top + lines.length * 14 + 1} textAnchor="middle" fontSize="11" fill="var(--color-ink-2)" fontFamily="var(--font-mono)">{x.sub}</text>}
                </>
              );
            })()}
          </g>
        );
      })}
      <g transform="translate(0,590)" fontSize="11" fill="var(--color-ink)">
        {used.map((m, i) => (
          <g key={m} transform={`translate(${14 + i * 152},0)`}>
            <line x1="0" y1="0" x2="28" y2="0" stroke={MEDIA[m][0]} strokeWidth="3.4" strokeDasharray={MEDIA[m][2]} />
            <text x="34" y="4">{MEDIA[m][1]}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}
