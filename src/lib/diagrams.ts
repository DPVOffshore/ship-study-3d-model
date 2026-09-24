import raw from './data/diagrams.json';
import type { DiagramId } from './kb';

export interface DNode { id: string; x: number; y: number; w: number; h: number; label: string; sub?: string; part?: string | null }
export type DLink = [string, string, string, [number, number][]?];
export interface Diagram { id: DiagramId; title: string; desc: string; nodes: DNode[]; links: DLink[] }
/** [colour, label, dasharray?] — ISO 14726 pipe identification colours */
export const MEDIA = raw.media as unknown as Record<string, [string, string, string?]>;
export const DIAGRAMS = raw.diagrams as unknown as Diagram[];
export const DIAGRAM_BY_ID = Object.fromEntries(DIAGRAMS.map(d => [d.id, d])) as Record<DiagramId, Diagram>;
export const SHORT_TITLE: Record<string, string> = {
  fo: 'Fuel oil', cw: 'Central cooling', lo: 'Lubricating oil', air: 'Air & exhaust', bb: 'Ballast & bilge', sa: 'Starting air', el: 'Electrical',
};
/** Relative flow speed per medium, used for the animated dashes (seconds per dash cycle; lower is faster). */
export const FLOW_SPEED: Record<string, number> = {
  fo: 1.6, ret: 2.2, lo: 1.4, cyl: 2.6, servo: 0.7, ht: 1.2, lt: 1.2, sw: 1.0, air: 0.8, exh: 0.6, ballast: 1.3, bilge: 2.4, el: 0.35, mech: 0.5,
};
