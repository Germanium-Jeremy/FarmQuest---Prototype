import * as THREE from 'three';
import { Interactable } from './Interactable';

export class Seed implements Interactable {
  public mesh: THREE.Group;
  public label: string;
  private available = true;
  private onInteract: (() => void) | null = null;
  private glowMesh: THREE.Mesh;
  private floatOffset = 0;

  constructor(position: THREE.Vector3, type: 'maize' | 'coffee' = 'maize') {
    this.mesh = new THREE.Group();
    this.label = type === 'maize' ? 'Pick up Maize Seeds' : 'Discover Coffee Seeds';

    // Seed packet - small box
    const packetGeom = new THREE.BoxGeometry(0.3, 0.4, 0.15);
    const packetColor = type === 'maize' ? 0xffd700 : 0x8B4513;
    const packetMat = new THREE.MeshLambertMaterial({ color: packetColor });
    const packet = new THREE.Mesh(packetGeom, packetMat);
    packet.position.y = 0.8;
    packet.castShadow = true;
    this.mesh.add(packet);

    // Glow ring
    const glowGeom = new THREE.RingGeometry(0.4, 0.55, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: type === 'maize' ? 0xffff00 : 0xff6600,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    this.glowMesh = new THREE.Mesh(glowGeom, glowMat);
    this.glowMesh.rotation.x = -Math.PI / 2;
    this.glowMesh.position.y = 0.05;
    this.mesh.add(this.glowMesh);

    // Particle-like small spheres around seed
    const particleCount = 5;
    for (let i = 0; i < particleCount; i++) {
      const particleGeom = new THREE.SphereGeometry(0.04, 4, 4);
      const particleMat = new THREE.MeshBasicMaterial({ color: type === 'maize' ? 0xffff00 : 0xff8800 });
      const particle = new THREE.Mesh(particleGeom, particleMat);
      const angle = (i / particleCount) * Math.PI * 2;
      particle.position.set(Math.cos(angle) * 0.35, 0.8, Math.sin(angle) * 0.35);
      particle.userData.angle = angle;
      particle.userData.speed = 1.5 + Math.random() * 0.5;
      this.mesh.add(particle);
    }

    this.mesh.position.copy(position);
  }

  setOnInteract(callback: () => void): void {
    this.onInteract = callback;
  }

  interact(): void {
    if (!this.available) return;
    this.available = false;
    this.mesh.visible = false;
    this.onInteract?.();
  }

  isAvailable(): boolean {
    return this.available;
  }

  reset(): void {
    this.available = true;
    this.mesh.visible = true;
  }

  update(time: number): void {
    if (!this.available) return;
    // Float animation
    this.mesh.children[0].position.y = 0.8 + Math.sin(time * 2) * 0.15;
    // Glow pulse
    (this.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(time * 3) * 0.2;
    this.glowMesh.rotation.z = time * 0.5;
  }
}
