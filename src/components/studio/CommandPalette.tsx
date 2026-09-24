'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KB, REF, SYSTEMS } from '@/lib/kb';
import { DIAGRAMS } from '@/lib/diagrams';
import { modeForPart, partHref } from '@/lib/nav';
import { useStudio } from '@/lib/store';
import { cx } from '../ui';

interface Item { key: string; title: string; meta: string; ref?: string; href: string; hay: string }
const SYS = Object.fromEntries(SYSTEMS.map((s) => [s.id, s.name]));

export default function CommandPalette() {
  const router = useRouter();
  const open = useStudio((s) => s.paletteOpen), set = useStudio((s) => s.set), mode = useStudio((s) => s.mode);
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT');
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) { e.preventDefault(); set({ paletteOpen: true }); }
      if (e.key === 'Escape') set({ paletteOpen: false });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [set]);
  useEffect(() => { if (open) { setQ(''); setI(0); setTimeout(() => input.current?.focus(), 10); } }, [open]);

  const items = useMemo<Item[]>(() => [
    ...KB.map((k) => ({ key: k.id, title: k.name, meta: SYS[k.sys], ref: REF[k.id], href: '', hay: `${k.name} ${SYS[k.sys]} ${k.match.join(' ')} ${k.id}`.toLowerCase().replace(/_/g, ' ') })),
    ...DIAGRAMS.map((d) => ({ key: 'dia-' + d.id, title: d.title, meta: 'Flow diagram', href: `/diagrams/${d.id}/`, hay: `${d.title} diagram schematic`.toLowerCase() })),
  ], []);
  const results = useMemo(() => {
    const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return items.filter((x) => ['main_engine', 'me_crosshead', 'me_exhaust_valve', 'me_hcu', 'propeller', 'crane', 'dia-fo', 'dia-lo'].includes(x.key));
    return items
      .map((x) => ({ x, s: terms.every((t) => x.hay.includes(t)) ? terms.reduce((a, t) => a + (x.title.toLowerCase().startsWith(t) ? 3 : x.title.toLowerCase().includes(t) ? 2 : 1), 0) : 0 }))
      .filter((r) => r.s > 0).sort((a, b) => b.s - a.s).slice(0, 12).map((r) => r.x);
  }, [q, items]);

  if (!open) return null;
  const choose = (x: Item) => {
    set({ paletteOpen: false });
    router.push(x.href || partHref(x.key, modeForPart(x.key, mode)), { scroll: false });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/35 px-3 pt-[12vh]" onMouseDown={(e) => { if (e.target === e.currentTarget) set({ paletteOpen: false }); }}>
      <div role="dialog" aria-modal="true" aria-label="Find a part" className="w-full max-w-[560px] overflow-hidden rounded-[10px] border border-rule bg-sheet shadow-xl">
        <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setI(0); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setI((n) => Math.min(results.length - 1, n + 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setI((n) => Math.max(0, n - 1)); }
            if (e.key === 'Enter' && results[i]) choose(results[i]);
          }}
          placeholder="Search parts, systems and diagrams, e.g. crosshead, purifier, ballast"
          aria-label="Search" className="w-full border-b border-rule bg-transparent px-4 py-3.5 text-[15px] outline-none placeholder:text-mute" />
        <ul role="listbox" className="scroll-thin max-h-[52vh] overflow-y-auto py-1">
          {!q && <li className="px-4 pb-1 pt-2 text-[12px] text-mute">Suggestions</li>}
          {results.map((x, n) => (
            <li key={x.key} role="option" aria-selected={n === i}>
              <button type="button" onMouseEnter={() => setI(n)} onClick={() => choose(x)}
                className={cx('flex w-full items-baseline gap-3 px-4 py-2 text-left', n === i && 'bg-blue-wash')}>
                <span className="w-10 shrink-0 font-mono text-[11.5px] text-mute tnum">{x.ref ?? '—'}</span>
                <span className="flex-1 text-[14px]">{x.title}</span>
                <span className="shrink-0 text-[12px] text-mute">{x.meta}</span>
              </button>
            </li>
          ))}
          {q && !results.length && <li className="px-4 py-4 text-[13.5px] text-mute">No part matches “{q}”. Try a system name, like fuel or cooling.</li>}
        </ul>
      </div>
    </div>
  );
}
