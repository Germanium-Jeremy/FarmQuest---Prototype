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

    const bodyGeom = new THREE.BoxGeometry(0.5, 0.8, 0.3);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x4a90d9 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.7;
    body.castShadow = true;
    root.add(body);

    const headGeom = new THREE.SphereGeometry(0.22, 8, 6);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xf5cba7 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.35;
    head.castShadow = true;
    root.add(head);

    // Straw hat
    const hat = new THREE.Group();
    const hatBrimGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8);
    const hatMat = new THREE.MeshLambertMaterial({ color: 0xd4a017 });
    const hatBrim = new THREE.Mesh(hatBrimGeom, hatMat);
    hatBrim.position.y = 1.5;
    hat.add(hatBrim);
    const hatTopGeom = new THREE.CylinderGeometry(0.18, 0.2, 0.2, 8);
    const hatTop = new THREE.Mesh(hatTopGeom, hatMat);
    hatTop.position.y = 1.62;
    hat.add(hatTop);
    root.add(hat);

    const limbMat = new THREE.MeshLambertMaterial({ color: 0x2f6fb3 });
    const legMat = new THREE.MeshLambertMaterial({ color: 0x315033 });
    const handMat = new THREE.MeshLambertMaterial({ color: 0xf5cba7 });

    const leftArmPivot = PlayerModel.createLimbPivot(-0.38, 1.02, 0, new THREE.BoxGeometry(0.16, 0.62, 0.16), limbMat, -0.32);
    const rightArmPivot = PlayerModel.createLimbPivot(0.38, 1.02, 0, new THREE.BoxGeometry(0.16, 0.62, 0.16), limbMat, -0.32);
    const leftLegPivot = PlayerModel.createLimbPivot(-0.16, 0.35, 0, new THREE.BoxGeometry(0.18, 0.58, 0.18), legMat, -0.3);
    const rightLegPivot = PlayerModel.createLimbPivot(0.16, 0.35, 0, new THREE.BoxGeometry(0.18, 0.58, 0.18), legMat, -0.3);
    root.add(leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot);

    PlayerModel.addHands(leftArmPivot, rightArmPivot, handMat);
    const shadow = PlayerModel.createShadow();
    root.add(shadow);

    return { root, body, head, leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot, hat, shadow };
  }

  private static createFemale(): CharacterParts {
    const root = new THREE.Group();

    // Slightly narrower torso
    const bodyGeom = new THREE.BoxGeometry(0.44, 0.75, 0.28);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x9b59b6 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.68;
    body.castShadow = true;
    root.add(body);

    const headGeom = new THREE.SphereGeometry(0.22, 8, 6);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xf0c8a0 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.33;
    head.castShadow = true;
    root.add(head);

    // Hair bun
    const hair = new THREE.Group();
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
    const bunGeom = new THREE.SphereGeometry(0.12, 6, 5);
    const bun = new THREE.Mesh(bunGeom, hairMat);
    bun.position.set(0, 1.5, -0.15);
    hair.add(bun);
    // Top hair
    const topHairGeom = new THREE.SphereGeometry(0.24, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const topHair = new THREE.Mesh(topHairGeom, hairMat);
    topHair.position.y = 1.38;
    hair.add(topHair);
    // Flower
    const flowerMat = new THREE.MeshLambertMaterial({ color: 0xff69b4 });
    const flowerGeom = new THREE.SphereGeometry(0.05, 5, 4);
    const flower = new THREE.Mesh(flowerGeom, flowerMat);
    flower.position.set(0.18, 1.55, 0.05);
    hair.add(flower);
    root.add(hair);

    const limbMat = new THREE.MeshLambertMaterial({ color: 0x7d3c98 });
    const legMat = new THREE.MeshLambertMaterial({ color: 0x6c3483 });
    const handMat = new THREE.MeshLambertMaterial({ color: 0xf0c8a0 });

    const leftArmPivot = PlayerModel.createLimbPivot(-0.34, 1.0, 0, new THREE.BoxGeometry(0.14, 0.58, 0.14), limbMat, -0.3);
    const rightArmPivot = PlayerModel.createLimbPivot(0.34, 1.0, 0, new THREE.BoxGeometry(0.14, 0.58, 0.14), limbMat, -0.3);
    const leftLegPivot = PlayerModel.createLimbPivot(-0.14, 0.32, 0, new THREE.BoxGeometry(0.16, 0.56, 0.16), legMat, -0.28);
    const rightLegPivot = PlayerModel.createLimbPivot(0.14, 0.32, 0, new THREE.BoxGeometry(0.16, 0.56, 0.16), legMat, -0.28);
    root.add(leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot);

    PlayerModel.addHands(leftArmPivot, rightArmPivot, handMat);
    const shadow = PlayerModel.createShadow();
    root.add(shadow);

    return { root, body, head, leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot, hair, shadow };
  }

  private static createRobot(): CharacterParts {
    const root = new THREE.Group();

    // Silver box body
    const bodyGeom = new THREE.BoxGeometry(0.52, 0.82, 0.32);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x95a5a6 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.7;
    body.castShadow = true;
    root.add(body);

    // Chest light
    const chestLightMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const chestLight = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), chestLightMat);
    chestLight.position.set(0, 0.8, 0.17);
    root.add(chestLight);

    // Metallic box head
    const headGeom = new THREE.BoxGeometry(0.36, 0.32, 0.32);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xbdc3c7 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.35;
    head.castShadow = true;
    root.add(head);

    // Glowing cyan eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), eyeMat);
    leftEye.position.set(-0.08, 1.38, 0.17);
    root.add(leftEye);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), eyeMat);
    rightEye.position.set(0.08, 1.38, 0.17);
    root.add(rightEye);

    // Antenna
    const antenna = new THREE.Group();
    const antennaPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.3, 4),
      new THREE.MeshLambertMaterial({ color: 0x7f8c8d }),
    );
    antennaPole.position.y = 1.66;
    antenna.add(antennaPole);
    const antennaTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0x00ff88 }),
    );
    antennaTip.position.y = 1.82;
    antenna.add(antennaTip);
    root.add(antenna);

    // Dark grey segmented limbs
    const limbMat = new THREE.MeshLambertMaterial({ color: 0x7f8c8d });
    const legMat = new THREE.MeshLambertMaterial({ color: 0x7f8c8d });

    const leftArmPivot = PlayerModel.createLimbPivot(-0.38, 1.02, 0, new THREE.BoxGeometry(0.14, 0.6, 0.14), limbMat, -0.32);
    const rightArmPivot = PlayerModel.createLimbPivot(0.38, 1.02, 0, new THREE.BoxGeometry(0.14, 0.6, 0.14), limbMat, -0.32);
    const leftLegPivot = PlayerModel.createLimbPivot(-0.16, 0.35, 0, new THREE.BoxGeometry(0.16, 0.56, 0.16), legMat, -0.3);
    const rightLegPivot = PlayerModel.createLimbPivot(0.16, 0.35, 0, new THREE.BoxGeometry(0.16, 0.56, 0.16), legMat, -0.3);
    root.add(leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot);

    // Robot hands (metallic)
    const handMat = new THREE.MeshLambertMaterial({ color: 0xbdc3c7 });
    PlayerModel.addHands(leftArmPivot, rightArmPivot, handMat);
    const shadow = PlayerModel.createShadow();
    root.add(shadow);

    return { root, body, head, leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot, antenna, shadow };
  }

  private static createLimbPivot(
    x: number, y: number, z: number,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    meshY: number,
  ): THREE.Group {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    const limb = new THREE.Mesh(geometry, material);
    limb.position.y = meshY;
    limb.castShadow = true;
    pivot.add(limb);
    return pivot;
  }

  private static addHands(leftPivot: THREE.Group, rightPivot: THREE.Group, handMat: THREE.Material): void {
    for (const pivot of [leftPivot, rightPivot]) {
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), handMat);
      hand.position.y = -0.68;
      hand.castShadow = true;
      pivot.add(hand);
    }
  }

  private static createShadow(): THREE.Mesh {
    const shadowGeom = new THREE.CircleGeometry(0.4, 12);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 });
    const shadow = new THREE.Mesh(shadowGeom, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    return shadow;
  }
}
