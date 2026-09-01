import * as THREE from 'three';

export type WorldObstacle = {
  id: string;
  collider: THREE.Box3;
};

const DEBUG_COLLIDERS = false;

export class CollisionManager {
  private obstacles: WorldObstacle[] = [];
  private dynamicObstacles: WorldObstacle[] = [];
  private helpers: THREE.Box3Helper[] = [];

  constructor(private group: THREE.Group) {}

  addBox(id: string, center: THREE.Vector3, size: THREE.Vector3): void {
    const half = size.clone().multiplyScalar(0.5);
    const collider = new THREE.Box3(center.clone().sub(half), center.clone().add(half));
    this.obstacles.push({ id, collider });

    if (DEBUG_COLLIDERS) {
      const helper = new THREE.Box3Helper(collider, 0xff3355);
      this.helpers.push(helper);
      this.group.add(helper);
    }
  }

  addDynamicBox(id: string, center: THREE.Vector3, size: THREE.Vector3): void {
    const half = size.clone().multiplyScalar(0.5);
    const collider = new THREE.Box3(center.clone().sub(half), center.clone().add(half));
    this.dynamicObstacles.push({ id, collider });

    if (DEBUG_COLLIDERS) {
      const helper = new THREE.Box3Helper(collider, 0x33aaff);
      this.helpers.push(helper);
      this.group.add(helper);
    }
  }

  clearDynamic(): void {
    this.dynamicObstacles = [];
  }

  canMoveTo(position: THREE.Vector3, radius: number): boolean {
    const playerBox = new THREE.Box3(
      new THREE.Vector3(position.x - radius, 0, position.z - radius),
      new THREE.Vector3(position.x + radius, 1.5, position.z + radius),
    );
    return ![...this.obstacles, ...this.dynamicObstacles].some((obstacle) => obstacle.collider.intersectsBox(playerBox));
  }

  getObstacles(): WorldObstacle[] {
    return [...this.obstacles, ...this.dynamicObstacles];
  }
}
