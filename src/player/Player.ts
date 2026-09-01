import * as THREE from 'three';

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

  constructor() {
    this.mesh = new THREE.Group();

    // Body
    const bodyGeom = new THREE.BoxGeometry(0.5, 0.8, 0.3);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x4a90d9 });
    this.body = new THREE.Mesh(bodyGeom, bodyMat);
    this.body.position.y = 0.7;
    this.body.castShadow = true;
    this.mesh.add(this.body);

    // Head
    const headGeom = new THREE.SphereGeometry(0.22, 8, 6);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xf5cba7 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.35;
    head.castShadow = true;
    this.mesh.add(head);

    // Hat
    const hatBrimGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8);
    const hatMat = new THREE.MeshLambertMaterial({ color: 0xd4a017 });
    const hatBrim = new THREE.Mesh(hatBrimGeom, hatMat);
    hatBrim.position.y = 1.5;
    this.mesh.add(hatBrim);

    const hatTopGeom = new THREE.CylinderGeometry(0.18, 0.2, 0.2, 8);
    const hatTop = new THREE.Mesh(hatTopGeom, hatMat);
    hatTop.position.y = 1.62;
    this.mesh.add(hatTop);

    const limbMat = new THREE.MeshLambertMaterial({ color: 0x2f6fb3 });
    const legMat = new THREE.MeshLambertMaterial({ color: 0x315033 });
    const handMat = new THREE.MeshLambertMaterial({ color: 0xf5cba7 });

    this.leftArmPivot = this.createLimbPivot(-0.38, 1.02, 0, new THREE.BoxGeometry(0.16, 0.62, 0.16), limbMat, -0.32);
    this.rightArmPivot = this.createLimbPivot(0.38, 1.02, 0, new THREE.BoxGeometry(0.16, 0.62, 0.16), limbMat, -0.32);
    this.leftLegPivot = this.createLimbPivot(-0.16, 0.35, 0, new THREE.BoxGeometry(0.18, 0.58, 0.18), legMat, -0.3);
    this.rightLegPivot = this.createLimbPivot(0.16, 0.35, 0, new THREE.BoxGeometry(0.18, 0.58, 0.18), legMat, -0.3);
    this.mesh.add(this.leftArmPivot, this.rightArmPivot, this.leftLegPivot, this.rightLegPivot);

    for (const pivot of [this.leftArmPivot, this.rightArmPivot]) {
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), handMat);
      hand.position.y = -0.68;
      hand.castShadow = true;
      pivot.add(hand);
    }

    // Shadow blob
    const shadowGeom = new THREE.CircleGeometry(0.4, 12);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 });
    const shadow = new THREE.Mesh(shadowGeom, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    this.mesh.add(shadow);

    this.mesh.position.set(0, 0, 6);
  }

  private createLimbPivot(
    x: number,
    y: number,
    z: number,
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
      this.body.position.y = 0.7 + Math.abs(Math.sin(this.runTime * 10)) * 0.04;
      return;
    }

    for (const pivot of [this.leftArmPivot, this.rightArmPivot, this.leftLegPivot, this.rightLegPivot]) {
      pivot.rotation.x += (0 - pivot.rotation.x) * Math.min(1, delta * 8);
    }
    this.body.position.y += (0.7 - this.body.position.y) * Math.min(1, delta * 8);
  }
}
