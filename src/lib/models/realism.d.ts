import type * as THREE_NS from 'three';
export declare function applyRealism(THREE: typeof THREE_NS, renderer: THREE_NS.WebGLRenderer, scene: THREE_NS.Scene,
  ship: { root: THREE_NS.Object3D; M: Record<string, THREE_NS.MeshStandardMaterial> },
  eng: { root: THREE_NS.Object3D; M: Record<string, THREE_NS.MeshStandardMaterial> }): void;
