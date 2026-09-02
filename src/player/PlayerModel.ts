import * as THREE from 'three';

export type CharacterType = 'male' | 'female' | 'robot';

export interface CharacterParts {
  root: THREE.Group;
  body: THREE.Mesh;
  head: THREE.Mesh;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  hat?: THREE.Object3D;
  hair?: THREE.Object3D;
  antenna?: THREE.Object3D;
}

export class PlayerModel {
  static create(type: CharacterType): CharacterParts {
    if (type === 'female') return this.createFemale();
    if (type === 'robot') return this.createRobot();
    return this.createMale();
  }

  private static createMale(): CharacterParts {
    const root = new THREE.Group();
    const body = this.mesh(new THREE.BoxGeometry(0.5, 0.8, 0.3), 0x4a90d9, 0, 0.7, 0);
    const head = this.mesh(new THREE.SphereGeometry(0.22, 8, 6), 0xf5cba7, 0, 1.35, 0);
    root.add(body, head);

    const hat = new THREE.Group();
    hat.add(this.mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8), 0xd4a017, 0, 1.5, 0));
    hat.add(this.mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.2, 8), 0xd4a017, 0, 1.62, 0));
    root.add(hat);

    const parts = this.createLimbs(root, 0x2f6fb3, 0x315033, 0xf5cba7);
    return { root, body, head, hat, ...parts };
  }

  private static createFemale(): CharacterParts {
    const root = new THREE.Group();
    const body = this.mesh(new THREE.BoxGeometry(0.42, 0.82, 0.28), 0x9b59b6, 0, 0.7, 0);
    const head = this.mesh(new THREE.SphereGeometry(0.22, 8, 6), 0xf0c8a0, 0, 1.35, 0);
    root.add(body, head);

    const hair = new THREE.Group();
    hair.add(this.mesh(new THREE.SphereGeometry(0.24, 8, 6), 0x3e2723, 0, 1.44, -0.04));
    hair.add(this.mesh(new THREE.SphereGeometry(0.13, 8, 6), 0x3e2723, 0, 1.35, -0.24));
    hair.add(this.mesh(new THREE.SphereGeometry(0.045, 6, 4), 0xff69b4, 0.16, 1.52, 0.12));
    root.add(hair);

    const parts = this.createLimbs(root, 0x7d3c98, 0x6c3483, 0xf0c8a0);
    return { root, body, head, hair, ...parts };
  }

  private static createRobot(): CharacterParts {
    const root = new THREE.Group();
    const body = this.mesh(new THREE.BoxGeometry(0.58, 0.82, 0.36), 0x95a5a6, 0, 0.7, 0);
    const head = this.mesh(new THREE.BoxGeometry(0.42, 0.34, 0.34), 0xbdc3c7, 0, 1.36, 0);
    root.add(body, head);

    root.add(this.mesh(new THREE.SphereGeometry(0.045, 8, 6), 0x00ffff, -0.11, 1.39, 0.18, true));
    root.add(this.mesh(new THREE.SphereGeometry(0.045, 8, 6), 0x00ffff, 0.11, 1.39, 0.18, true));
    root.add(this.mesh(new THREE.SphereGeometry(0.06, 8, 6), 0x00ff88, 0, 0.76, 0.2, true));

    const antenna = new THREE.Group();
    antenna.add(this.mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.32, 6), 0x7f8c8d, 0, 1.72, 0));
    antenna.add(this.mesh(new THREE.SphereGeometry(0.055, 8, 6), 0x00ff88, 0, 1.91, 0, true));
    root.add(antenna);

    const parts = this.createLimbs(root, 0x7f8c8d, 0x7f8c8d, 0x00ff88, true);
    return { root, body, head, antenna, ...parts };
  }

  private static createLimbs(
    root: THREE.Group,
    limbColor: number,
    legColor: number,
    handColor: number,
    segmented = false,
  ): Pick<CharacterParts, 'leftArmPivot' | 'rightArmPivot' | 'leftLegPivot' | 'rightLegPivot'> {
    const armGeom = segmented ? new THREE.BoxGeometry(0.14, 0.28, 0.14) : new THREE.BoxGeometry(0.16, 0.62, 0.16);
    const legGeom = segmented ? new THREE.BoxGeometry(0.16, 0.28, 0.16) : new THREE.BoxGeometry(0.18, 0.58, 0.18);
    const leftArmPivot = this.createLimbPivot(-0.38, 1.02, 0, armGeom, limbColor, segmented ? [-0.18, -0.5] : [-0.32]);
    const rightArmPivot = this.createLimbPivot(0.38, 1.02, 0, armGeom, limbColor, segmented ? [-0.18, -0.5] : [-0.32]);
    const leftLegPivot = this.createLimbPivot(-0.16, 0.35, 0, legGeom, legColor, segmented ? [-0.16, -0.44] : [-0.3]);
    const rightLegPivot = this.createLimbPivot(0.16, 0.35, 0, legGeom, legColor, segmented ? [-0.16, -0.44] : [-0.3]);
    root.add(leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot);

    for (const pivot of [leftArmPivot, rightArmPivot]) {
      pivot.add(this.mesh(new THREE.SphereGeometry(segmented ? 0.075 : 0.09, 6, 5), handColor, 0, segmented ? -0.7 : -0.68, 0, segmented));
    }

    return { leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot };
  }

  private static createLimbPivot(
    x: number,
    y: number,
    z: number,
    geometry: THREE.BufferGeometry,
    color: number,
    segmentY: number[],
  ): THREE.Group {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    for (const meshY of segmentY) {
      pivot.add(this.mesh(geometry, color, 0, meshY, 0));
    }
    return pivot;
  }

  private static mesh(geometry: THREE.BufferGeometry, color: number, x: number, y: number, z: number, emissive = false): THREE.Mesh {
    const material = emissive
      ? new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.35 })
      : new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    return mesh;
  }
}
