import * as THREE from 'three';
import { CROP_LABEL, CropType } from '../data/CropType';
import { Interactable } from './Interactable';

export class Crop implements Interactable {
  public mesh: THREE.Group;
  public label = 'Plant Seed';
  public cropType: CropType | null = null;
  private available = true;
  private planted = false;
  private harvestable = false;
  private onInteract: (() => void) | null = null;
  private cropMesh: THREE.Object3D | null = null;
  private requiredWater = 1;
  private waterCount = 0;
  private soil: THREE.Mesh;

  constructor(position: THREE.Vector3) {
    this.mesh = new THREE.Group();

    this.soil = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.1, 1.5),
      new THREE.MeshLambertMaterial({ color: 0x8B6914 }),
    );
    this.soil.position.y = 0.05;
    this.soil.receiveShadow = true;
    this.mesh.add(this.soil);

    for (let i = -1; i <= 1; i++) {
      const row = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.05, 0.1),
        new THREE.MeshLambertMaterial({ color: 0x6B4914 }),
      );
      row.position.set(0, 0.12, i * 0.4);
      this.mesh.add(row);
    }

    this.mesh.position.copy(position);
  }

  setOnInteract(callback: () => void): void {
    this.onInteract = callback;
  }

  plantCrop(cropType: CropType, requiredWater = 1): boolean {
    if (this.planted) return false;
    this.cropType = cropType;
    this.planted = true;
    this.requiredWater = requiredWater;
    this.waterCount = 0;
    this.harvestable = false;
    this.label = `Water ${CROP_LABEL[cropType]}`;

    this.cropMesh = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const sprout = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.16, 4),
        new THREE.MeshLambertMaterial({ color: 0x2f8f3a }),
      );
      sprout.position.set((Math.random() - 0.5) * 0.8, 0.22, (Math.random() - 0.5) * 0.8);
      this.cropMesh.add(sprout);
    }
    this.mesh.add(this.cropMesh);
    return true;
  }

  water(): boolean {
    if (!this.planted || this.harvestable) return false;
    this.waterCount += 1;
    (this.soil.material as THREE.MeshLambertMaterial).color.setHex(0x5f421d);
    this.mesh.scale.setScalar(1 + this.waterCount * 0.08);
    if (this.waterCount >= this.requiredWater) {
      this.growCrop();
    }
    return true;
  }

  harvest(): boolean {
    if (!this.harvestable) return false;
    this.available = false;
    this.mesh.visible = false;
    return true;
  }

  isReadyToPlant(): boolean {
    return !this.planted && this.available;
  }

  isReadyToWater(): boolean {
    return this.planted && !this.harvestable && this.available;
  }

  isReadyToHarvest(): boolean {
    return this.harvestable && this.available;
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
    this.planted = false;
    this.harvestable = false;
    this.cropType = null;
    this.waterCount = 0;
    this.requiredWater = 1;
    this.label = 'Plant Seed';
    this.mesh.visible = true;
    this.mesh.scale.setScalar(1);
    (this.soil.material as THREE.MeshLambertMaterial).color.setHex(0x8B6914);
    if (this.cropMesh) {
      this.mesh.remove(this.cropMesh);
      this.cropMesh = null;
    }
  }

  private growCrop(): void {
    this.harvestable = true;
    this.label = `Harvest ${this.cropType ? CROP_LABEL[this.cropType] : 'Crop'}`;
    if (this.cropMesh) this.mesh.remove(this.cropMesh);

    this.cropMesh = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const x = (Math.random() - 0.5) * 1.0;
      const z = (Math.random() - 0.5) * 1.0;
      if (this.cropType === CropType.CASSAVA) this.cropMesh.add(this.createCassavaPlant(x, z));
      else if (this.cropType === CropType.COFFEE) this.cropMesh.add(this.createCoffeePlant(x, z));
      else this.cropMesh.add(this.createMaizePlant(x, z));
    }
    this.mesh.add(this.cropMesh);
  }

  private createMaizePlant(x: number, z: number): THREE.Group {
    const plant = new THREE.Group();
    const stalk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.045, 0.9, 4),
      new THREE.MeshLambertMaterial({ color: 0x268b3c }),
    );
    stalk.position.set(x, 0.55, z);
    const head = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.04, 0.18, 6),
      new THREE.MeshLambertMaterial({ color: 0xffd23f }),
    );
    head.position.y = 0.46;
    stalk.add(head);
    plant.add(stalk);
    return plant;
  }

  private createCassavaPlant(x: number, z: number): THREE.Group {
    const plant = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.04, 0.55, 5),
      new THREE.MeshLambertMaterial({ color: 0x4f7d37 }),
    );
    stem.position.set(x, 0.36, z);
    plant.add(stem);
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.36, 0.02),
        new THREE.MeshLambertMaterial({ color: 0x43a047 }),
      );
      leaf.position.set(x, 0.72, z);
      leaf.rotation.y = (i / 6) * Math.PI * 2;
      leaf.rotation.z = 0.65;
      plant.add(leaf);
    }
    return plant;
  }

  private createCoffeePlant(x: number, z: number): THREE.Group {
    const plant = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.045, 0.7, 5),
      new THREE.MeshLambertMaterial({ color: 0x315c2d }),
    );
    stem.position.set(x, 0.42, z);
    plant.add(stem);
    for (let i = 0; i < 4; i++) {
      const cherry = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 6, 5),
        new THREE.MeshLambertMaterial({ color: 0xc62828 }),
      );
      cherry.position.set(x + Math.cos(i) * 0.18, 0.75, z + Math.sin(i) * 0.18);
      plant.add(cherry);
    }
    return plant;
  }
}
