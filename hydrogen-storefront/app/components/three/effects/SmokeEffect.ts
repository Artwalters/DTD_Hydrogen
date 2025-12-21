import * as THREE from 'three';
import {SMOKE_CONFIG} from '../constants';

/**
 * Smoke Effect Component
 * 
 * Creëert een procedurele smoke/cloud effect met instanced meshes.
 * Gebruikt shader-based animatie voor optimale performance.
 * 
 * Features:
 * - Circular orbit animatie rond het centrum
 * - Procedurele smoke texture generatie
 * - Depth-based fading voor realisme
 * - Volledig configureerbaar via constants
 */

// Smoke vertex shader - exact copy from dracarys
const smokeVertexShader = `
attribute float aRandom;
attribute vec3 aTranslate;

uniform float uTime;

varying float vAlpha;
varying vec2 vUv;

#define BOUNDS 20.0

float remap(float value, float min, float max, float newMin, float newMax) {
  return newMin + (newMax - newMin) * (value - min) / (max - min);
}

mat2 rotate2d(float _angle) {
  return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
}

vec3 getTranslate(vec3 _translate, float _time, float _random, float _bounds) {
  vec3 translate = _translate;

  // Circular orbit around the model
  float orbitAngle = _time + _random * 6.28;

  // Circular motion - clouds orbit around the center
  float orbitX = cos(orbitAngle) * 6.0; // Forward/backward orbit motion (breder)
  float orbitZ = sin(orbitAngle) * 8.0; // Side to side orbit motion (veel breder)

  translate.x += orbitX;
  translate.z += orbitZ;

  // Gentle floating on top of orbit
  translate.y += sin(_time * 2.0 + _random * 6.28) * 0.8;

  return translate;
}

vec4 getMvPosition(vec3 _position, vec3 _translate) {
  vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(_translate, 1.0);
  vec3 screenPos = _position;
  mvPosition.xyz += screenPos;
  return mvPosition;
}

void main() {
  // Time for orbit animation - subtle but visible
  float t = uTime * (0.15 + aRandom * 0.05) + aRandom;
  float rt = uTime * (0.03 + aRandom * 0.02); // Slow rotation
  vec3 translate = getTranslate(aTranslate, t, aRandom, BOUNDS);

  vec3 np = position;
  np.xy = rotate2d(rt) * np.xy;

  vec4 mvPosition = getMvPosition(np, translate);

  // Alpha based on distance from center in YZ plane (perpendicular to camera)
  float alpha = smoothstep(0.0, BOUNDS * 0.8, length(translate.yz * vec2(0.8, 0.8)));
  alpha = 1.0 - (alpha * alpha);

  gl_Position = projectionMatrix * mvPosition;
  vUv = uv;
  // Fade based on depth (mvPosition.z is depth in view space)
  vAlpha = alpha * (1.0 + aRandom * 0.3) * clamp(-mvPosition.z * 0.05, 0.0, 1.0);
}
`;

// Smoke fragment shader
const smokeFragmentShader = `
precision highp float;

uniform float uBaseAlpha;
uniform sampler2D uDiffuse;

varying float vAlpha;
varying vec2 vUv;

void main() {
  vec4 ra = texture2D(uDiffuse, vUv);
  ra.rgb *= 1.3;
  ra.a *= uBaseAlpha * vAlpha;

  gl_FragColor = ra;
}
`;

export interface SmokeEffectOptions {
  count?: number;
  texture?: THREE.Texture;
  baseAlpha?: number;
  bounds?: number;
}

export class SmokeEffect {
  public mesh: THREE.InstancedMesh;
  public timeUniform: {value: number};
  
  private geometry: THREE.PlaneGeometry;
  private material: THREE.ShaderMaterial;
  private translations: Float32Array;
  private randoms: Float32Array;

  constructor(scene: THREE.Scene, textureCache: any, options: SmokeEffectOptions = {}) {
    const {
      count = SMOKE_CONFIG.count,
      texture = textureCache.loadSmokeTexture(),
      baseAlpha = SMOKE_CONFIG.material.baseAlpha,
      bounds = 30
    } = options;

    // Create time uniform (shared)
    this.timeUniform = {value: 0};

    // Create shader material
    this.material = new THREE.ShaderMaterial({
      vertexShader: smokeVertexShader,
      fragmentShader: smokeFragmentShader,
      uniforms: {
        uDiffuse: {value: texture},
        uBaseAlpha: {value: baseAlpha},
        uTime: this.timeUniform,
      },
      transparent: true,
      depthWrite: false,
      depthTest: true, // Enable depth test so clouds stay behind model
      blending: THREE.AdditiveBlending,
    });

    // Create geometry
    this.geometry = new THREE.PlaneGeometry(
      SMOKE_CONFIG.geometry.width,
      SMOKE_CONFIG.geometry.height
    );

    // Instance attributes
    this.translations = new Float32Array(count * 3);
    this.randoms = new Float32Array(count);

    // Distribute particles - exact original values
    for (let i = 0; i < count; i++) {
      // Full screen coverage - closer to camera (original values)
      const x = -3 - Math.random() * 8; // Nog dichter bij camera (-11 to -3)
      const y = (Math.random() - 0.5) * 70; // Hoger spread (-35 to 35)
      const z = (Math.random() - 0.5) * 160; // Veel breder spread (-80 to 80)

      this.translations[i * 3] = x;
      this.translations[i * 3 + 1] = y;
      this.translations[i * 3 + 2] = z;

      // Random value per particle for variation
      this.randoms[i] = Math.random();
    }

    // Add instance attributes to geometry
    this.geometry.setAttribute('aTranslate', new THREE.InstancedBufferAttribute(this.translations, 3));
    this.geometry.setAttribute('aRandom', new THREE.InstancedBufferAttribute(this.randoms, 1));

    // Create instanced mesh
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, count);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1;

    // Set identity matrices for all instances
    const dummy = new THREE.Object3D();
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) {
      this.mesh.setMatrixAt(i, dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;

    // Add to scene
    scene.add(this.mesh);
  }

  /**
   * Update de smoke animatie
   * @param elapsedTime - Totale elapsed time in seconden
   */
  update(elapsedTime: number): void {
    this.timeUniform.value = elapsedTime;
  }

  /**
   * Cleanup alle resources
   */
  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.mesh.dispose();
  }

  /**
   * Stel een nieuwe texture in
   */
  setTexture(texture: THREE.Texture): void {
    this.material.uniforms.uDiffuse.value = texture;
  }

  /**
   * Stel de base alpha in (transparantie)
   */
  setBaseAlpha(alpha: number): void {
    this.material.uniforms.uBaseAlpha.value = alpha;
  }
}