import * as THREE from 'three';
import { MAP_THEMES, MapTheme } from '../data/MapTheme';
import { CollisionManager } from './CollisionManager';

export class World {
  public group: THREE.Group;
  public bounds = { minX: -20, maxX: 20, minZ: -20, maxZ: 20 };
  public collision: CollisionManager;
  private theme: MapTheme;

  constructor(themeInput: MapTheme | string = MAP_THEMES.rwanda) {
    this.theme = typeof themeInput === 'string' ? MAP_THEMES[themeInput as any] : themeInput;
    this.group = new THREE.Group();
    this.collision = new CollisionManager(this.group);
    this.buildTerrain();
    this.buildRoad();
    this.buildFarm();
    this.buildForest();
    this.buildWaterFeature();
    this.buildBuildings();
    this.buildDecorations();
  }

  getTheme(): MapTheme {
    return this.theme;
  }

  private buildTerrain(): void {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshLambertMaterial({ color: this.theme.groundColor }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.group.add(ground);

    const dirt = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshLambertMaterial({ color: this.theme.dirtColor }));
    dirt.rotation.x = -Math.PI / 2;
    dirt.position.set(6, 0, -2);
    dirt.receiveShadow = true;
    this.group.add(dirt);

    if (this.theme.id === 'seychelles') {
      const beach = new THREE.Mesh(new THREE.PlaneGeometry(11, 50), new THREE.MeshLambertMaterial({ color: 0xf8e6c7 }));
      beach.rotation.x = -Math.PI / 2;
      beach.position.set(13, 0.005, 0);
      beach.receiveShadow = true;
      this.group.add(beach);
    }
  }

  private buildRoad(): void {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(40, 2.5), new THREE.MeshLambertMaterial({ color: this.theme.roadColor }));
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, 4);
    road.receiveShadow = true;
    this.group.add(road);

    if (this.theme.id === 'rwanda') {
      for (let i = -18; i <= 18; i += 3) {
        const mark = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.15), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
        mark.rotation.x = -Math.PI / 2;
        mark.position.set(i, 0.02, 4);
        this.group.add(mark);
      }
    }

    const path = new THREE.Mesh(new THREE.PlaneGeometry(2, 10), new THREE.MeshLambertMaterial({ color: this.theme.dirtColor }));
    path.rotation.x = -Math.PI / 2;
    path.position.set(6, 0.01, -1);
    path.receiveShadow = true;
    this.group.add(path);
  }

  private buildFarm(): void {
    const fenceMat = new THREE.MeshLambertMaterial({ color: this.theme.fenceColor });
    const postGeom = new THREE.BoxGeometry(0.06, 0.6, 0.06);

    for (const x of [3.5, 8.5]) {
      for (let i = 0; i < 5; i++) {
        const post = new THREE.Mesh(postGeom, fenceMat);
        post.position.set(x, 0.3, -6 + i * 2);
        post.castShadow = true;
        this.group.add(post);
      }
      this.collision.addBox(`farm-fence-${x}`, new THREE.Vector3(x, 0.55, -2), new THREE.Vector3(0.32, 1.1, 8.4));
      for (const y of [0.45, 0.2]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 8.2), fenceMat);
        rail.position.set(x, y, -2);
        this.group.add(rail);
      }
    }

    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.08), new THREE.MeshLambertMaterial({ color: this.theme.buildingWallColor }));
    sign.position.set(6, 1.2, -5.8);
    sign.castShadow = true;
    this.group.add(sign);

    const signPost = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.08), new THREE.MeshLambertMaterial({ color: this.theme.fenceColor }));
    signPost.position.set(6, 0.6, -5.8);
    this.group.add(signPost);
  }

  private buildForest(): void {
    if (this.theme.id === 'sudan') {
      this.buildSudanForest();
    } else if (this.theme.id === 'seychelles') {
      this.buildSeychellesForest();
    } else {
      this.buildRwandaForest();
    }
  }

  private buildRwandaForest(): void {
    const positions = [
      new THREE.Vector3(-12, 0, -8), new THREE.Vector3(-10, 0, -10), new THREE.Vector3(-14, 0, -6),
      new THREE.Vector3(-11, 0, -12), new THREE.Vector3(-13, 0, -10), new THREE.Vector3(-15, 0, -8),
      new THREE.Vector3(-9, 0, -7), new THREE.Vector3(-16, 0, -10), new THREE.Vector3(-12, 0, -14),
      new THREE.Vector3(-14, 0, -13), new THREE.Vector3(-10, 0, -5), new THREE.Vector3(-8, 0, -12),
    ];
    for (const pos of positions) this.createTree(pos);
  }

  private buildSudanForest(): void {
    const sparse = [
      new THREE.Vector3(-12, 0, -8), new THREE.Vector3(-14, 0, -10),
      new THREE.Vector3(-9, 0, -12), new THREE.Vector3(-16, 0, -6),
    ];
    for (const pos of sparse) this.createTree(pos);
    const cacti = [
      new THREE.Vector3(-10, 0, -5), new THREE.Vector3(-7, 0, -9),
      new THREE.Vector3(-15, 0, -12), new THREE.Vector3(-11, 0, -3), new THREE.Vector3(-8, 0, -14),
    ];
    for (const pos of cacti) this.createCactus(pos);
    const dunes = [
      new THREE.Vector3(-13, 0, -4), new THREE.Vector3(-6, 0, -11),
      new THREE.Vector3(-16, 0, -12), new THREE.Vector3(-9, 0, -6),
    ];
    for (const pos of dunes) this.createSandDune(pos, 0.8 + Math.random() * 0.5);
  }

  private buildSeychellesForest(): void {
    const palms = [
      new THREE.Vector3(-10, 0, -6), new THREE.Vector3(-13, 0, -8),
      new THREE.Vector3(-8, 0, -10), new THREE.Vector3(-15, 0, -5),
      new THREE.Vector3(-11, 0, -12), new THREE.Vector3(-7, 0, -4),
      new THREE.Vector3(-14, 0, -14), new THREE.Vector3(-9, 0, -13),
    ];
    for (const pos of palms) this.createPalmTree(pos);
  }

  private buildWaterFeature(): void {
    if (this.theme.id === 'seychelles') {
      const sea = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 50),
        new THREE.MeshLambertMaterial({ color: this.theme.waterColor, transparent: true, opacity: this.theme.waterOpacity }),
      );
      sea.rotation.x = -Math.PI / 2;
      sea.position.set(18, 0.03, 0);
      sea.receiveShadow = true;
      this.group.add(sea);
      return;
    }

    const river = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 30),
      new THREE.MeshLambertMaterial({ color: this.theme.waterColor, transparent: true, opacity: this.theme.waterOpacity }),
    );
    river.rotation.x = -Math.PI / 2;
    river.position.set(16, 0.02, 0);
    river.receiveShadow = true;
    this.group.add(river);

    const bank = new THREE.Mesh(new THREE.PlaneGeometry(2, 30), new THREE.MeshLambertMaterial({ color: this.theme.dirtColor }));
    bank.rotation.x = -Math.PI / 2;
    bank.position.set(13.5, 0.01, 0);
    this.group.add(bank);
  }

  private buildBuildings(): void {
    this.createBuilding(new THREE.Vector3(-3, 0, -8), this.theme.buildingWallColor, 2.5, 2, 2);
    this.createBuilding(new THREE.Vector3(-3, 0, 8), this.theme.id === 'rwanda' ? 0xcd5c5c : this.theme.buildingWallColor, 3, 2.5, 2.5);
  }

  private createBuilding(pos: THREE.Vector3, color: number, w: number, h: number, d: number): void {
    const building = new THREE.Group();
    const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
    walls.position.y = h / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    building.add(walls);

    const roofShape = new THREE.Shape();
    roofShape.moveTo(-w / 2 - 0.2, 0);
    roofShape.lineTo(0, 1);
    roofShape.lineTo(w / 2 + 0.2, 0);
    roofShape.lineTo(-w / 2 - 0.2, 0);
    const roof = new THREE.Mesh(
      new THREE.ExtrudeGeometry(roofShape, { depth: d + 0.4, bevelEnabled: false }),
      new THREE.MeshLambertMaterial({ color: this.theme.buildingRoofColor }),
    );
    roof.position.set(0, h, -d / 2 - 0.2);
    roof.castShadow = true;
    building.add(roof);

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.05), new THREE.MeshLambertMaterial({ color: 0x5c3317 }));
    door.position.set(0, 0.6, d / 2 + 0.03);
    building.add(door);

    const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.05), new THREE.MeshLambertMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.6 }));
    win.position.set(w / 3, h / 2, d / 2 + 0.03);
    building.add(win);

    building.position.copy(pos);
    this.group.add(building);
    this.collision.addBox(`building-${pos.x}-${pos.z}`, new THREE.Vector3(pos.x, h / 2, pos.z), new THREE.Vector3(w + 0.25, h, d + 0.25));
  }

  private buildDecorations(): void {
    if (this.theme.id === 'sudan') {
      this.buildSudanDecorations();
    } else if (this.theme.id === 'seychelles') {
      this.buildSeychellesDecorations();
    } else {
      this.buildRwandaDecorations();
    }
  }

  private buildRwandaDecorations(): void {
    [new THREE.Vector3(-5, 0, 8), new THREE.Vector3(-6, 0.3, 7.5), new THREE.Vector3(-5.5, 0, 9)].forEach((p) => this.createHay(p));
    [new THREE.Vector3(2, 0, 6), new THREE.Vector3(-1, 0, 7), new THREE.Vector3(8, 0, 7)].forEach((p) => this.createFlowers(p));
    [new THREE.Vector3(12, 0, 3), new THREE.Vector3(13, 0, -1), new THREE.Vector3(12.5, 0, 6)].forEach((p) => this.createRock(p));
  }

  private buildSudanDecorations(): void {
    [new THREE.Vector3(-5, 0, -3), new THREE.Vector3(2, 0, 5), new THREE.Vector3(10, 0, -2), new THREE.Vector3(-8, 0, 4), new THREE.Vector3(7, 0, 8)].forEach((p) => this.createRock(p, 0xa0906e));
    [new THREE.Vector3(3, 0, 6), new THREE.Vector3(-4, 0, 2), new THREE.Vector3(10, 0, 7)].forEach((p) => {
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.3, 5, 4), new THREE.MeshLambertMaterial({ color: 0x8B7355 }));
      bush.position.copy(p);
      bush.position.y = 0.2;
      bush.scale.y = 0.6;
      bush.castShadow = true;
      this.group.add(bush);
    });
  }

  private buildSeychellesDecorations(): void {
    [new THREE.Vector3(10, 0, 6), new THREE.Vector3(13, 0, 3), new THREE.Vector3(8, 0, 8)].forEach((p) => this.createBeachUmbrella(p));
    [new THREE.Vector3(12, 0, 5), new THREE.Vector3(14, 0, 2), new THREE.Vector3(11, 0, 8)].forEach((p) => {
      const shell = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 4), new THREE.MeshLambertMaterial({ color: 0xfff8dc }));
      shell.position.copy(p);
      shell.position.y = 0.06;
      shell.scale.y = 0.4;
      this.group.add(shell);
    });
    [new THREE.Vector3(13, 0, -2), new THREE.Vector3(14, 0, 8), new THREE.Vector3(12, 0, -5)].forEach((p) => {
      const coral = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), new THREE.MeshLambertMaterial({ color: 0xe8836b }));
      coral.position.copy(p);
      coral.position.y = 0.2;
      coral.castShadow = true;
      this.group.add(coral);
      this.collision.addBox(`coral-${p.x}-${p.z}`, new THREE.Vector3(p.x, 0.4, p.z), new THREE.Vector3(0.8, 0.8, 0.8));
    });
  }

  private createTree(pos: THREE.Vector3): void {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.2, 6), new THREE.MeshLambertMaterial({ color: this.theme.treeTrunkColor }));
    trunk.position.y = 0.6;
    trunk.castShadow = true;
    tree.add(trunk);
    [{ r: 0.9, h: 1.0, y: 1.6 }, { r: 0.7, h: 0.9, y: 2.2 }, { r: 0.4, h: 0.7, y: 2.7 }].forEach((s, i) => {
      const f = new THREE.Mesh(new THREE.ConeGeometry(s.r, s.h, 6), new THREE.MeshLambertMaterial({ color: this.theme.treeFoliageColors[i % this.theme.treeFoliageColors.length] }));
      f.position.y = s.y;
      f.castShadow = true;
      tree.add(f);
    });
    tree.position.copy(pos);
    this.group.add(tree);
    this.collision.addBox(`tree-${pos.x}-${pos.z}`, new THREE.Vector3(pos.x, 0.8, pos.z), new THREE.Vector3(0.72, 1.6, 0.72));
  }

  private createPalmTree(pos: THREE.Vector3): void {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 2.5, 6), new THREE.MeshLambertMaterial({ color: this.theme.treeTrunkColor }));
    trunk.position.y = 1.25;
    trunk.rotation.z = 0.1;
    trunk.castShadow = true;
    tree.add(trunk);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const frond = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.2, 4), new THREE.MeshLambertMaterial({ color: this.theme.treeFoliageColors[i % this.theme.treeFoliageColors.length] }));
      frond.position.set(Math.cos(angle) * 0.5, 2.6, Math.sin(angle) * 0.5);
      frond.rotation.z = Math.cos(angle) * 0.6;
      frond.rotation.x = Math.sin(angle) * 0.6;
      frond.castShadow = true;
      tree.add(frond);
    }
    tree.position.copy(pos);
    this.group.add(tree);
    this.collision.addBox(`palm-${pos.x}-${pos.z}`, new THREE.Vector3(pos.x, 1.0, pos.z), new THREE.Vector3(0.5, 2.0, 0.5));
  }

  private createCactus(pos: THREE.Vector3): void {
    const cactus = new THREE.Group();
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.2, 6), stemMat);
    stem.position.y = 0.6;
    stem.castShadow = true;
    cactus.add(stem);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.5, 5), stemMat);
    arm.position.set(0.2, 0.8, 0);
    arm.rotation.z = -0.5;
    arm.castShadow = true;
    cactus.add(arm);
    for (let i = 0; i < 6; i++) {
      const spine = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.1, 3), new THREE.MeshLambertMaterial({ color: 0x8bc34a }));
      const angle = (i / 6) * Math.PI * 2;
      spine.position.set(Math.cos(angle) * 0.15, 0.4 + (i % 3) * 0.25, Math.sin(angle) * 0.15);
      spine.rotation.z = Math.cos(angle) * 1.2;
      spine.rotation.x = Math.sin(angle) * 1.2;
      cactus.add(spine);
    }
    cactus.position.copy(pos);
    this.group.add(cactus);
    this.collision.addBox(`cactus-${pos.x}-${pos.z}`, new THREE.Vector3(pos.x, 0.5, pos.z), new THREE.Vector3(0.5, 1.0, 0.5));
  }

  private createSandDune(pos: THREE.Vector3, scale = 1): void {
    const dune = new THREE.Mesh(new THREE.SphereGeometry(1.5 * scale, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: this.theme.groundColor }));
    dune.position.copy(pos);
    dune.position.y = 0;
    dune.scale.y = 0.3;
    dune.receiveShadow = true;
    this.group.add(dune);
  }

  private createHay(pos: THREE.Vector3): void {
    const hay = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.6, 8), new THREE.MeshLambertMaterial({ color: 0xdaa520 }));
    hay.rotation.z = Math.PI / 2;
    hay.position.copy(pos);
    hay.position.y += 0.3;
    hay.castShadow = true;
    this.group.add(hay);
    this.collision.addBox(`hay-${pos.x}-${pos.z}`, new THREE.Vector3(pos.x, 0.42, pos.z), new THREE.Vector3(0.8, 0.85, 0.8));
  }

  private createFlowers(pos: THREE.Vector3): void {
    const flowerColors = [0xff69b4, 0xffd700, 0xff4500, 0x9370db];
    for (let i = 0; i < 4; i++) {
      const flower = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), new THREE.MeshLambertMaterial({ color: flowerColors[i] }));
      flower.position.set(pos.x + (Math.random() - 0.5) * 1.5, 0.1, pos.z + (Math.random() - 0.5) * 1.5);
      this.group.add(flower);
    }
  }

  private createRock(pos: THREE.Vector3, color = 0x888888): void {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), new THREE.MeshLambertMaterial({ color }));
    rock.position.copy(pos);
    rock.position.y = 0.15;
    rock.castShadow = true;
    this.group.add(rock);
    this.collision.addBox(`rock-${pos.x}-${pos.z}`, new THREE.Vector3(pos.x, 0.35, pos.z), new THREE.Vector3(0.8, 0.7, 0.8));
  }

  private createBeachUmbrella(pos: THREE.Vector3): void {
    const umbrella = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2, 6), new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
    pole.position.y = 1;
    umbrella.add(pole);
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 8), new THREE.MeshLambertMaterial({ color: 0xe74c3c }));
    canopy.position.y = 2;
    canopy.castShadow = true;
    umbrella.add(canopy);
    umbrella.position.copy(pos);
    this.group.add(umbrella);
  }
}
