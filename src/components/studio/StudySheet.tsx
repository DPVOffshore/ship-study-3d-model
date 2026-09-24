'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CHAPTER, KB_BY_ID, REF, SOURCES, SYSTEMS } from '@/lib/kb';
import { DIAGRAM_BY_ID } from '@/lib/diagrams';
import { navState } from '@/lib/navstate';
import { partHref } from '@/lib/nav';
import { hasMeshes } from '@/lib/runtime';
import { useStudio, type Depth } from '@/lib/store';
import { Button, ConfBadge, Segmented } from '../ui';

const DEPTHS: { v: Depth; label: string; title: string }[] = [
  { v: 1, label: 'Essentials', title: 'What it is, what it does, where it is' },
  { v: 2, label: 'Engineer', title: 'Adds key data and operating checks' },
  { v: 3, label: 'Expert', title: 'Adds design detail, rule references and sources' },
];

export default function StudySheet() {
  const router = useRouter();
  const sel = useStudio((s) => s.sel), mode = useStudio((s) => s.mode), depth = useStudio((s) => s.depth), iso = useStudio((s) => s.iso);
  const st = useStudio();
  const x = sel ? KB_BY_ID[sel] : null;
  if (!x) return null;
  const sys = SYSTEMS.find((s) => s.id === x.sys);
  const dia = x.diagram ? DIAGRAM_BY_ID[x.diagram] : null;
  const other = mode === 'ship' ? 'engine' : 'ship';
  const inOther = hasMeshes(x.id, other);
  const close = () => { navState.fly = false; router.replace(`/${mode}/`, { scroll: false }); };
  const sources = (x.src ?? []).map((k) => ({ k, s: SOURCES[k] })).filter((o) => o.s);

  return (
    <aside aria-label="Study card" className="sheet scroll-thin fixed inset-x-2.5 bottom-2.5 z-20 max-h-[55vh] overflow-y-auto rounded-[8px] md:inset-x-auto md:bottom-auto md:right-2.5 md:top-[62px] md:max-h-[calc(100vh-72px)] md:w-[384px]">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-rule-2 bg-sheet/95 px-4 py-2 backdrop-blur">
        <Segmented size="sm" label="Depth of detail" value={depth} options={DEPTHS} onChange={(v) => st.set({ depth: v })} />
        <button type="button" onClick={close} aria-label="Close study card" className="rounded p-1 text-mute hover:bg-rule-2 hover:text-ink">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.6" /></svg>
        </button>
      </div>

      <div className="px-4 pb-4 pt-3.5">
        <p className="text-[12.5px] text-mute"><span className="font-mono tnum">{REF[x.id]}</span>&ensp;{sys?.name}</p>
        <h2 className="mt-0.5 font-serif text-[23px] font-medium leading-tight text-ink [text-wrap:balance]">{x.name}</h2>
        <div className="mt-2"><ConfBadge conf={x.conf} /></div>

        <p className="mt-3.5 text-[14px] leading-relaxed text-ink [text-wrap:pretty]">{x.fn}</p>
        <h3 className="mt-4 text-[12.5px] font-semibold text-ink-2">Where it is</h3>
        <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-2">{x.loc}</p>

        {depth >= 2 && x.spec.length > 0 && (
          <>
            <h3 className="mt-4 text-[12.5px] font-semibold text-ink-2">Key data</h3>
            <table className="mt-1 w-full border-collapse text-[12.5px]">
              <tbody>
                {x.spec.map(([k, v]) => (
                  <tr key={k} className="border-t border-rule-2 align-top">
                    <th scope="row" className="w-[42%] py-1.5 pr-2 text-left font-normal text-mute">{k}</th>
                    <td className="py-1.5 font-mono text-[12px] text-ink tnum">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {depth >= 2 && x.ops.length > 0 && (
          <>
            <h3 className="mt-4 text-[12.5px] font-semibold text-ink-2">Operation and checks</h3>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-[13.5px] leading-relaxed marker:text-rule">
              {x.ops.map((o) => <li key={o}>{o}</li>)}
            </ul>
          </>
        )}
        {depth >= 3 && (
          x.deep?.length ? (
            <div className="mt-4 border-l-2 border-blue pl-3">
              <h3 className="text-[12.5px] font-semibold text-blue">Expert notes</h3>
              <ul className="mt-1 space-y-2 text-[13.5px] leading-relaxed text-ink">
                {x.deep.map((o) => <li key={o}>{o}</li>)}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-[12.5px] text-mute">No expert notes for this part yet. The key data above is the full published detail.</p>
          )
        )}
        {depth === 1 && <p className="mt-4 text-[12.5px] text-mute">Switch to Engineer for key data and operating checks.</p>}

        <div className="mt-5 flex flex-wrap gap-1.5">
          {x.engine && mode === 'ship' && <Button variant="ink" onClick={() => router.push(partHref(x.id === 'main_engine' ? 'main_engine' : x.id, 'engine'))}>Open in engine view</Button>}
          {mode === 'engine' && inOther && <Button onClick={() => router.push(partHref(x.id, 'ship'))}>Show on the ship</Button>}
          {dia && <Button onClick={() => router.push(`/diagrams/${dia.id}/?from=${x.id}`)}>Diagram: {dia.title.replace(/ system$/, '')}</Button>}
          <Button aria-pressed={iso === x.sys} onClick={() => st.set({ iso: iso === x.sys ? null : x.sys })}>{iso === x.sys ? 'Show all systems' : `Isolate chapter ${CHAPTER[x.sys]}`}</Button>
          <Button variant="ghost" onClick={() => st.fly()}>Zoom to part</Button>
        </div>

        {/* Title block, as on a drawing */}
        <dl className="mt-5 grid grid-cols-[auto_1fr] border border-rule text-[12px]">
          <dt className="border-b border-r border-rule px-2 py-1 text-mute">Ref.</dt><dd className="border-b border-rule px-2 py-1 font-mono tnum">{REF[x.id]}</dd>
          <dt className="border-b border-r border-rule px-2 py-1 text-mute">Chapter</dt><dd className="border-b border-rule px-2 py-1">{CHAPTER[x.sys]} {sys?.name}</dd>
          <dt className="border-r border-rule px-2 py-1 text-mute">Basis</dt>
          <dd className="px-2 py-1">
            {sources.length ? (
              <ul className="space-y-0.5">{sources.map(({ k, s }) => <li key={k}>{s.url ? <a className="text-blue underline decoration-rule underline-offset-2 hover:decoration-blue" href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title}<span className="text-mute">, {s.org}{s.year ? ` ${s.year}` : ''}</span></li>)}</ul>
            ) : <span className="text-mute">General marine-engineering practice; see <Link className="text-blue underline decoration-rule underline-offset-2" href="/#sources">sources</Link>.</span>}
          </dd>
        </dl>
      </div>
    </aside>
  );
}
