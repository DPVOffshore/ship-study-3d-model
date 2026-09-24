'use client';
import { create } from 'zustand';
import type { Smcr } from './physics/cycle';

export type Mode = 'ship' | 'engine';
export type Depth = 1 | 2 | 3; // essentials, engineer, expert
export type Quality = 'high' | 'low';

/** Low quality on phones, weak CPUs, or when asked for with ?quality=low. */
function initialQuality(): Quality {
  if (typeof window === 'undefined') return 'high';
  const q = new URLSearchParams(window.location.search).get('quality');
  if (q === 'low' || q === 'high') return q;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  return coarse || (navigator.hardwareConcurrency ?? 8) <= 4 ? 'low' : 'high';
}

interface StudioState {
  mode: Mode;
  sel: string | null;
  iso: string | null;
  xray: boolean; tanks: boolean; cargo: boolean; sea: boolean;
  running: boolean; rpm: number; cut: number; explode: number; exCyl: number;
  depth: Depth;
  load: number; soi: number; smcr: Smcr; pmaxControl: boolean; cycleCyl: number; cycleOpen: boolean;
  flyNonce: number; view: { name: string; nonce: number } | null;
  paletteOpen: boolean; indexOpen: boolean; ready: boolean; quality: Quality;
  set: (p: Partial<StudioState>) => void;
  toggle: (k: 'xray' | 'tanks' | 'cargo' | 'sea' | 'running' | 'cycleOpen' | 'paletteOpen' | 'indexOpen' | 'pmaxControl') => void;
  fly: () => void;
  goView: (name: string) => void;
}

export const useStudio = create<StudioState>((set) => ({
  mode: 'ship', sel: null, iso: null,
  xray: false, tanks: false, cargo: true, sea: false,
  running: true, rpm: 6, cut: 100, explode: 0, exCyl: 1,
  depth: 2,
  load: 0.75, soi: -3, smcr: { pFrac: 1, nFrac: 1 }, pmaxControl: true, cycleCyl: 1, cycleOpen: true,
  flyNonce: 0, view: null,
  paletteOpen: false, indexOpen: false, ready: false, quality: initialQuality(),
  set: (p) => set(p),
  toggle: (k) => set((s) => ({ [k]: !s[k] } as Partial<StudioState>)),
  fly: () => set((s) => ({ flyNonce: s.flyNonce + 1 })),
  goView: (name) => set((s) => ({ view: { name, nonce: (s.view?.nonce ?? 0) + 1 } })),
}));

/** Hover tooltip state (kept separate so pointer moves don't re-render panels). */
export const useHover = create<{ label: string | null; x: number; y: number; set: (l: string | null, x?: number, y?: number) => void }>((set) => ({
  label: null, x: 0, y: 0, set: (label, x = 0, y = 0) => set({ label, x, y }),
}));
