import * as THREE from 'three';
import { MapId } from '../data/MapTheme';
import { Interactable } from './Interactable';

export class NPC implements Interactable {
  public mesh: THREE.Group;
  public label = 'Talk to NPC';
  private available = true;
  private onInteract: (() => void) | null = null;

  constructor(position: THREE.Vector3, mapId: MapId = 'rwanda') {
    this.mesh = new THREE.Group();
    if (mapId === 'sudan') this.buildMerchant();
    else if (mapId === 'seychelles') this.buildFisher();
    else this.buildFarmer();
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

  private buildFarmer(): void {
    this.label = 'Talk to Farmer';
    this.addHumanoid(0x8b4513, 0x8b6914);
    this.mesh.add(this.meshPart(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 8), 0xd4a017, 0, 1.78, 0));
    this.mesh.add(this.meshPart(new THREE.CylinderGeometry(0.19, 0.21, 0.18, 8), 0xd4a017, 0, 1.88, 0));
    this.addDot(0xffff00);
  }

  private buildMerchant(): void {
    this.label = 'Talk to Merchant';
    this.addHumanoid(0xc48b5a, 0x9f6a42);
    this.mesh.add(this.meshPart(new THREE.SphereGeometry(0.28, 8, 6), 0xf5f0df, 0, 1.72, 0));
    this.mesh.add(this.meshPart(new THREE.BoxGeometry(0.5, 0.08, 0.2), 0x7a3b2e, 0, 1.55, 0.02));
    this.addDot(0x00ffff);
  }

  private buildFisher(): void {
    this.label = 'Talk to Fisher';
    this.addHumanoid(0x2f9e9b, 0xb98242);
    const hat = this.meshPart(new THREE.ConeGeometry(0.35, 0.22, 8), 0xf4e1c1, 0, 1.82, 0);
    hat.rotation.x = Math.PI;
    this.mesh.add(hat);
    const net = this.meshPart(new THREE.TorusGeometry(0.32, 0.018, 6, 12), 0xffffff, 0.42, 0.9, 0.05);
    net.rotation.y = Math.PI / 2;
    this.mesh.add(net);
    this.addDot(0x1abc9c);
  }

  private addHumanoid(bodyColor: number, headColor: number): void {
    this.mesh.add(this.meshPart(new THREE.BoxGeometry(0.6, 1.0, 0.4), bodyColor, 0, 0.8, 0));
    this.mesh.add(this.meshPart(new THREE.SphereGeometry(0.25, 8, 6), headColor, 0, 1.55, 0));
  }

  private addDot(color: number): void {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color }));
    dot.position.y = 2.08;
    this.mesh.add(dot);
  }

  private meshPart(geometry: THREE.BufferGeometry, color: number, x: number, y: number, z: number): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color }));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    return mesh;
  }
}
