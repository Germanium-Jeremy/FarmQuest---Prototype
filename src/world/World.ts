import * as THREE from 'three';
import { CollisionManager } from './CollisionManager';

export class World {
  public group: THREE.Group;
  public bounds = { minX: -20, maxX: 20, minZ: -20, maxZ: 20 };
  public collision: CollisionManager;

  constructor() {
    this.group = new THREE.Group();
    this.collision = new CollisionManager(this.group);
    this.buildTerrain();
    this.buildRoad();
    this.buildFarm();
    this.buildForest();
    this.buildRiver();
    this.buildBuildings();
    this.buildDecorations();
  }

  private buildTerrain(): void {
    // Main ground
    const groundGeom = new THREE.PlaneGeometry(50, 50);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x7ec850 });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Dirt patches near farm
    const dirtGeom = new THREE.PlaneGeometry(12, 12);
    const dirtMat = new THREE.MeshLambertMaterial({ color: 0xc4a55a });
    const dirt = new THREE.Mesh(dirtGeom, dirtMat);
    dirt.rotation.x = -Math.PI / 2;
    dirt.position.set(6, 0, -2);
    dirt.receiveShadow = true;
    this.group.add(dirt);
  }

  private buildRoad(): void {
    // Main horizontal road
    const roadGeom = new THREE.PlaneGeometry(40, 2.5);
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const road = new THREE.Mesh(roadGeom, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, 4);
    road.receiveShadow = true;
    this.group.add(road);

    // Road markings
    for (let i = -18; i <= 18; i += 3) {
      const markGeom = new THREE.PlaneGeometry(1.5, 0.15);
      const markMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const mark = new THREE.Mesh(markGeom, markMat);
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(i, 0.02, 4);
      this.group.add(mark);
    }

    // Vertical path to farm
    const pathGeom = new THREE.PlaneGeometry(2, 10);
    const pathMat = new THREE.MeshLambertMaterial({ color: 0x9e8b6e });
    const path = new THREE.Mesh(pathGeom, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(6, 0.01, -1);
    path.receiveShadow = true;
    this.group.add(path);
  }

  private buildFarm(): void {
    // Farm fence
    const fenceMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const fencePositions = [
      { x: 4, z: -6, rx: 0, rz: 4 },
      { x: 8, z: -6, rx: 0, rz: 4 },
      { x: 4, z: 2, rx: 0, rz: 4 },
      { x: 8, z: 2, rx: 0, rz: 4 },
    ];

    // Simple fence with posts and rails
    const fenceGeom = new THREE.BoxGeometry(0.06, 0.6, 0.06);
    const railGeom = new THREE.BoxGeometry(0.04, 0.04, 4.2);

    // Top and bottom fences
    for (const x of [3.5, 8.5]) {
      for (let i = 0; i < 5; i++) {
        const post = new THREE.Mesh(fenceGeom, fenceMat);
        post.position.set(x, 0.3, -6 + i * 2);
        post.castShadow = true;
        this.group.add(post);
      }
      this.collision.addBox(`farm-fence-${x}`, new THREE.Vector3(x, 0.55, -2), new THREE.Vector3(0.32, 1.1, 8.4));
      const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 8.2), fenceMat);
      rail1.position.set(x, 0.45, -2);
      this.group.add(rail1);
      const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 8.2), fenceMat);
      rail2.position.set(x, 0.2, -2);
      this.group.add(rail2);
    }

    // Farm sign
    const signGeom = new THREE.BoxGeometry(1.5, 0.6, 0.08);
    const signMat = new THREE.MeshLambertMaterial({ color: 0xdeb887 });
    const sign = new THREE.Mesh(signGeom, signMat);
    sign.position.set(6, 1.2, -5.8);
    sign.castShadow = true;
    this.group.add(sign);

    const postGeom = new THREE.BoxGeometry(0.08, 1.0, 0.08);
    const postMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const signPost = new THREE.Mesh(postGeom, postMat);
    signPost.position.set(6, 0.6, -5.8);
    this.group.add(signPost);
  }

  private buildForest(): void {
    const treePositions = [
      new THREE.Vector3(-12, 0, -8),
      new THREE.Vector3(-10, 0, -10),
      new THREE.Vector3(-14, 0, -6),
      new THREE.Vector3(-11, 0, -12),
      new THREE.Vector3(-13, 0, -10),
      new THREE.Vector3(-15, 0, -8),
      new THREE.Vector3(-9, 0, -7),
      new THREE.Vector3(-16, 0, -10),
      new THREE.Vector3(-12, 0, -14),
      new THREE.Vector3(-14, 0, -13),
      new THREE.Vector3(-10, 0, -5),
      new THREE.Vector3(-8, 0, -12),
    ];

    for (const pos of treePositions) {
      this.createTree(pos);
    }
  }

  private createTree(pos: THREE.Vector3): void {
    const tree = new THREE.Group();

    // Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.12, 0.18, 1.2, 6);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = 0.6;
    trunk.castShadow = true;
    tree.add(trunk);

    // Foliage layers
    const foliageColors = [0x228B22, 0x2d8b2d, 0x1a7a1a];
    const sizes = [
      { r: 0.9, h: 1.0, y: 1.6 },
      { r: 0.7, h: 0.9, y: 2.2 },
      { r: 0.4, h: 0.7, y: 2.7 },
    ];

    sizes.forEach((s, i) => {
      const geom = new THREE.ConeGeometry(s.r, s.h, 6);
      const mat = new THREE.MeshLambertMaterial({ color: foliageColors[i] });
      const foliage = new THREE.Mesh(geom, mat);
      foliage.position.y = s.y;
      foliage.castShadow = true;
      tree.add(foliage);
    });

    tree.position.copy(pos);
    this.group.add(tree);
    this.collision.addBox(`tree-${pos.x}-${pos.z}`, new THREE.Vector3(pos.x, 0.8, pos.z), new THREE.Vector3(0.72, 1.6, 0.72));
  }

  private buildRiver(): void {
    // River on the right side
    const riverGeom = new THREE.PlaneGeometry(3, 30);
    const riverMat = new THREE.MeshLambertMaterial({ color: 0x3498db, transparent: true, opacity: 0.8 });
    const river = new THREE.Mesh(riverGeom, riverMat);
    river.rotation.x = -Math.PI / 2;
    river.position.set(16, 0.02, 0);
    river.receiveShadow = true;
    this.group.add(river);

    // River banks
    const bankGeom = new THREE.PlaneGeometry(2, 30);
    const bankMat = new THREE.MeshLambertMaterial({ color: 0x9e8b6e });
    const leftBank = new THREE.Mesh(bankGeom, bankMat);
    leftBank.rotation.x = -Math.PI / 2;
    leftBank.position.set(13.5, 0.01, 0);
    this.group.add(leftBank);
  }

  private buildBuildings(): void {
    // Small farmhouse
    this.createBuilding(new THREE.Vector3(-3, 0, -8), 0xdeb887, 2.5, 2, 2, 'Farmhouse');

    // Barn
    this.createBuilding(new THREE.Vector3(-3, 0, 8), 0xcd5c5c, 3, 2.5, 2.5, 'Barn');
  }

  private createBuilding(pos: THREE.Vector3, color: number, w: number, h: number, d: number, _name: string): void {
    const building = new THREE.Group();

    // Walls
    const wallGeom = new THREE.BoxGeometry(w, h, d);
    const wallMat = new THREE.MeshLambertMaterial({ color });
    const walls = new THREE.Mesh(wallGeom, wallMat);
    walls.position.y = h / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    building.add(walls);

    // Roof
    const roofShape = new THREE.Shape();
    roofShape.moveTo(-w / 2 - 0.2, 0);
    roofShape.lineTo(0, 1);
    roofShape.lineTo(w / 2 + 0.2, 0);
    roofShape.lineTo(-w / 2 - 0.2, 0);

    const roofGeom = new THREE.ExtrudeGeometry(roofShape, { depth: d + 0.4, bevelEnabled: false });
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(0, h, -d / 2 - 0.2);
    roof.castShadow = true;
    building.add(roof);

    // Door
    const doorGeom = new THREE.BoxGeometry(0.6, 1.2, 0.05);
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x5c3317 });
    const door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(0, 0.6, d / 2 + 0.03);
    building.add(door);

    // Window
    const winGeom = new THREE.BoxGeometry(0.5, 0.5, 0.05);
    const winMat = new THREE.MeshLambertMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.6 });
    const win = new THREE.Mesh(winGeom, winMat);
    win.position.set(w / 3, h / 2, d / 2 + 0.03);
    building.add(win);

    building.position.copy(pos);
    this.group.add(building);
    this.collision.addBox(`building-${pos.x}-${pos.z}`, new THREE.Vector3(pos.x, h / 2, pos.z), new THREE.Vector3(w + 0.25, h, d + 0.25));
  }

  private buildDecorations(): void {
    // Hay bales near barn
    const hayPositions = [
      new THREE.Vector3(-5, 0, 8),
      new THREE.Vector3(-6, 0.3, 7.5),
      new THREE.Vector3(-5.5, 0, 9),
    ];

    for (const pos of hayPositions) {
      const hayGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.6, 8);
      const hayMat = new THREE.MeshLambertMaterial({ color: 0xdaa520 });
      const hay = new THREE.Mesh(hayGeom, hayMat);
      hay.rotation.z = Math.PI / 2;
      hay.position.copy(pos);
      hay.position.y += 0.3;
      hay.castShadow = true;
      this.group.add(hay);
      this.collision.addBox(`hay-${pos.x}-${pos.z}`, new THREE.Vector3(pos.x, 0.42, pos.z), new THREE.Vector3(0.8, 0.85, 0.8));
    }

    // Flower patches
    const flowerPositions = [
      new THREE.Vector3(2, 0, 6),
      new THREE.Vector3(-1, 0, 7),
      new THREE.Vector3(8, 0, 7),
    ];

    const flowerColors = [0xff69b4, 0xffd700, 0xff4500, 0x9370db];

    for (const pos of flowerPositions) {
      for (let i = 0; i < 4; i++) {
        const flowerGeom = new THREE.SphereGeometry(0.06, 4, 4);
        const flowerMat = new THREE.MeshLambertMaterial({ color: flowerColors[i] });
        const flower = new THREE.Mesh(flowerGeom, flowerMat);
        flower.position.set(
          pos.x + (Math.random() - 0.5) * 1.5,
          0.1,
          pos.z + (Math.random() - 0.5) * 1.5
        );
        this.group.add(flower);
      }
    }

    // Rocks near river
    const rockPositions = [
      new THREE.Vector3(12, 0, 3),
      new THREE.Vector3(13, 0, -1),
      new THREE.Vector3(12.5, 0, 6),
    ];

    for (const pos of rockPositions) {
      const rockGeom = new THREE.DodecahedronGeometry(0.3, 0);
      const rockMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
      const rock = new THREE.Mesh(rockGeom, rockMat);
      rock.position.copy(pos);
      rock.position.y = 0.15;
      rock.castShadow = true;
      this.group.add(rock);
      this.collision.addBox(`rock-${pos.x}-${pos.z}`, new THREE.Vector3(pos.x, 0.35, pos.z), new THREE.Vector3(0.8, 0.7, 0.8));
    }
  }
}
