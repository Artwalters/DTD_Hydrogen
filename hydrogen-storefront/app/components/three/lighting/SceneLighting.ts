import * as THREE from 'three';
import {COLORS} from '../constants';

/**
 * Scene Lighting Component
 * 
 * Centraliseerde lighting setup voor consistente verlichting tussen scenes.
 * Bevat ambient, directional, en HDRI environment lighting.
 */

export interface LightingConfig {
  enableHDRI?: boolean;
  hdriIntensity?: number;
  ambientIntensity?: number;
  mainLightIntensity?: number;
  frontLightIntensity?: number;
}

export class SceneLighting {
  public lights: {
    ambient: THREE.AmbientLight;
    main: THREE.DirectionalLight;
    frontLeft: THREE.DirectionalLight;
    frontRight: THREE.DirectionalLight;
  };

  constructor(scene: THREE.Scene, config: LightingConfig = {}) {
    const {
      ambientIntensity = 0.5,
      mainLightIntensity = 0.6,
      frontLightIntensity = 0.3,
    } = config;

    // Ambient light - algemene scene verlichting
    this.lights = {
      ambient: new THREE.AmbientLight(COLORS.lights.ambient, ambientIntensity),
      main: new THREE.DirectionalLight(COLORS.lights.main, mainLightIntensity),
      frontLeft: new THREE.DirectionalLight(COLORS.lights.main, frontLightIntensity),
      frontRight: new THREE.DirectionalLight(COLORS.lights.main, frontLightIntensity),
    };

    // Main light - van voren (zelfde richting als camera)
    this.lights.main.position.set(10, 5, 0);

    // Front lights - symmetrisch links en rechts
    this.lights.frontLeft.position.set(8, 3, -8);
    this.lights.frontRight.position.set(8, 3, 8);

    // Add all lights to scene
    Object.values(this.lights).forEach(light => scene.add(light));
  }


  /**
   * Update light intensities
   */
  setIntensities(config: {
    ambient?: number;
    main?: number;
    frontLeft?: number;
    frontRight?: number;
  }): void {
    if (config.ambient !== undefined) {
      this.lights.ambient.intensity = config.ambient;
    }
    if (config.main !== undefined) {
      this.lights.main.intensity = config.main;
    }
    if (config.frontLeft !== undefined) {
      this.lights.frontLeft.intensity = config.frontLeft;
    }
    if (config.frontRight !== undefined) {
      this.lights.frontRight.intensity = config.frontRight;
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    // Three.js lights hebben geen speciale dispose, maar we kunnen ze uit de scene halen
    Object.values(this.lights).forEach(light => {
      if (light.parent) {
        light.parent.remove(light);
      }
    });
  }
}