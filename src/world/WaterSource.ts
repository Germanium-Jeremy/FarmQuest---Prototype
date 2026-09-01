import * as THREE from 'three';
import { Interactable } from './Interactable';

export class WaterSource implements Interactable {
  public mesh: THREE.Group;
  public label: string;
  public sourceName: string;
  private available = true;
  private onInteract: (() => void) | null = null;

  constructor(position: THREE.Vector3, sourceName = 'Well') {
    this.sourceName = sourceName;
    this.label = `Use ${sourceName}`;
    this.mesh = new THREE.Group();

    // Well base - cylinder
    const baseGeom = new THREE.CylinderGeometry(0.8, 0.9, 0.6, 8);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.3;
    base.castShadow = true;
    this.mesh.add(base);

    // Well rim
    const rimGeom = new THREE.TorusGeometry(0.75, 0.1, 8, 16);
    const rimMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    const rim = new THREE.Mesh(rimGeom, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.65;
    this.mesh.add(rim);

    // Water surface
    const waterGeom = new THREE.CircleGeometry(0.7, 12);
    const waterMat = new THREE.MeshLambertMaterial({ color: 0x3498db, transparent: true, opacity: 0.7 });
    const water = new THREE.Mesh(waterGeom, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.55;
    this.mesh.add(water);

    // Support posts
    for (let i = 0; i < 2; i++) {
      const postGeom = new THREE.BoxGeometry(0.08, 1.2, 0.08);
      const postMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      const post = new THREE.Mesh(postGeom, postMat);
      post.position.set(i === 0 ? -0.5 : 0.5, 1.0, 0);
      post.castShadow = true;
      this.mesh.add(post);
    }

    // Roof beam
    const beamGeom = new THREE.BoxGeometry(1.3, 0.08, 0.08);
    const beamMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const beam = new THREE.Mesh(beamGeom, beamMat);
    beam.position.y = 1.6;
    this.mesh.add(beam);

    // Bucket
    const bucketGeom = new THREE.CylinderGeometry(0.12, 0.1, 0.18, 6);
    const bucketMat = new THREE.MeshLambertMaterial({ color: 0xa0a0a0 });
    const bucket = new THREE.Mesh(bucketGeom, bucketMat);
    bucket.position.y = 1.1;
    this.mesh.add(bucket);

    this.mesh.position.copy(position);
  }

  setOnInteract(callback: () => void): void {
    this.onInteract = callback;
  }

  interact(): void {
    if (!this.available) return;
    this.onInteract?.();
  }

  isAvailable(): boolean {
    return this.available;
  }

  reset(): void {
    this.available = true;
  }
}
