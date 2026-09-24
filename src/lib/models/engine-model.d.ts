import type * as THREE_NS from 'three';
export declare const ENGINE_SPEC: { type: string; cyl: number; bore: number; stroke: number; A: number; rod: number; rpm: number; kWcyl: number };
export declare const FIRING_ORDER: number[];
export interface EngineBuild {
  root: THREE_NS.Group;
  M: Record<string, THREE_NS.MeshStandardMaterial>;
  update(theta: number, explode?: number, exCyl?: number, dt?: number): { firing?: number; deg: number };
  tdcTheta(k: number): number;
  units: { k: number; x: number; phi: number }[];
  state: { theta: number; tcSpeed: number };
}
export declare function buildEngine(THREE: typeof THREE_NS, clipPlane: THREE_NS.Plane): EngineBuild;
