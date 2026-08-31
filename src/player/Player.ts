import * as THREE from 'three';

export class Player {
  public mesh: THREE.Group;
  public body: THREE.Mesh;
  public speed = 8;
  public interactRange = 2.5;
  private facingDirection = new THREE.Vector3(0, 0, 1);

  constructor() {
    this.mesh = new THREE.Group();

    // Body - simple humanoid shape
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

    // Shadow blob
    const shadowGeom = new THREE.CircleGeometry(0.4, 12);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 });
    const shadow = new THREE.Mesh(shadowGeom, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    this.mesh.add(shadow);

    this.mesh.position.set(0, 0, 6);
  }

  getFacingDirection(): THREE.Vector3 {
    return this.facingDirection.clone();
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  update(delta: number, keys: Set<string>, worldBounds: { minX: number; maxX: number; minZ: number; maxZ: number }): void {
    const moveDir = new THREE.Vector3(0, 0, 0);

    if (keys.has('KeyW') || keys.has('ArrowUp')) moveDir.z -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) moveDir.z += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) moveDir.x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) moveDir.x += 1;

    if (moveDir.length() > 0) {
      moveDir.normalize();
      this.facingDirection.copy(moveDir);

      this.mesh.position.x += moveDir.x * this.speed * delta;
      this.mesh.position.z += moveDir.z * this.speed * delta;

      // Clamp to world bounds
      this.mesh.position.x = Math.max(worldBounds.minX, Math.min(worldBounds.maxX, this.mesh.position.x));
      this.mesh.position.z = Math.max(worldBounds.minZ, Math.min(worldBounds.maxZ, this.mesh.position.z));

      // Rotate body to face movement direction
      const angle = Math.atan2(moveDir.x, moveDir.z);
      this.mesh.rotation.y = angle;
    }
  }
}
