import Link from 'next/link';
import ShipElevation from '@/components/cover/ShipElevation';
import { DIAGRAMS } from '@/lib/diagrams';
import { KB, SOURCES, SYSTEMS } from '@/lib/kb';

const CONF = {
  published: ['bg-conf-pub-bg text-conf-pub', 'Published'],
  typical: ['bg-conf-typ-bg text-conf-typ', 'Typical'],
  estimated: ['bg-conf-est-bg text-conf-est', 'Estimated'],
} as const;
type C = keyof typeof CONF;
const Badge = ({ c }: { c: C }) => <span className={`rounded-[3px] px-1.5 py-0.5 text-[11.5px] font-medium ${CONF[c][0]}`}>{CONF[c][1]}</span>;

const PARTICULARS: [string, string, C][] = [
  ['Length overall', '186.0 m', 'published'],
  ['Breadth, moulded', '35.6 m', 'published'],
  ['Depth, moulded', '17.9 m', 'published'],
  ['Design draught', '11.0 m', 'published'],
  ['Gross tonnage', '33,700', 'published'],
  ['Container capacity', '2,806 TEU, 600 reefer sockets', 'published'],
  ['Cargo gear', '3 deck cranes, jib ≈ 32 m', 'published'],
  ['Main engine', 'MAN B&W 7G60ME-C9.5, taken from the gearless sister', 'estimated'],
  ['Engine rating, L1', '18,760 kW at 97 r/min', 'published'],
  ['Design port', 'Chittagong, Bangladesh (“Chittagong Max”)', 'published'],
];

export default function Cover() {
  const published = KB.filter((k) => k.conf === 'published').length;
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-[1240px] items-center justify-between px-5 pt-5 md:px-8">
        <p className="font-serif text-[15.5px] font-medium">Container ship study guide</p>
        <Link href="/ship/" className="rounded-[5px] bg-ink px-3.5 py-2 text-[13.5px] font-medium text-white hover:bg-ink-2">Open the 3D model</Link>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 md:px-8">
        <section className="pb-6 pt-10 md:pt-14">
          <h1 className="max-w-[18ch] font-serif text-[40px] font-normal leading-[1.08] tracking-[-0.01em] text-ink md:text-[58px]">
            One feeder ship, taken apart for study
          </h1>
          <p className="mt-4 max-w-[62ch] text-[16.5px] leading-relaxed text-ink-2">
            A 2,806 TEU geared container ship and its MAN B&amp;W 7G60ME-C9.5 main engine, modelled in 3D from published particulars. Pick any of its {KB.length} parts and read what it does, where it is and how it is checked, at the depth you need: essentials for cadets, key data for watchkeepers, design detail for seniors.
          </p>
        </section>

        <section aria-label="Ship elevation" className="border-y border-rule py-6">
          <ShipElevation />
        </section>

        <div className="grid gap-10 py-10 lg:grid-cols-[1.25fr_1fr]">
          <section aria-labelledby="register">
            <h2 id="register" className="font-serif text-[22px] font-medium">Drawing register</h2>
            <p className="mt-1 text-[14px] text-mute">Every sheet is live. Parts link across sheets, so a box on a flow diagram opens the same part in 3D.</p>
            <table className="mt-4 w-full border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-ink text-left text-[12.5px] text-mute">
                  <th className="w-14 py-2 font-medium">Sheet</th><th className="py-2 font-medium">Title</th><th className="hidden py-2 font-medium sm:table-cell">What you can do</th>
                </tr>
              </thead>
              <tbody>
                <Row n="1" href="/ship/" title="Ship, general arrangement" what={`X-ray the hull, show tanks, hide deck cargo, isolate any of ${SYSTEMS.length} chapters.`} />
                <Row n="2" href="/engine/" title="Main engine, 7G60ME-C9.5" what="Watch it run in firing order, cut it open on the centreline, explode one cylinder unit." />
                <Row n="3" href="/engine/" title="Engine cycle and load diagram" what="Change load, injection timing and SMCR; watch the P–V loop, Pmax and SFOC respond." />
                {DIAGRAMS.map((d, i) => (
                  <Row key={d.id} n={`4.${i + 1}`} href={`/diagrams/${d.id}/`} title={d.title} what={i === 0 ? 'Animated schematics in ISO 14726 colours. Hover to trace a line; click a box to find it in 3D.' : ''} />
                ))}
              </tbody>
            </table>
          </section>

          <section aria-labelledby="particulars">
            <h2 id="particulars" className="font-serif text-[22px] font-medium">Principal particulars</h2>
            <p className="mt-1 text-[14px] text-mute">Tsuneishi 2,806 TEU geared type. Each figure is marked with how sure we are.</p>
            <table className="mt-4 w-full border-collapse text-[14px]">
              <tbody>
                {PARTICULARS.map(([k, v, c]) => (
                  <tr key={k} className="border-t border-rule align-baseline">
                    <th scope="row" className="py-2 pr-3 text-left font-normal text-mute">{k}</th>
                    <td className="py-2 pr-3 font-mono text-[13px] tnum">{v}</td>
                    <td className="py-2 text-right"><Badge c={c} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <section id="sources" aria-labelledby="src" className="grid gap-8 border-t border-rule py-10 md:grid-cols-2">
          <div>
            <h2 id="src" className="font-serif text-[22px] font-medium">How sure is each figure?</h2>
            <dl className="mt-4 space-y-3 text-[14px] leading-relaxed">
              <div><dt><Badge c="published" /></dt><dd className="mt-1 text-ink-2">From the builder, MAN’s project guide or an IMO instrument. {published} parts carry this mark.</dd></div>
              <div><dt><Badge c="typical" /></dt><dd className="mt-1 text-ink-2">Normal practice for this ship type and engine. Right in principle; the ship’s own settings may differ.</dd></div>
              <div><dt><Badge c="estimated" /></dt><dd className="mt-1 text-ink-2">Our assumption where nothing is published: hull lines, tank layout, engine-room arrangement, the cylinder distance and con-rod length, and all values in the cycle model marked as estimated.</dd></div>
            </dl>
            <p className="mt-5 text-[13.5px] leading-relaxed text-mute">For study only. Always follow the ship’s own manuals, the engine maker’s instructions and your company’s procedures.</p>
          </div>
          <div>
            <h2 className="font-serif text-[22px] font-medium">Sources</h2>
            <ul className="mt-4 space-y-2.5 text-[14px] leading-snug">
              {Object.entries(SOURCES).map(([k, s]) => (
                <li key={k}>
                  {s.url ? <a href={s.url} className="text-blue underline decoration-rule underline-offset-2 hover:decoration-blue" target="_blank" rel="noreferrer">{s.title}</a> : <span>{s.title}</span>}
                  <span className="text-mute">. {s.org}{s.year ? `, ${s.year}` : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

function Row({ n, href, title, what }: { n: string; href: string; title: string; what: string }) {
  return (
    <tr className="group border-t border-rule align-baseline">
      <td className="py-2.5 font-mono text-[13px] text-mute tnum">{n}</td>
      <td className="py-2.5 pr-3"><Link href={href} className="font-medium text-ink underline decoration-rule underline-offset-[3px] group-hover:decoration-red">{title}</Link></td>
      <td className="hidden py-2.5 text-[13.5px] text-ink-2 sm:table-cell">{what}</td>
    </tr>
  );
}
