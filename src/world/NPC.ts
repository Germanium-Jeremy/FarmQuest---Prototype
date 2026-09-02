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
<<<<<<< HEAD

    switch (mapId) {
      case 'sudan':
        this.buildMerchant();
        break;
      case 'seychelles':
        this.buildFisher();
        break;
      default:
        this.buildFarmer();
        break;
    }

    this.mesh.position.copy(position);
  }

  private buildFarmer(): void {
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

    // Straw hat
    const hatBrim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.04, 8),
      new THREE.MeshLambertMaterial({ color: 0xd4a017 }),
    );
    hatBrim.position.y = 1.7;
    this.mesh.add(hatBrim);
    const hatTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.18, 8),
      new THREE.MeshLambertMaterial({ color: 0xd4a017 }),
    );
    hatTop.position.y = 1.82;
    this.mesh.add(hatTop);

    // Name tag indicator
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffff00 }),
    );
    dot.position.y = 2.1;
    this.mesh.add(dot);
  }

  private buildMerchant(): void {
    // Body - robe-like
    const bodyGeom = new THREE.CylinderGeometry(0.35, 0.45, 1.2, 8);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xc19a6b });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.85;
    body.castShadow = true;
    this.mesh.add(body);

    // Head
    const headGeom = new THREE.SphereGeometry(0.25, 8, 6);
    const headMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.6;
    head.castShadow = true;
    this.mesh.add(head);

    // Turban/headwrap
    const turbanGeom = new THREE.SphereGeometry(0.28, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const turbanMat = new THREE.MeshLambertMaterial({ color: 0xf5f5dc });
    const turban = new THREE.Mesh(turbanGeom, turbanMat);
    turban.position.y = 1.7;
    this.mesh.add(turban);
    const turbanWrap = new THREE.Mesh(
      new THREE.TorusGeometry(0.26, 0.06, 6, 12),
      new THREE.MeshLambertMaterial({ color: 0xf5f5dc }),
    );
    turbanWrap.position.y = 1.62;
    turbanWrap.rotation.x = Math.PI / 2;
    this.mesh.add(turbanWrap);

    // Name tag indicator
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffaa00 }),
    );
    dot.position.y = 2.1;
    this.mesh.add(dot);
  }

  private buildFisher(): void {
    // Body
    const bodyGeom = new THREE.BoxGeometry(0.6, 1.0, 0.4);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x4682b4 });
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

    // Boat hat / bucket hat
    const hatBrim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.35, 0.05, 8),
      new THREE.MeshLambertMaterial({ color: 0x5f9ea0 }),
    );
    hatBrim.position.y = 1.7;
    this.mesh.add(hatBrim);
    const hatTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.22, 0.15, 8),
      new THREE.MeshLambertMaterial({ color: 0x5f9ea0 }),
    );
    hatTop.position.y = 1.8;
    this.mesh.add(hatTop);

    // Name tag indicator
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0x00bfff }),
    );
    dot.position.y = 2.1;
    this.mesh.add(dot);
=======
    if (mapId === 'sudan') this.buildMerchant();
    else if (mapId === 'seychelles') this.buildFisher();
    else this.buildFarmer();
    this.mesh.position.copy(position);
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
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
