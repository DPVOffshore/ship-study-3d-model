'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KB, REF, SYSTEMS } from '@/lib/kb';
import { modeForPart, partHref } from '@/lib/nav';
import { hasMeshes } from '@/lib/runtime';
import { useStudio } from '@/lib/store';
import { Segmented, Toggle, cx } from '../ui';
import EngineControls from './EngineControls';

export default function SystemIndex() {
  const router = useRouter();
  const mode = useStudio((s) => s.mode), sel = useStudio((s) => s.sel), iso = useStudio((s) => s.iso), ready = useStudio((s) => s.ready);
  const indexOpen = useStudio((s) => s.indexOpen);
  const st = useStudio();
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  useEffect(() => { if (mode === 'engine') setOpen((o) => new Set(o).add('engine')); }, [mode]);
  const selSys = sel ? KB.find((k) => k.id === sel)?.sys : null;
  useEffect(() => { if (selSys) setOpen((o) => (o.has(selSys) ? o : new Set(o).add(selSys))); }, [selSys]);

  const groups = useMemo(() => SYSTEMS.map((s, i) => {
    const items = KB.filter((k) => k.sys === s.id).filter((k) => !ready || hasMeshes(k.id, 'ship') || hasMeshes(k.id, 'engine'));
    return { s, n: i + 1, items };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [ready]);

  const go = (id: string) => {
    router.push(partHref(id, modeForPart(id, mode)), { scroll: false });
    st.set({ indexOpen: false });
  };
  const isolate = (sys: string) => {
    const on = iso !== sys;
    const patch: Parameters<typeof st.set>[0] = { iso: on ? sys : null };
    if (on && mode === 'ship' && ['engine', 'aux', 'tanks', 'electrical'].includes(sys)) { patch.xray = true; if (sys === 'tanks') patch.tanks = true; }
    st.set(patch);
  };

  return (
    <>
      {indexOpen && <button aria-label="Close contents" className="fixed inset-0 z-30 bg-ink/30 lg:hidden" onClick={() => st.set({ indexOpen: false })} />}
      <aside aria-label="Contents"
        className={cx('sheet scroll-thin fixed bottom-2.5 left-2.5 top-[62px] z-40 w-[296px] overflow-y-auto rounded-[8px] transition-transform lg:z-20 lg:translate-x-0',
          indexOpen ? 'translate-x-0' : '-translate-x-[110%]')}>
        {mode === 'engine' && <EngineControls />}
        {mode === 'ship' && (
          <div className="flex flex-wrap gap-1.5 border-b border-rule px-3.5 py-3 xl:hidden" role="group" aria-label="Ship layers">
            <Toggle on={st.xray} onClick={() => st.toggle('xray')}>X-ray hull</Toggle>
            <Toggle on={st.tanks} onClick={() => st.set({ tanks: !st.tanks, xray: !st.tanks ? true : st.xray })}>Tanks</Toggle>
            <Toggle on={st.cargo} onClick={() => st.toggle('cargo')}>Deck cargo</Toggle>
            <Toggle on={st.sea} onClick={() => st.toggle('sea')}>Sea</Toggle>
          </div>
        )}
        <div className="px-3.5 pb-1 pt-3">
          <h2 className="font-serif text-[16px] font-medium">Contents</h2>
          <p className="text-[12px] text-mute">{KB.length} parts in {SYSTEMS.length} chapters. Isolate a chapter to fade everything else.</p>
        </div>
        <ol className="pb-2">
          {groups.map(({ s, n, items }) => {
            const isOpen = open.has(s.id);
            return (
              <li key={s.id} className="border-t border-rule-2">
                <div className="flex items-center gap-2 px-3.5 py-2 hover:bg-rule-2/60">
                  <button type="button" aria-expanded={isOpen} className="flex min-w-0 flex-1 items-baseline gap-2 text-left"
                    onClick={() => setOpen((o) => { const x = new Set(o); if (x.has(s.id)) x.delete(s.id); else x.add(s.id); return x; })}>
                    <span className="w-5 shrink-0 font-mono text-[11.5px] text-mute tnum">{n}</span>
                    <span className="truncate text-[13.5px] font-medium">{s.name}</span>
                    <span className="ml-auto font-mono text-[11px] text-mute tnum">{items.length}</span>
                  </button>
                  <button type="button" aria-pressed={iso === s.id} onClick={() => isolate(s.id)}
                    className={cx('rounded-[4px] border px-1.5 py-0.5 text-[11px]', iso === s.id ? 'border-blue bg-blue text-white' : 'border-rule text-ink-2 hover:border-ink-2')}>
                    Isolate
                  </button>
                </div>
                {isOpen && (
                  <div className="pb-2">
                    <p className="px-3.5 pb-1.5 pl-[42px] text-[12px] leading-snug text-mute">{s.desc}</p>
                    <ul>
                      {items.map((k) => {
                        const here = !ready || hasMeshes(k.id, mode);
                        const current = sel === k.id;
                        return (
                          <li key={k.id}>
                            <button type="button" onClick={() => go(k.id)} aria-current={current ? 'true' : undefined}
                              className={cx('flex w-full items-baseline gap-2 py-1 pl-[42px] pr-3.5 text-left text-[13px] leading-snug',
                                current ? 'bg-red-wash text-red' : here ? 'text-ink hover:bg-rule-2/70' : 'text-mute hover:bg-rule-2/70')}>
                              <span className={cx('w-9 shrink-0 font-mono text-[11px] tnum', current ? 'text-red' : 'text-mute')}>{REF[k.id]}</span>
                              <span className="min-w-0 flex-1">{k.name}</span>
                              {!here && <span className="shrink-0 text-[11px] text-mute">{mode === 'ship' ? 'engine view' : 'ship view'}</span>}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <div className="flex items-center justify-between border-t border-rule px-3.5 py-2.5 text-[12px] text-ink-2">
          <span>Graphics</span>
          <Segmented size="sm" label="Graphics quality" value={st.quality} onChange={(v) => st.set({ quality: v })}
            options={[{ v: 'high', label: 'High', title: 'Soft shadows, full resolution' }, { v: 'low', label: 'Fast', title: 'No shadows, lower resolution: for phones and older laptops' }]} />
        </div>
      </aside>
    </>
  );
}
