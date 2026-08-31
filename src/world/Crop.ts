import * as THREE from 'three';
import { Interactable } from './Interactable';

export class Crop implements Interactable {
  public mesh: THREE.Group;
  public label = 'Harvest Crop';
  private available = true;
  private planted = false;
  private grown = false;
  private onInteract: (() => void) | null = null;
  private cropMesh: THREE.Object3D | null = null;

  constructor(private position: THREE.Vector3) {
    this.mesh = new THREE.Group();

    // Soil patch
    const soilGeom = new THREE.BoxGeometry(1.5, 0.1, 1.5);
    const soilMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    const soil = new THREE.Mesh(soilGeom, soilMat);
    soil.position.y = 0.05;
    soil.receiveShadow = true;
    this.mesh.add(soil);

    // Soil rows
    for (let i = -1; i <= 1; i++) {
      const rowGeom = new THREE.BoxGeometry(1.2, 0.05, 0.1);
      const rowMat = new THREE.MeshLambertMaterial({ color: 0x6B4914 });
      const row = new THREE.Mesh(rowGeom, rowMat);
      row.position.set(0, 0.12, i * 0.4);
      this.mesh.add(row);
    }

    this.mesh.position.copy(position);
  }

  setOnInteract(callback: () => void): void {
    this.onInteract = callback;
  }

  plantCrop(): void {
    if (this.planted) return;
    this.planted = true;

    // Add crop sprouts
    this.cropMesh = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const sproutGeom = new THREE.ConeGeometry(0.05, 0.15, 4);
      const sproutMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
      const sprout = new THREE.Mesh(sproutGeom, sproutMat);
      sprout.position.set(
        (Math.random() - 0.5) * 0.8,
        0.2,
        (Math.random() - 0.5) * 0.8
      );
      this.cropMesh.add(sprout);
    }
    this.mesh.add(this.cropMesh);

    // Grow after a short delay
    setTimeout(() => this.growCrop(), 1500);
  }

  private growCrop(): void {
    this.grown = true;
    if (!this.cropMesh) return;

    // Replace sprouts with full crops
    this.mesh.remove(this.cropMesh);
    this.cropMesh = new THREE.Group();

    for (let i = 0; i < 8; i++) {
      const stalkGeom = new THREE.CylinderGeometry(0.03, 0.04, 0.8, 4);
      const stalkMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
      const stalk = new THREE.Mesh(stalkGeom, stalkMat);
      stalk.position.set(
        (Math.random() - 0.5) * 1.0,
        0.5,
        (Math.random() - 0.5) * 1.0
      );

      // Corn head
      const headGeom = new THREE.CylinderGeometry(0.06, 0.04, 0.15, 6);
      const headMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
      const head = new THREE.Mesh(headGeom, headMat);
      head.position.y = 0.45;
      stalk.add(head);

      this.cropMesh.add(stalk);
    }
    this.mesh.add(this.cropMesh);
  }

  isReadyToPlant(): boolean {
    return !this.planted;
  }

  isReadyToHarvest(): boolean {
    return this.planted && this.grown;
  }

  interact(): void {
    if (!this.available || !this.grown) return;
    this.available = false;
    this.onInteract?.();
  }

  isAvailable(): boolean {
    return this.available && this.grown;
  }

  reset(): void {
    this.available = true;
    this.planted = false;
    this.grown = false;
    if (this.cropMesh) {
      this.mesh.remove(this.cropMesh);
      this.cropMesh = null;
    }
  }
}
