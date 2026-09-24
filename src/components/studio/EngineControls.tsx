'use client';
import { useEffect, useRef } from 'react';
import { FIRING_ORDER } from '@/lib/models/engine-model';
import { runtime } from '@/lib/runtime';
import { useStudio } from '@/lib/store';
import { Button, Slider } from '../ui';

const PHI = (k: number) => -FIRING_ORDER.indexOf(k) * 2 * Math.PI / 7;

export default function EngineControls() {
  const s = useStudio();
  const ro = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (ro.current) ro.current.textContent = `${runtime.deg.toFixed(0).padStart(3, '\u2007')}°  firing: cyl ${runtime.firing ?? '–'}`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);
  const setExplode = (v: number, cyl = s.exCyl) => {
    if (v > 0) { runtime.theta = -PHI(cyl); s.set({ explode: v / 100, exCyl: cyl, running: false }); }
    else s.set({ explode: 0, exCyl: cyl });
  };
  return (
    <section aria-label="Engine controls" className="flex flex-col gap-3.5 border-b border-rule px-3.5 pb-4 pt-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-[16px] font-medium">Engine controls</h2>
        <Button variant={s.running ? 'line' : 'ink'} className="h-7 px-2.5 text-[12.5px]" onClick={() => s.toggle('running')}>{s.running ? 'Pause' : 'Run'}</Button>
      </div>
      <div className="rounded-[5px] bg-paper px-2.5 py-2 font-mono text-[12px] leading-relaxed text-ink tnum">
        <div className="flex justify-between"><span className="text-mute">Crank angle</span><span ref={ro} /></div>
        <div className="flex justify-between"><span className="text-mute">Firing order</span><span>{FIRING_ORDER.join('-')}</span></div>
      </div>
      <Slider id="rpm" label="Display speed" min={0.5} max={24} step={0.5} value={s.rpm} onChange={(v) => s.set({ rpm: v })} display={`${s.rpm} r/min`} />
      <p className="-mt-2 text-[11.5px] text-mute">Slowed down so you can follow it. The real speed at the chosen load is shown in the cycle panel.</p>
      <Slider id="cut" label="Section cut, exhaust side" min={0} max={100} value={s.cut} onChange={(v) => s.set({ cut: v })} display={s.cut === 0 ? 'off' : s.cut === 100 ? 'centreline' : `${s.cut} %`} />
      <div className="flex flex-col gap-1.5">
        <Slider id="exp" label="Explode one cylinder unit" min={0} max={100} value={Math.round(s.explode * 100)} onChange={(v) => setExplode(v)} display={`${Math.round(s.explode * 100)} %`} />
        <label className="flex items-center justify-between text-[12px] text-ink-2">Cylinder
          <select value={s.exCyl} onChange={(e) => setExplode(Math.round(s.explode * 100), +e.target.value)} className="rounded border border-rule bg-sheet px-1.5 py-0.5 text-[12.5px]">
            {Array.from({ length: 7 }, (_, i) => <option key={i} value={i + 1}>No. {i + 1}</option>)}
          </select>
        </label>
      </div>
      <p className="text-[11.5px] leading-snug text-mute">Cylinder 1 is taken at the fore (free) end. Builders number differently, so check the engine plate on board.</p>
    </section>
  );
}
