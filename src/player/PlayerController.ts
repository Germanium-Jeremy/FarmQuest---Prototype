import { Player } from "./Player";
import * as THREE from "three";

export class PlayerController {
  private keys = new Set<string>();
  private virtualMove = new THREE.Vector2();
  private interactPressed = false;
  private interactJustPressed = false;

  constructor() {
    this.setupKeyboard();
  }

  attachTouchControls(container: HTMLElement): void {
    const controls = document.createElement("div");
    controls.style.cssText =
      "position:absolute;inset:0;display:none;pointer-events:none;z-index:12;";

    const joystick = document.createElement("div");
    joystick.style.cssText =
      "position:absolute;left:22px;bottom:24px;width:132px;height:132px;border:2px solid rgba(255,255,255,0.5);border-radius:50%;background:rgba(20,43,27,0.48);pointer-events:all;touch-action:none;";
    const stick = document.createElement("div");
    stick.style.cssText =
      "position:absolute;left:50%;top:50%;width:58px;height:58px;margin:-29px;border-radius:50%;background:rgba(255,227,109,0.92);border:3px solid #fff8c7;box-shadow:0 5px 14px rgba(0,0,0,0.3);pointer-events:none;";
    joystick.appendChild(stick);

    const interact = document.createElement("button");
    interact.type = "button";
    interact.textContent = "INTERACT";
    interact.setAttribute("aria-label", "Interact with nearby object");
    interact.style.cssText =
      "position:absolute;right:22px;bottom:34px;width:112px;height:112px;border-radius:50%;border:3px solid #fff8c7;background:rgba(47,143,58,0.92);color:white;font:900 14px Segoe UI,sans-serif;letter-spacing:0;box-shadow:0 5px 14px rgba(0,0,0,0.3);pointer-events:all;touch-action:none;";

    const resetJoystick = (): void => {
      this.virtualMove.set(0, 0);
      stick.style.transform = "translate(0, 0)";
    };
    const updateJoystick = (event: PointerEvent): void => {
      const rect = joystick.getBoundingClientRect();
      const radius = rect.width / 2;
      const maxDistance = radius - 32;
      const x = event.clientX - (rect.left + radius);
      const y = event.clientY - (rect.top + radius);
      const distance = Math.min(maxDistance, Math.hypot(x, y));
      const angle = Math.atan2(y, x);
      const offsetX = Math.cos(angle) * distance;
      const offsetY = Math.sin(angle) * distance;
      this.virtualMove.set(offsetX / maxDistance, offsetY / maxDistance);
      stick.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    };

    joystick.addEventListener("pointerdown", (event) => {
      joystick.setPointerCapture(event.pointerId);
      updateJoystick(event);
    });
    joystick.addEventListener("pointermove", (event) => {
      if (joystick.hasPointerCapture(event.pointerId)) updateJoystick(event);
    });
    joystick.addEventListener("pointerup", (event) => {
      joystick.releasePointerCapture(event.pointerId);
      resetJoystick();
    });
    joystick.addEventListener("pointercancel", resetJoystick);
    interact.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (!this.interactPressed) this.interactJustPressed = true;
      this.interactPressed = true;
    });
    const releaseInteract = (): void => {
      this.interactPressed = false;
    };
    interact.addEventListener("pointerup", releaseInteract);
    interact.addEventListener("pointercancel", releaseInteract);
    interact.addEventListener("pointerleave", releaseInteract);

    controls.append(joystick, interact);
    container.appendChild(controls);

    const touchQuery = window.matchMedia(
      "(pointer: coarse), (max-width: 900px)",
    );
    const updateVisibility = (): void => {
      controls.style.display =
        touchQuery.matches || navigator.maxTouchPoints > 0 ? "block" : "none";
    };
    updateVisibility();
    touchQuery.addEventListener?.("change", updateVisibility);
  }

  private setupKeyboard(): void {
    window.addEventListener("keydown", (e) => {
      if (this.isTypingTarget(e.target)) return;

      this.keys.add(e.code);
      if (e.code === "KeyE" || e.code === "Space") {
        e.preventDefault();
        if (!this.interactPressed) {
          this.interactJustPressed = true;
        }
        this.interactPressed = true;
      }
    });

    window.addEventListener("keyup", (e) => {
      if (this.isTypingTarget(e.target)) return;

      this.keys.delete(e.code);
      if (e.code === "KeyE" || e.code === "Space") {
        this.interactPressed = false;
      }
    });
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target.isContentEditable
    );
  }

  getKeys(): Set<string> {
    return this.keys;
  }

  consumeInteract(): boolean {
    if (this.interactJustPressed) {
      this.interactJustPressed = false;
      return true;
    }
    return false;
  }

  update(
    delta: number,
    player: Player,
    worldBounds: { minX: number; maxX: number; minZ: number; maxZ: number },
    canMoveTo?: (position: THREE.Vector3, radius: number) => boolean,
  ): void {
    player.update(delta, this.keys, worldBounds, canMoveTo, this.virtualMove);
  }
}
