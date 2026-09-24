'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStudio } from '@/lib/store';
import { Kbd, Toggle, cx } from '../ui';

const TABS = [
  { href: '/ship/', label: 'Ship', match: '/ship' },
  { href: '/engine/', label: 'Main engine', match: '/engine' },
  { href: '/diagrams/fo/', label: 'Flow diagrams', match: '/diagrams' },
];

export default function TopBar() {
  const pathname = usePathname();
  const mode = useStudio((s) => s.mode);
  const s = useStudio();
  const inDiagrams = pathname.startsWith('/diagrams');
  return (
    <header className="sheet fixed inset-x-0 top-0 z-30 flex h-[52px] items-center gap-3 border-x-0 border-t-0 px-3 md:gap-5 md:px-4">
      <button type="button" className="rounded p-1.5 text-ink-2 hover:bg-rule-2 lg:hidden" aria-label="Open contents" onClick={() => s.toggle('indexOpen')}>
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden><path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.6" /></svg>
      </button>
      <Link href="/" className="hidden min-w-0 flex-col leading-tight sm:flex" title="Back to the cover sheet">
        <span className="font-serif text-[15.5px] font-medium text-ink">Container ship study guide</span>
        <span className="truncate text-[11.5px] text-mute">2,806 TEU geared feeder with MAN B&amp;W 7G60ME-C9.5</span>
      </Link>
      <nav aria-label="Mode" className="flex rounded-[6px] bg-rule-2 p-0.5">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.match);
          return (
            <Link key={t.href} href={t.href} aria-current={active ? 'page' : undefined}
              className={cx('rounded-[5px] px-2.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors md:px-3',
                active ? 'bg-sheet text-ink shadow-[0_0_0_1px_var(--color-rule)]' : 'text-mute hover:text-ink')}>
              {t.label}
            </Link>
          );
        })}
      </nav>
      {mode === 'ship' && !inDiagrams && (
        <div className="hidden items-center gap-1.5 xl:flex" role="group" aria-label="Ship layers">
          <Toggle on={s.xray} onClick={() => s.toggle('xray')}>X-ray hull</Toggle>
          <Toggle on={s.tanks} onClick={() => s.set({ tanks: !s.tanks, xray: !s.tanks ? true : s.xray })}>Tanks</Toggle>
          <Toggle on={s.cargo} onClick={() => s.toggle('cargo')}>Deck cargo</Toggle>
          <Toggle on={s.sea} onClick={() => s.toggle('sea')}>Sea</Toggle>
        </div>
      )}
      <div className="flex-1" />
      <button type="button" onClick={() => s.set({ paletteOpen: true })}
        className="flex h-8 items-center gap-2 rounded-[6px] border border-rule bg-paper px-2.5 text-[13px] text-mute hover:border-ink-2 hover:text-ink">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><circle cx="6" cy="6" r="4.3" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M9.2 9.2 13 13" stroke="currentColor" strokeWidth="1.4" /></svg>
        <span className="hidden sm:inline">Find a part</span>
        <span className="hidden md:inline"><Kbd>Ctrl K</Kbd></span>
      </button>
    </header>
  );
}
