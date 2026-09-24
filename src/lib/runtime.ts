// Mutable, per-frame values shared between the 3D loop and HTML readouts without React re-renders.
import type { Mesh } from 'three';
import type { Mode } from './store';

export const runtime = {
  theta: 0, // crank angle, rad
  deg: 0,
  firing: undefined as number | undefined,
  index: null as null | Record<Mode, Map<string, Mesh[]>>,
  listeners: new Set<() => void>(),
};
export function hasMeshes(id: string, mode: Mode) { return !!runtime.index?.[mode].get(id)?.length; }
