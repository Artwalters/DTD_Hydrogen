import * as THREE from 'three';
import { ANIMATION_CONFIG, RAYCASTER_CONFIG } from '../constants';

/**
 * Model Interaction Utility
 * 
 * Handles mouse interaction, floating animation, and model positioning.
 * Extracted from the original HeroScene/FooterScene implementations.
 */

export interface ModelInteractionOptions {
  floatSpeed?: number;
  floatAmplitude?: number;
  mouseFollowSpeed?: number;
  mouseFollowRange?: number;
  mouseRotationScale?: { x: number; z: number };
}

export class ModelInteraction {
  private raycaster: THREE.Raycaster;
  private mouseVec: THREE.Vector2;
  private options: Required<ModelInteractionOptions>;

  constructor(options: ModelInteractionOptions = {}) {
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Line = { threshold: RAYCASTER_CONFIG.lineThreshold };
    this.raycaster.params.Points = { threshold: RAYCASTER_CONFIG.pointsThreshold };
    this.mouseVec = new THREE.Vector2();

    this.options = {
      floatSpeed: options.floatSpeed ?? ANIMATION_CONFIG.floatSpeed,
      floatAmplitude: options.floatAmplitude ?? ANIMATION_CONFIG.floatAmplitude,
      mouseFollowSpeed: options.mouseFollowSpeed ?? ANIMATION_CONFIG.mouseFollowSpeed,
      mouseFollowRange: options.mouseFollowRange ?? ANIMATION_CONFIG.mouseFollowRange,
      mouseRotationScale: options.mouseRotationScale ?? ANIMATION_CONFIG.mouseRotationScale
    };
  }

  /**
   * Update model position and rotation based on mouse and time
   */
  updateModelInteraction(
    model: THREE.Group,
    mouse: { x: number; y: number },
    elapsedTime: number,
    deltaTime: number
  ): void {
    // Floating animation
    const floatY = Math.sin(elapsedTime * this.options.floatSpeed) * this.options.floatAmplitude;

    // Magnet-like position follow
    const targetPosY = mouse.y * this.options.mouseFollowRange;
    const targetPosZ = mouse.x * this.options.mouseFollowRange;

    model.position.y += (targetPosY + floatY - model.position.y) * this.options.mouseFollowSpeed;
    model.position.z += (targetPosZ - model.position.z) * this.options.mouseFollowSpeed;

    // Subtle tilt
    const targetRotationX = -mouse.y * this.options.mouseRotationScale.x;
    const targetRotationZ = mouse.x * this.options.mouseRotationScale.z;

    model.rotation.x += (targetRotationX - model.rotation.x) * this.options.mouseFollowSpeed;
    model.rotation.z += (targetRotationZ - model.rotation.z) * this.options.mouseFollowSpeed;
  }

  /**
   * Perform raycasting for interaction detection
   */
  performRaycasting(
    mouse: { x: number; y: number },
    camera: THREE.Camera,
    model: THREE.Group
  ): THREE.Intersection[] {
    this.mouseVec.set(mouse.x, mouse.y);
    this.raycaster.setFromCamera(this.mouseVec, camera);
    return this.raycaster.intersectObject(model, true);
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    // Raycaster doesn't need explicit disposal
  }
}