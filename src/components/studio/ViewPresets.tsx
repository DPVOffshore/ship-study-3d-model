'use client';
import { ENG_VIEWS, SHIP_VIEWS } from '@/lib/views';
import { useStudio } from '@/lib/store';

export default function ViewPresets() {
  const mode = useStudio((s) => s.mode), goView = useStudio((s) => s.goView), sel = useStudio((s) => s.sel);
  const V = mode === 'engine' ? ENG_VIEWS : SHIP_VIEWS;
  return (
    <nav aria-label="Camera views"
      className={`scroll-thin fixed left-2.5 right-2.5 top-[62px] z-10 overflow-x-auto lg:left-[316px] ${sel ? 'md:right-[404px]' : ''}`}>
      <div className="sheet inline-flex items-center gap-1 rounded-[8px] p-1">
        <span className="px-1.5 text-[12px] text-mute">View</span>
        {Object.keys(V).map((k) => (
          <button key={k} type="button" onClick={() => goView(k)}
            className="h-7 whitespace-nowrap rounded-[5px] px-2.5 text-[12.5px] text-ink hover:bg-rule-2" title={V[k][2] ? 'Switches on x-ray' : undefined}>
            {k}
          </button>
        ))}
      </div>
    </nav>
  );
}
