import raw from './data/kb.json';

export type Confidence = 'published' | 'typical' | 'estimated';
export type DiagramId = 'fo' | 'cw' | 'lo' | 'air' | 'bb' | 'sa' | 'el';
export interface KBEntry {
  id: string;
  sys: string;
  name: string;
  match: string[];
  fn: string;
  spec: [string, string][];
  loc: string;
  ops: string[];
  conf: Confidence;
  engine?: boolean;
  diagram?: DiagramId;
  deep?: string[];
  src?: string[];
}
export interface SystemDef { id: string; name: string; desc: string; engine?: boolean }
export interface Source { title: string; org: string; year?: number; url?: string }

export const SYSTEMS = raw.systems as SystemDef[];
export const KB = raw.entries as KBEntry[];
export const SOURCES = raw.sources as Record<string, Source>;
export const KB_BY_ID: Record<string, KBEntry> = Object.fromEntries(KB.map(e => [e.id, e]));

/** Manual-style reference number: chapter = system order, item = order within the system. */
export const REF: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  SYSTEMS.forEach((s, si) => {
    KB.filter(k => k.sys === s.id).forEach((k, ki) => { out[k.id] = `${si + 1}.${String(ki + 1).padStart(2, '0')}`; });
  });
  return out;
})();
export const CHAPTER: Record<string, number> = Object.fromEntries(SYSTEMS.map((s, i) => [s.id, i + 1]));

// Name matcher: exact names first, then regexes in declaration order (order matters).
const exact = new Map<string, KBEntry>();
const regex: [RegExp, KBEntry][] = [];
for (const x of KB) for (const m of x.match) {
  if (m.startsWith('/')) regex.push([new RegExp(m.slice(1, m.lastIndexOf('/'))), x]);
  else if (!exact.has(m)) exact.set(m, x);
}
export function matchName(name?: string | null): KBEntry | null {
  if (!name) return null;
  const e = exact.get(name);
  if (e) return e;
  for (const [re, x] of regex) if (re.test(name)) return x;
  return null;
}

export const CONF_LABEL: Record<Confidence, string> = {
  published: 'Published or regulation data',
  typical: 'Typical practice for this ship type',
  estimated: 'Estimated for this model',
};
