import * as THREE from 'three';
import { Interactable } from './Interactable';

export class NPC implements Interactable {
  public mesh: THREE.Group;
  public label = 'Talk to NPC';
  private available = true;
  private onInteract: (() => void) | null = null;

  constructor(position: THREE.Vector3) {
    this.mesh = new THREE.Group();

    // Body
    const bodyGeom = new THREE.BoxGeometry(0.6, 1.0, 0.4);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.8;
    body.castShadow = true;
    this.mesh.add(body);

    // Head
    const headGeom = new THREE.SphereGeometry(0.25, 8, 6);
    const headMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.55;
    head.castShadow = true;
    this.mesh.add(head);

    // Name tag indicator (floating dot above head)
    const dotGeom = new THREE.SphereGeometry(0.08, 8, 6);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const dot = new THREE.Mesh(dotGeom, dotMat);
    dot.position.y = 2.0;
    this.mesh.add(dot);

    this.mesh.position.copy(position);
  }

  setOnInteract(callback: () => void): void {
    this.onInteract = callback;
  }

  interact(): void {
    if (!this.available) return;
    this.available = false;
    this.onInteract?.();
  }

  isAvailable(): boolean {
    return this.available;
  }

  reset(): void {
    this.available = true;
  }
}
