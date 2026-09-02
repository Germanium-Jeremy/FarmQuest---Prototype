import * as THREE from 'three';
import { CharacterType } from '../data/CharacterType';

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
  shadow: THREE.Mesh;
}

export class PlayerModel {
  static create(type: CharacterType): CharacterParts {
    switch (type) {
      case 'female': return PlayerModel.createFemale();
      case 'robot': return PlayerModel.createRobot();
      default: return PlayerModel.createMale();
    }
  }

  private static createMale(): CharacterParts {
    const root = new THREE.Group();
    const body = PlayerModel.makeMesh(new THREE.BoxGeometry(0.5, 0.8, 0.3), 0x4a90d9, 0, 0.7, 0);
    const head = PlayerModel.makeMesh(new THREE.SphereGeometry(0.22, 8, 6), 0xf5cba7, 0, 1.35, 0);
    root.add(body, head);

    const hat = new THREE.Group();
    hat.add(PlayerModel.makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8), 0xd4a017, 0, 1.5, 0));
    hat.add(PlayerModel.makeMesh(new THREE.CylinderGeometry(0.18, 0.2, 0.2, 8), 0xd4a017, 0, 1.62, 0));
    root.add(hat);

    const parts = PlayerModel.createLimbs(root, 0x2f6fb3, 0x315033, 0xf5cba7);
    const shadow = PlayerModel.makeShadow();
    root.add(shadow);
    return { root, body, head, hat, ...parts, shadow };
  }

  private static createFemale(): CharacterParts {
    const root = new THREE.Group();
    const body = PlayerModel.makeMesh(new THREE.BoxGeometry(0.44, 0.75, 0.28), 0x9b59b6, 0, 0.68, 0);
    const head = PlayerModel.makeMesh(new THREE.SphereGeometry(0.22, 8, 6), 0xf0c8a0, 0, 1.33, 0);
    root.add(body, head);

    const hair = new THREE.Group();
    hair.add(PlayerModel.makeMesh(new THREE.SphereGeometry(0.24, 8, 6), 0x3e2723, 0, 1.44, -0.04));
    hair.add(PlayerModel.makeMesh(new THREE.SphereGeometry(0.13, 8, 6), 0x3e2723, 0, 1.35, -0.24));
    hair.add(PlayerModel.makeMesh(new THREE.SphereGeometry(0.045, 6, 4), 0xff69b4, 0.16, 1.52, 0.12));
    root.add(hair);

    const parts = PlayerModel.createLimbs(root, 0x7d3c98, 0x6c3483, 0xf0c8a0);
    const shadow = PlayerModel.makeShadow();
    root.add(shadow);
    return { root, body, head, hair, ...parts, shadow };
  }

  private static createRobot(): CharacterParts {
    const root = new THREE.Group();
    const body = PlayerModel.makeMesh(new THREE.BoxGeometry(0.52, 0.82, 0.32), 0x95a5a6, 0, 0.7, 0);
    const head = PlayerModel.makeMesh(new THREE.BoxGeometry(0.36, 0.32, 0.32), 0xbdc3c7, 0, 1.35, 0);
    root.add(body, head);

    // Eyes
    root.add(PlayerModel.makeMesh(new THREE.SphereGeometry(0.04, 6, 5), 0x00ffff, -0.08, 1.38, 0.17, true));
    root.add(PlayerModel.makeMesh(new THREE.SphereGeometry(0.04, 6, 5), 0x00ffff, 0.08, 1.38, 0.17, true));
    root.add(PlayerModel.makeMesh(new THREE.SphereGeometry(0.05, 6, 5), 0x00ff88, 0, 0.8, 0.17, true));

    // Antenna
    const antenna = new THREE.Group();
    antenna.add(PlayerModel.makeMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 4), 0x7f8c8d, 0, 1.66, 0));
    antenna.add(PlayerModel.makeMesh(new THREE.SphereGeometry(0.04, 6, 5), 0x00ff88, 0, 1.82, 0, true));
    root.add(antenna);

    const parts = PlayerModel.createLimbs(root, 0x7f8c8d, 0x7f8c8d, 0xbdc3c7);
    const shadow = PlayerModel.makeShadow();
    root.add(shadow);
    return { root, body, head, antenna, ...parts, shadow };
  }

  private static createLimbs(
    root: THREE.Group,
    limbColor: number,
    legColor: number,
    handColor: number,
  ): Pick<CharacterParts, 'leftArmPivot' | 'rightArmPivot' | 'leftLegPivot' | 'rightLegPivot'> {
    const leftArmPivot = PlayerModel.createLimbPivot(-0.38, 1.02, 0, new THREE.BoxGeometry(0.16, 0.62, 0.16), limbColor, -0.32);
    const rightArmPivot = PlayerModel.createLimbPivot(0.38, 1.02, 0, new THREE.BoxGeometry(0.16, 0.62, 0.16), limbColor, -0.32);
    const leftLegPivot = PlayerModel.createLimbPivot(-0.16, 0.35, 0, new THREE.BoxGeometry(0.18, 0.58, 0.18), legColor, -0.3);
    const rightLegPivot = PlayerModel.createLimbPivot(0.16, 0.35, 0, new THREE.BoxGeometry(0.18, 0.58, 0.18), legColor, -0.3);
    root.add(leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot);

    for (const pivot of [leftArmPivot, rightArmPivot]) {
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), new THREE.MeshLambertMaterial({ color: handColor }));
      hand.position.y = -0.68;
      hand.castShadow = true;
      pivot.add(hand);
    }

    return { leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot };
  }

  private static createLimbPivot(
    x: number, y: number, z: number,
    geometry: THREE.BufferGeometry,
    color: number,
    meshY: number,
  ): THREE.Group {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    const limb = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color }));
    limb.position.y = meshY;
    limb.castShadow = true;
    pivot.add(limb);
    return pivot;
  }

  private static makeMesh(geometry: THREE.BufferGeometry, color: number, x: number, y: number, z: number, emissive = false): THREE.Mesh {
    const material = emissive
      ? new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.35 })
      : new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    return mesh;
  }

  private static makeShadow(): THREE.Mesh {
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.4, 12),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    return shadow;
  }
}
