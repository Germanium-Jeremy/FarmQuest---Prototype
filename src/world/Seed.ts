import * as THREE from 'three';
import { CROP_COLOR, CROP_LABEL, CropType } from '../data/CropType';
import { Interactable } from './Interactable';

export class Seed implements Interactable {
  public mesh: THREE.Group;
  public label: string;
  public cropType: CropType;
  private available = true;
  private onInteract: (() => void) | null = null;
  private glowMesh: THREE.Mesh;

  constructor(position: THREE.Vector3, cropType: CropType) {
    this.cropType = cropType;
    this.mesh = new THREE.Group();
    this.label = `Collect ${CROP_LABEL[cropType]} ${cropType === CropType.COFFEE ? 'Bean' : 'Seed'}`;

    const packetGeom = cropType === CropType.COFFEE
      ? new THREE.SphereGeometry(0.18, 8, 6)
      : new THREE.BoxGeometry(0.34, 0.42, 0.16);
    const packetMat = new THREE.MeshLambertMaterial({ color: CROP_COLOR[cropType] });
    const packet = new THREE.Mesh(packetGeom, packetMat);
    packet.position.y = 0.8;
    packet.castShadow = true;
    this.mesh.add(packet);

    if (cropType === CropType.MAIZE) {
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 5), new THREE.MeshLambertMaterial({ color: 0x2f8f3a }));
      cap.position.y = 1.05;
      this.mesh.add(cap);
    }

    if (cropType === CropType.CASSAVA) {
      for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.02), new THREE.MeshLambertMaterial({ color: 0x3e9a46 }));
        leaf.position.y = 1.02;
        leaf.rotation.z = (i - 2) * 0.35;
        this.mesh.add(leaf);
      }
    }

    const glowGeom = new THREE.RingGeometry(0.4, 0.55, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: CROP_COLOR[cropType],
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    this.glowMesh = new THREE.Mesh(glowGeom, glowMat);
    this.glowMesh.rotation.x = -Math.PI / 2;
    this.glowMesh.position.y = 0.05;
    this.mesh.add(this.glowMesh);

    for (let i = 0; i < 5; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 4, 4),
        new THREE.MeshBasicMaterial({ color: CROP_COLOR[cropType] }),
      );
      const angle = (i / 5) * Math.PI * 2;
      particle.position.set(Math.cos(angle) * 0.35, 0.8, Math.sin(angle) * 0.35);
      this.mesh.add(particle);
    }

    this.mesh.position.copy(position);
  }

  setOnInteract(callback: () => void): void {
    this.onInteract = callback;
  }

  interact(): void {
    if (!this.available) return;
    this.available = false;
    this.mesh.visible = false;
    this.onInteract?.();
  }

  isAvailable(): boolean {
    return this.available;
  }

  reset(): void {
    this.available = true;
    this.mesh.visible = true;
  }

  update(time: number): void {
    if (!this.available) return;
    this.mesh.children[0].position.y = 0.8 + Math.sin(time * 2) * 0.15;
    (this.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(time * 3) * 0.15;
    this.glowMesh.rotation.z = time * 0.5;
  }
}
