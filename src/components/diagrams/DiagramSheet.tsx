'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DIAGRAM_BY_ID, DIAGRAMS, SHORT_TITLE } from '@/lib/diagrams';
import type { DiagramId } from '@/lib/kb';
import { KB_BY_ID } from '@/lib/kb';
import { modeForPart, partHref } from '@/lib/nav';
import { useStudio } from '@/lib/store';
import { Button, Toggle, cx } from '../ui';
import FlowDiagram from './FlowDiagram';

export default function DiagramSheet({ id }: { id: DiagramId }) {
  const d = DIAGRAM_BY_ID[id];
  const router = useRouter();
  const from = useSearchParams().get('from');
  const mode = useStudio((s) => s.mode);
  const [animate, setAnimate] = useState(true);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !useStudio.getState().paletteOpen) router.push(from ? partHref(from, modeForPart(from, mode)) : `/${mode}/`); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router, mode, from]);
  const linked = d.nodes.filter((n) => n.part && KB_BY_ID[n.part]).length;
  const back = from ? partHref(from, modeForPart(from, mode)) : `/${mode}/`;

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-ink/40 px-2 pb-4 pt-[60px] md:px-6">
      <article className="mx-auto max-w-[1200px] rounded-[10px] border border-rule bg-sheet shadow-xl">
        <div className="scroll-thin flex items-center gap-2 overflow-x-auto border-b border-rule-2 px-3 py-2">
          <nav aria-label="Diagrams" className="flex rounded-[6px] bg-rule-2 p-0.5">
            {DIAGRAMS.map((x, i) => (
              <Link key={x.id} href={`/diagrams/${x.id}/${from ? `?from=${from}` : ''}`} scroll={false} aria-current={x.id === id ? 'page' : undefined}
                className={cx('rounded-[5px] px-2.5 py-1.5 text-[12.5px] font-medium whitespace-nowrap', x.id === id ? 'bg-sheet text-ink shadow-[0_0_0_1px_var(--color-rule)]' : 'text-mute hover:text-ink')}>
                <span className="mr-1 font-mono text-[11px] text-mute tnum">{i + 1}</span>{SHORT_TITLE[x.id]}
              </Link>
            ))}
          </nav>
          <div className="flex-1" />
          <Toggle on={animate} onClick={() => setAnimate(!animate)}>Show flow</Toggle>
          <Button onClick={() => router.push(back)}>Close</Button>
        </div>
        <div className="grid gap-4 px-5 pb-3 pt-4 md:grid-cols-[1fr_280px]">
          <div>
            <h1 className="font-serif text-[24px] font-medium leading-tight">{d.title}</h1>
            <p className="mt-1.5 max-w-[72ch] text-[14px] leading-relaxed text-ink-2">{d.desc}</p>
          </div>
          <p className="self-end text-[12.5px] leading-snug text-mute">
            Schematic, not to scale. Hover a box to trace its connections. The {linked} boxes with a solid outline open that part in 3D. Values marked ≈ are typical, not this ship’s settings. Pipe colours follow ISO 14726.
          </p>
        </div>
        <div className="overflow-x-auto px-3 pb-4">
          <div className="min-w-[760px]">
            <FlowDiagram d={d} animate={animate} highlight={from} onNode={(part) => router.push(partHref(part, modeForPart(part, mode)))} />
          </div>
        </div>
      </article>
    </div>
  );
}
