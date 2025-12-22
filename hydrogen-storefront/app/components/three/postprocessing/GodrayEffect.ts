import * as THREE from 'three';
import {PERFORMANCE} from '../constants';

/**
 * Godray Post-Processing Effect
 * 
 * Creëert een volumetrische lighting effect (god rays).
 * Gebaseerd op radial blur sampling techniek.
 */

// Vertex shader voor post-processing quad
export const godrayVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Fragment shader voor godray effect
export const createGodrayFragmentShader = (config: {
  samples?: number;
  exposure?: number;
  decay?: number;
  density?: number;
  weight?: number;
  brightness?: number;
  contrast?: number;
} = {}) => {
  const {
    samples = 6, // Reduced from 8 for performance
    exposure = 0.12, // Slightly reduced
    decay = 0.92, // Hoe snel het effect afneemt
    density = 0.6, // Reduced density
    weight = 0.5, // Reduced weight
    brightness = 1.15, // Slightly reduced
    contrast = 0.95 // Gamma correctie
  } = config;

  return `
uniform float time;
uniform sampler2D uMap;
varying vec2 vUv;

float PI = 3.141592653589793238;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 toCenter = vec2(0.5) - vUv;
  vec4 original = texture2D(uMap, vUv);

  vec4 color = vec4(0.0);
  float total = 0.0;

  // Radial blur sampling voor godray effect
  for(float i = 0.0; i < ${samples}.0; i++) {
    float lerp = (i + rand(vec2(gl_FragCoord.x, gl_FragCoord.y))) / ${samples}.0;
    float weight = sin(lerp * PI);
    vec4 mysample = texture2D(uMap, vUv + toCenter * lerp * ${density});
    mysample.rgb *= mysample.a;
    color += mysample * weight;
    total += weight;
  }

  color.a = 1.0;
  color /= total;

  // Godray blending
  vec4 finalColor = mix(original, 1. - (1. - color)*(1. - original), ${exposure});
  
  // Brightness en contrast adjustments
  finalColor.rgb *= ${brightness};
  finalColor.rgb = pow(finalColor.rgb, vec3(${contrast}));
  
  gl_FragColor = finalColor;
}
`;
};

export interface GodrayEffectOptions {
  samples?: number;
  exposure?: number;
  brightness?: number;
  contrast?: number;
}

export class GodrayPostProcessing {
  public material: THREE.ShaderMaterial;
  public quad: THREE.Mesh;
  private renderTarget: THREE.WebGLRenderTarget;
  
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private geometry: THREE.PlaneGeometry;

  constructor(sizes: {width: number, height: number}, pixelRatio: number, options: GodrayEffectOptions = {}) {
    // Create render target for first pass with MSAA
    this.renderTarget = new THREE.WebGLRenderTarget(
      sizes.width * pixelRatio,
      sizes.height * pixelRatio,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        samples: PERFORMANCE.renderTargetSamples,
      }
    );

    // Create post-processing scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -1000, 1000);
    
    // Create shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: {value: null},
        time: {value: 0},
      },
      vertexShader: godrayVertexShader,
      fragmentShader: createGodrayFragmentShader(options),
    });

    // Create fullscreen quad
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.quad = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.quad);
  }

  /**
   * Render the scene with godray post-processing
   * 
   * @param mainScene - The main Three.js scene
   * @param camera - The main camera
   * @param time - Elapsed time for animation
   */
  render(renderer: THREE.WebGLRenderer, mainScene: THREE.Scene, camera: THREE.Camera, time: number): void {
    // First pass: Render main scene to render target
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(mainScene, camera);

    // Update uniforms
    this.material.uniforms.uMap.value = this.renderTarget.texture;
    this.material.uniforms.time.value = time;

    // Second pass: Render post-processing to screen
    renderer.setRenderTarget(null);
    renderer.render(this.scene, this.camera);
  }

  /**
   * Resize render target
   */
  resize(width: number, height: number, pixelRatio: number): void {
    this.renderTarget.setSize(width * pixelRatio, height * pixelRatio);
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.renderTarget.dispose();
    this.geometry.dispose();
    this.material.dispose();
  }
}