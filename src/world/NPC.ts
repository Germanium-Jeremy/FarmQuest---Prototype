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

  private buildFarmer(): void {
    this.label = 'Talk to Farmer';
    this.addHumanoid(0x8b4513, 0x8b6914);
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 8), new THREE.MeshLambertMaterial({ color: 0xd4a017 }));
    hatBrim.position.y = 1.7;
    this.mesh.add(hatBrim);
    const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.18, 8), new THREE.MeshLambertMaterial({ color: 0xd4a017 }));
    hatTop.position.y = 1.82;
    this.mesh.add(hatTop);
  }

  private buildMerchant(): void {
    this.label = 'Talk to Merchant';
    this.addHumanoid(0xc48b5a, 0x9f6a42);
    const turban = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xf5f5dc }));
    turban.position.y = 1.7;
    this.mesh.add(turban);
  }

  private buildFisher(): void {
    this.label = 'Talk to Fisher';
    this.addHumanoid(0x2f9e9b, 0xb98242);
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.05, 8), new THREE.MeshLambertMaterial({ color: 0x5f9ea0 }));
    hatBrim.position.y = 1.7;
    this.mesh.add(hatBrim);
    const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.15, 8), new THREE.MeshLambertMaterial({ color: 0x5f9ea0 }));
    hatTop.position.y = 1.8;
    this.mesh.add(hatTop);
  }

  private addHumanoid(bodyColor: number, headColor: number): void {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 0.4), new THREE.MeshLambertMaterial({ color: bodyColor }));
    body.position.y = 0.8;
    body.castShadow = true;
    this.mesh.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshLambertMaterial({ color: headColor }));
    head.position.y = 1.55;
    head.castShadow = true;
    this.mesh.add(head);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
    dot.position.y = 2.1;
    this.mesh.add(dot);
  }

  setOnInteract(callback: () => void): void { this.onInteract = callback; }
  interact(): void { if (!this.available) return; this.available = false; this.onInteract?.(); }
  isAvailable(): boolean { return this.available; }
  reset(): void { this.available = true; }
}
