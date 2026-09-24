import type * as THREE_NS from 'three';
export declare const SPEC: { LOA: number; B: number; D: number; T: number };
export declare function buildShip(THREE: typeof THREE_NS): {
  root: THREE_NS.Group;
  M: Record<string, THREE_NS.MeshStandardMaterial>;
  xray: THREE_NS.MeshStandardMaterial[];
  tanks: THREE_NS.Object3D;
  SPEC: typeof SPEC;
};
