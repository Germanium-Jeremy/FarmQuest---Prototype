import * as THREE from 'three';
<<<<<<< HEAD
import { CharacterType } from '../data/CharacterType';
import { CharacterParts, PlayerModel } from './PlayerModel';
=======
import { CharacterType, PlayerModel } from './PlayerModel';
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7

export class Player {
  public mesh: THREE.Group;
  public body: THREE.Mesh;
  public speed = 8;
  public interactRange = 2.5;
  public collisionRadius = 0.36;
  private facingDirection = new THREE.Vector3(0, 0, 1);
  private leftArmPivot: THREE.Group;
  private rightArmPivot: THREE.Group;
  private leftLegPivot: THREE.Group;
  private rightLegPivot: THREE.Group;
  private runTime = 0;
  private parts: CharacterParts;

  constructor(characterType: CharacterType = 'male') {
<<<<<<< HEAD
    this.parts = PlayerModel.create(characterType);
    this.mesh = this.parts.root;
    this.body = this.parts.body;
    this.leftArmPivot = this.parts.leftArmPivot;
    this.rightArmPivot = this.parts.rightArmPivot;
    this.leftLegPivot = this.parts.leftLegPivot;
    this.rightLegPivot = this.parts.rightLegPivot;
=======
    const parts = PlayerModel.create(characterType);
    this.mesh = parts.root;
    this.body = parts.body;
    this.leftArmPivot = parts.leftArmPivot;
    this.rightArmPivot = parts.rightArmPivot;
    this.leftLegPivot = parts.leftLegPivot;
    this.rightLegPivot = parts.rightLegPivot;

    // Shadow blob
    const shadowGeom = new THREE.CircleGeometry(0.4, 12);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 });
    const shadow = new THREE.Mesh(shadowGeom, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    this.mesh.add(shadow);

>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
    this.mesh.position.set(0, 0, 6);
  }

  getFacingDirection(): THREE.Vector3 {
    return this.facingDirection.clone();
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  update(
    delta: number,
    keys: Set<string>,
    worldBounds: { minX: number; maxX: number; minZ: number; maxZ: number },
    canMoveTo: (position: THREE.Vector3, radius: number) => boolean = () => true,
  ): void {
    const moveDir = new THREE.Vector3(0, 0, 0);

    if (keys.has('KeyW') || keys.has('ArrowUp')) moveDir.z -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) moveDir.z += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) moveDir.x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) moveDir.x += 1;

    const isMoving = moveDir.length() > 0;
    if (isMoving) {
      moveDir.normalize();
      this.facingDirection.copy(moveDir);

      const moveX = moveDir.x * this.speed * delta;
      const moveZ = moveDir.z * this.speed * delta;
      const nextX = this.mesh.position.clone();
      nextX.x = Math.max(worldBounds.minX, Math.min(worldBounds.maxX, nextX.x + moveX));
      if (canMoveTo(nextX, this.collisionRadius)) this.mesh.position.x = nextX.x;

      const nextZ = this.mesh.position.clone();
      nextZ.z = Math.max(worldBounds.minZ, Math.min(worldBounds.maxZ, nextZ.z + moveZ));
      if (canMoveTo(nextZ, this.collisionRadius)) this.mesh.position.z = nextZ.z;

      // Rotate body to face movement direction
      const angle = Math.atan2(moveDir.x, moveDir.z);
      let diff = angle - this.mesh.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.mesh.rotation.y += diff * Math.min(1, delta * 12);
    }

    this.animateLimbs(delta, isMoving);
  }

  private animateLimbs(delta: number, isMoving: boolean): void {
    if (isMoving) {
      this.runTime += delta;
      const swing = Math.sin(this.runTime * 10) * 0.55;
      this.leftArmPivot.rotation.x = swing;
      this.rightArmPivot.rotation.x = -swing;
      this.leftLegPivot.rotation.x = -swing;
      this.rightLegPivot.rotation.x = swing;
      this.body.position.y = this.body.position.y + (0.7 - this.body.position.y) * 0; // keep current base
      this.body.position.y += Math.abs(Math.sin(this.runTime * 10)) * 0.04;
      return;
    }

    for (const pivot of [this.leftArmPivot, this.rightArmPivot, this.leftLegPivot, this.rightLegPivot]) {
      pivot.rotation.x += (0 - pivot.rotation.x) * Math.min(1, delta * 8);
    }
    this.body.position.y += (0.7 - this.body.position.y) * Math.min(1, delta * 8);
  }
}
