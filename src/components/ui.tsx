'use client';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { Confidence } from '@/lib/kb';
import { CONF_LABEL } from '@/lib/kb';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/** Toggle chip: outlined when off, filled ink when on. */
export function Toggle({ on, children, className, ...rest }: { on: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-pressed={on} {...rest}
      className={cx('h-7 rounded-[5px] border px-2.5 text-[12.5px] leading-none whitespace-nowrap transition-colors',
        on ? 'border-ink bg-ink text-white' : 'border-rule bg-sheet text-ink hover:border-ink-2', className)}>
      {children}
    </button>
  );
}

export function Button({ variant = 'line', className, children, ...rest }: { variant?: 'ink' | 'line' | 'ghost' } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...rest}
      className={cx('inline-flex h-8 items-center gap-1.5 rounded-[5px] px-3 text-[13px] font-medium transition-colors disabled:opacity-40',
        variant === 'ink' && 'bg-ink text-white hover:bg-ink-2',
        variant === 'line' && 'border border-rule bg-sheet text-ink hover:border-ink',
        variant === 'ghost' && 'text-ink-2 hover:bg-rule-2', className)}>
      {children}
    </button>
  );
}

export function Segmented<T extends string | number>({ value, options, onChange, label, size = 'md' }: { value: T; options: { v: T; label: string; title?: string }[]; onChange: (v: T) => void; label: string; size?: 'sm' | 'md' }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[6px] bg-rule-2 p-0.5">
      {options.map((o) => (
        <button key={String(o.v)} type="button" role="radio" aria-checked={value === o.v} title={o.title} onClick={() => onChange(o.v)}
          className={cx('rounded-[5px] font-medium transition-colors whitespace-nowrap', size === 'sm' ? 'px-2 py-1 text-[12px]' : 'px-3 py-1.5 text-[13px]',
            value === o.v ? 'bg-sheet text-ink shadow-[0_0_0_1px_var(--color-rule)]' : 'text-mute hover:text-ink')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

const CONF_CLS: Record<Confidence, string> = {
  published: 'bg-conf-pub-bg text-conf-pub',
  typical: 'bg-conf-typ-bg text-conf-typ',
  estimated: 'bg-conf-est-bg text-conf-est',
};
export function ConfBadge({ conf, short }: { conf: Confidence; short?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-[3px] px-1.5 py-0.5 text-[11.5px] font-medium', CONF_CLS[conf])} title={CONF_LABEL[conf]}>
      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {short ? conf[0].toUpperCase() + conf.slice(1) : CONF_LABEL[conf]}
    </span>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, display, id }: { label: ReactNode; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; display?: ReactNode; id: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-[12px]">
        <label htmlFor={id} className="text-ink-2">{label}</label>
        {display !== undefined && <span className="font-mono text-[11.5px] text-ink tnum">{display}</span>}
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full" />
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-[3px] border border-rule bg-paper px-1 font-mono text-[10.5px] text-mute">{children}</kbd>;
}
