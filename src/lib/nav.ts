'use client';
import { KB_BY_ID } from './kb';
import { hasMeshes } from './runtime';
import type { Mode } from './store';

/** Which 3D mode can show this part (prefers the current mode). */
export function modeForPart(id: string, current: Mode): Mode {
  if (hasMeshes(id, current)) return current;
  const other: Mode = current === 'ship' ? 'engine' : 'ship';
  if (hasMeshes(id, other)) return other;
  return KB_BY_ID[id]?.sys === 'engine' && id !== 'main_engine' ? 'engine' : current;
}
export const partHref = (id: string, mode: Mode) => `/${mode}/?part=${encodeURIComponent(id)}`;
