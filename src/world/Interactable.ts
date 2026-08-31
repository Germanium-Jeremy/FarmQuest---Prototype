import * as THREE from 'three';

export interface Interactable {
  mesh: THREE.Object3D;
  interact(): void;
  isAvailable(): boolean;
  label: string;
  reset(): void;
}
