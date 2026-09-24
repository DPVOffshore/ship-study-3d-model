'use client';
import { useDeferredValue, useMemo, useState } from 'react';
import { clampSmcr, computeCycle, mepAt, PMAX_LIMIT, SFOC_PUBLISHED, TIMING } from '@/lib/physics/cycle';
import { useStudio } from '@/lib/store';
import { Segmented, Slider, Toggle, cx } from '../ui';
import { LoadDiagram, PThetaChart, PVChart } from './charts';

type Tab = 'pv' | 'pt' | 'load';

export default function CyclePanel() {
  const s = useStudio();
  const [tab, setTab] = useState<Tab>('pv');
  const [log, setLog] = useState(false);
  const [about, setAbout] = useState(false);
  const inputs = useDeferredValue({ load: s.load, soi: s.soi, smcr: s.smcr, pmaxControl: s.pmaxControl });
  const c = useMemo(() => computeCycle(inputs), [inputs]);
  const pub = SFOC_PUBLISHED.find((p) => Math.abs(p.load - s.load) < 0.02);
  const atL1 = s.smcr.pFrac === 1 && s.smcr.nFrac === 1;

  if (!s.cycleOpen) {
    return (
      <button type="button" onClick={() => s.toggle('cycleOpen')}
        className={cx('sheet fixed bottom-2.5 left-1/2 z-20 -translate-x-1/2 rounded-[8px] px-3.5 py-2 text-[13px] font-medium hover:border-ink-2 lg:left-[calc(50%+150px)]', s.sel && 'hidden md:block md:left-[calc(50%-40px)]')}>
        Show engine cycle and load diagram
      </button>
    );
  }

  const rows: [string, string][] = [
    ['Speed', `${c.rpm.toFixed(1)} r/min`],
    ['Power', `${(c.powerTotal / 1000).toFixed(2)} MW`],
    ['Effective MEP', `${c.bmep.toFixed(1)} bar`],
    ['Scavenge air', `${(c.pscav - 1.013).toFixed(2)} bar g`],
    ['Pcomp', `${c.pcomp.toFixed(0)} bar`],
    ['Pmax', `${c.pmax.toFixed(0)} bar at ${c.thPmax.toFixed(0)}°`],
    ['Injection start', `${c.soiUsed > 0 ? '+' : ''}${c.soiUsed.toFixed(1)}°${c.limited ? ' (retarded)' : ''}`],
    ['SFOC, model', `${c.sfoc.toFixed(1)} g/kWh`],
  ];

  return (
    <section aria-label="Engine cycle"
      className={cx('sheet @container fixed bottom-2.5 left-2.5 right-2.5 z-20 rounded-[8px] lg:left-[316px]', s.sel ? 'hidden md:block md:right-[404px]' : '')}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-rule-2 px-3.5 py-2">
        <h2 className="font-serif text-[16px] font-medium">Engine cycle</h2>
        <Segmented size="sm" label="Chart" value={tab} onChange={setTab} options={[{ v: 'pv', label: 'P–V diagram' }, { v: 'pt', label: 'Pressure vs crank' }, { v: 'load', label: 'Load diagram' }]} />
        {tab === 'pv' && <Toggle on={log} onClick={() => setLog(!log)} className="h-6 text-[12px]">Log scales</Toggle>}
        <label className="flex items-center gap-1.5 text-[12.5px] text-ink-2">Red dot follows
          <select value={s.cycleCyl} onChange={(e) => s.set({ cycleCyl: +e.target.value })} className="rounded border border-rule bg-sheet px-1 py-0.5 text-[12.5px]">
            {Array.from({ length: 7 }, (_, i) => <option key={i} value={i + 1}>cyl {i + 1}</option>)}
          </select>
        </label>
        <div className="flex-1" />
        <button type="button" onClick={() => setAbout(!about)} aria-expanded={about} className="text-[12.5px] text-blue underline decoration-rule underline-offset-2">About this model</button>
        <button type="button" onClick={() => s.toggle('cycleOpen')} aria-label="Hide engine cycle" className="rounded p-1 text-mute hover:bg-rule-2 hover:text-ink">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M3 5l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
        </button>
      </header>

      {about && (
        <div className="scroll-thin max-h-[40vh] overflow-y-auto border-b border-rule-2 bg-paper px-4 py-3 text-[12.5px] leading-relaxed text-ink-2">
          <p><strong className="font-semibold text-ink">What is published:</strong> bore 600 mm, stroke 2,790 mm, the L1–L4 layout points, MEP 21.0 bar at L1, and SFOC at 50/75/100 % load (MAN project guide).</p>
          <p className="mt-1.5"><strong className="font-semibold text-ink">What is estimated:</strong> a single-zone model integrates the first law of thermodynamics from exhaust-valve closing to opening (γ = 1.34), with a Wiebe heat-release curve. Con-rod length 3.1 m, compression ratio 19, valve and port timing (EVO {TIMING.evo}°, ports {TIMING.po}–{TIMING.pc}°, EVC {TIMING.evc}°), friction and scavenge pressure are assumptions. Scavenge pressure follows the shape of a published 6G60ME-C9.5 shop test.</p>
          <p className="mt-1.5"><strong className="font-semibold text-ink">ECS Pmax control:</strong> like the real engine control system, the model retards injection at high load to hold Pmax at about {PMAX_LIMIT} bar (estimated limit). That is why SFOC rises again towards 100 % load. Turn it off to see why the ECS exists.</p>
          <p className="mt-1.5">Heat transfer, gas exchange detail and the turbocharger are not modelled. Use it to understand trends, not to set up an engine.</p>
        </div>
      )}

      <div className="grid gap-x-4 gap-y-2 px-3.5 py-3 @2xl:grid-cols-[210px_minmax(0,1fr)] @5xl:grid-cols-[210px_minmax(0,1fr)_230px]">
        <div className="flex flex-col gap-3">
          <Slider id="load" label="Engine load" min={25} max={110} value={Math.round(s.load * 100)} onChange={(v) => s.set({ load: v / 100 })} display={`${Math.round(s.load * 100)} % SMCR`} />
          <Slider id="soi" label="Injection start" min={-8} max={4} step={0.5} value={s.soi} onChange={(v) => s.set({ soi: v })} display={`${s.soi > 0 ? '+' : ''}${s.soi}° ATDC`} />
          <Toggle on={s.pmaxControl} onClick={() => s.toggle('pmaxControl')} className="self-start">ECS Pmax control</Toggle>
          <details className="text-[12px]" open={!atL1 || s.depth === 3}>
            <summary className="cursor-pointer text-ink-2">SMCR point (derating)</summary>
            <div className="mt-2 flex flex-col gap-2.5">
              <Slider id="smcrn" label="Speed" min={74} max={100} value={Math.round(s.smcr.nFrac * 100)} onChange={(v) => s.set({ smcr: clampSmcr({ ...s.smcr, nFrac: v / 100 }) })} display={`${(97 * s.smcr.nFrac).toFixed(1)} r/min`} />
              <Slider id="smcrp" label="Power" min={56} max={100} value={Math.round(s.smcr.pFrac * 100)} onChange={(v) => s.set({ smcr: clampSmcr({ ...s.smcr, pFrac: v / 100 }) })} display={`${((18760 * s.smcr.pFrac) / 1000).toFixed(2)} MW`} />
              <p className="text-mute">MEP at SMCR: <span className="font-mono tnum text-ink">{mepAt(s.smcr).toFixed(1)} bar</span>. Kept inside the L1–L4 layout area.</p>
            </div>
          </details>
        </div>

        <div className="min-w-0">
          {tab === 'pv' && <PVChart c={c} cyl={s.cycleCyl} log={log} />}
          {tab === 'pt' && <PThetaChart c={c} cyl={s.cycleCyl} />}
          {tab === 'load' && <LoadDiagram smcr={s.smcr} load={s.load} />}
          <p className="mt-1 text-[11.5px] text-mute">
            {tab === 'pv' && 'Shaded area is the indicated work per cycle. Dashed: compression and expansion without combustion (motored).'}
            {tab === 'pt' && 'EVO/EVC: exhaust valve opens/closes. PO/PC: scavenge ports open/close. Dashed: motored pressure.'}
            {tab === 'load' && 'Numbered lines follow MAN’s load-diagram convention: 1 propeller curve through M, 3 speed limit, 4 torque/speed limit, 5 MEP limit, 6 light-running propeller, 7 power limit, 8 overload. Line 4’s exact position is engine-specific; drawn schematically.'}
          </p>
        </div>

        <dl className="grid grid-cols-[1fr_auto] content-start gap-x-3 text-[12.5px] @2xl:col-span-2 @2xl:grid-cols-[auto_1fr_auto_1fr_auto_1fr] @5xl:col-span-1 @5xl:grid-cols-[1fr_auto]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="border-t border-rule-2 py-1 text-mute">{k}</dt>
              <dd className="border-t border-rule-2 py-1 text-right font-mono text-[12px] text-ink tnum">{v}</dd>
            </div>
          ))}
          <dt className="border-t border-rule-2 py-1 text-mute">SFOC, MAN</dt>
          <dd className="border-t border-rule-2 py-1 text-right font-mono text-[12px] tnum">
            {pub && atL1 ? `${pub.g.toFixed(1)} g/kWh` : <span className="font-sans text-mute" title="Published at 50, 75 and 100 % load with SMCR at L1">at 50/75/100 %</span>}
          </dd>
        </dl>
      </div>
    </section>
  );
}
