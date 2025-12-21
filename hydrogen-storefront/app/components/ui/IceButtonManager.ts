import * as THREE from 'three';
import {
  getSharedIceTextures,
  loadSharedIceTextures,
  type IceTextures,
} from '../three/utils/TextureLoaders';

/**
 * IceButtonManager - Singleton that manages shared WebGL resources
 * for all IceButtons. Uses one renderer and shared textures from TextureLoaders.
 */

interface IceButtonInstance {
  id: string;
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  material: THREE.ShaderMaterial;
  targetProgress: number;
  currentProgress: number;
  isActive: boolean;
}

class IceButtonManagerClass {
  private static instance: IceButtonManagerClass | null = null;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private geometry: THREE.PlaneGeometry | null = null;

  // Shared textures (from global TextureLoaders singleton)
  private textures: IceTextures | null = null;

  // Registered button instances
  private instances: Map<string, IceButtonInstance> = new Map();

  // Pending registrations (waiting for textures to load)
  private pendingRegistrations: Array<{
    id: string;
    canvas: HTMLCanvasElement;
    container: HTMLElement;
  }> = [];

  // Animation
  private animationId: number = 0;
  private clock: THREE.Clock | null = null;
  private isAnimating = false;

  private constructor() {}

  static getInstance(): IceButtonManagerClass {
    if (!IceButtonManagerClass.instance) {
      IceButtonManagerClass.instance = new IceButtonManagerClass();
    }
    return IceButtonManagerClass.instance;
  }

  /**
   * Initialize shared WebGL resources (called once on first button hover)
   */
  private initialize() {
    if (this.renderer) return;

    // Create offscreen renderer (we'll render to each button's canvas)
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    this.camera.position.z = 1;

    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.clock = new THREE.Clock();

    this.loadTextures();
  }

  /**
   * Load shared textures (uses global singleton - same textures as 3D scene)
   */
  private loadTextures() {
    // Check if already loaded by 3D scene
    const existing = getSharedIceTextures();
    if (existing) {
      this.textures = existing;
      this.processPendingRegistrations();
      return;
    }

    // Load (or wait for loading) - textures are shared with IceTrailEffect
    loadSharedIceTextures((textures) => {
      this.textures = textures;
      this.processPendingRegistrations();
    });
  }

  /**
   * Process any registrations that were waiting for textures
   */
  private processPendingRegistrations() {
    if (!this.textures) return;

    this.pendingRegistrations.forEach(({id, canvas, container}) => {
      this.completeRegistration(id, canvas, container);
    });
    this.pendingRegistrations = [];
  }

  /**
   * Create material for a button instance
   */
  private createMaterial(aspect: number): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: {value: 0},
        uProgress: {value: 0},
        uNoiseTexture: {value: this.textures?.noise},
        uRadialTexture: {value: this.textures?.radial},
        uIceColor: {value: this.textures?.color},
        uIceNormal: {value: this.textures?.normal},
        uIceDensity: {value: this.textures?.density},
        uAspect: {value: aspect},
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uProgress;
        uniform sampler2D uNoiseTexture;
        uniform sampler2D uRadialTexture;
        uniform sampler2D uIceColor;
        uniform sampler2D uIceNormal;
        uniform sampler2D uIceDensity;
        uniform float uAspect;

        varying vec2 vUv;

        #define NUM_EDGE_POINTS 16

        void main() {
          vec2 uv = vUv;

          if (uProgress < 0.001) {
            gl_FragColor = vec4(0.0);
            return;
          }

          vec2 iceTexUv = uv * 2.0;
          vec3 iceColorSample = texture2D(uIceColor, iceTexUv).rgb;
          vec3 iceNormalSample = texture2D(uIceNormal, iceTexUv).rgb * 2.0 - 1.0;
          float iceDensitySample = texture2D(uIceDensity, iceTexUv * 0.5).r;

          vec3 iceTint = vec3(0.7, 0.85, 1.0);
          vec3 iceBaseColor = iceColorSample * iceTint;

          vec3 lightDir = normalize(vec3(1.0, 0.5, 0.3));
          float iceDiff = max(dot(iceNormalSample, lightDir), 0.0) * 0.5 + 0.5;
          iceBaseColor *= iceDiff * 1.4;

          vec2 centeredUv = uv - 0.5;
          float edgeFresnel = length(centeredUv) * 2.0;
          float fresnel = pow(edgeFresnel, 2.0) * 0.5;
          iceBaseColor += fresnel * vec3(0.5, 0.7, 1.0);

          float iceCoverage = 0.0;
          float age = uProgress * 5.0;

          for (int i = 0; i < NUM_EDGE_POINTS; i++) {
            float t = float(i) / float(NUM_EDGE_POINTS);

            for (int edge = 0; edge < 4; edge++) {
              vec2 pointUv;

              if (edge == 0) pointUv = vec2(0.0, t);
              else if (edge == 1) pointUv = vec2(1.0, t);
              else if (edge == 2) pointUv = vec2(t, 0.0);
              else pointUv = vec2(t, 1.0);

              float pointSeed = fract(sin(dot(pointUv + float(edge) * 0.1, vec2(12.9898, 78.233))) * 43758.5453);
              float pointSeed2 = fract(sin(dot(pointUv + float(edge) * 0.2, vec2(93.989, 67.345))) * 24634.6345);
              float pointSeed3 = fract(sin(dot(pointUv + float(edge) * 0.3, vec2(45.234, 89.123))) * 65432.1234);

              if (pointSeed < 0.3) continue;

              vec2 dir = uv - pointUv;
              float dist = length(dir);
              vec2 normDir = dist > 0.001 ? dir / dist : vec2(0.0);

              float growthSpeed = 3.0 + pointSeed * 3.0;
              float spreadProgress = 1.0 - exp(-age * growthSpeed);
              float minRadius = 0.08;
              float maxRadius = 0.25 + pointSeed2 * 0.15;
              float baseRadius = mix(minRadius, maxRadius, spreadProgress) * (0.7 + pointSeed2 * 0.6);

              float angle = atan(normDir.y, normDir.x);
              float angleOffset = pointSeed * 6.28318;
              float adjustedAngle = angle + angleOffset;

              float tendrilCount = 3.0 + pointSeed2 * 4.0;
              float tendrilAngle = adjustedAngle * tendrilCount;

              vec2 noiseSeed = pointUv * 50.0;
              float tendrilNoise1 = texture2D(uNoiseTexture, vec2(tendrilAngle * 0.3, noiseSeed.x) + age * 0.05).r;
              float tendrilNoise2 = texture2D(uNoiseTexture, vec2(tendrilAngle * 0.5 + 0.5, noiseSeed.y) - age * 0.03).r;
              float tendrilNoise3 = texture2D(uNoiseTexture, noiseSeed * 0.3 + vec2(angle * 0.2, age * 0.04)).r;

              float tendrilBase = pow(tendrilNoise1, 0.5 + pointSeed * 0.5);
              float tendrilDetail = tendrilNoise2 * tendrilNoise3;

              float maxTendrilLength = 1.5 + pointSeed3 * 2.5;
              float tendrilStrength = tendrilBase * 0.6 + tendrilDetail * 0.4;
              float tendrilExtension = tendrilStrength * maxTendrilLength * spreadProgress;

              float burstAngle = pointSeed * 6.28318;
              float burstMatch = 1.0 - smoothstep(0.0, 0.5 + pointSeed2 * 0.5, abs(sin(angle - burstAngle)));
              float burstTendril = burstMatch * pointSeed3 * 2.0 * spreadProgress;
              tendrilExtension += burstTendril;

              float gapNoise = texture2D(uNoiseTexture, vec2(angle * 2.0 + pointSeed * 10.0, pointSeed2 * 5.0)).r;
              float hasGap = step(0.85, gapNoise) * (1.0 - pointSeed * 0.5);
              tendrilExtension *= 1.0 - hasGap * 0.7;

              float radius = baseRadius * (1.0 + tendrilExtension);

              float pulseSpeed = 2.0 + pointSeed * 3.0;
              radius *= 1.0 + sin(age * pulseSpeed + angle * (1.0 + pointSeed2 * 2.0)) * 0.08;

              float normalizedDist = dist / (radius + 0.001);

              vec2 noiseUv = uv * (4.0 + pointSeed * 3.0) + pointUv * 5.0;
              float crawlSpeed = 0.08 + pointSeed2 * 0.08;
              float crawlNoise1 = texture2D(uNoiseTexture, noiseUv + age * crawlSpeed).r;
              float crawlNoise2 = texture2D(uNoiseTexture, noiseUv * 1.7 - age * crawlSpeed * 0.7).r;
              float edgeNoise = (crawlNoise1 + crawlNoise2 - 1.0) * (0.5 + pointSeed3 * 0.4);

              vec2 radialUv = vec2(normalizedDist * 0.35, 0.5 + edgeNoise * 0.5);
              float radialValue = texture2D(uRadialTexture, radialUv).r;
              float spreadEdge = radialValue * (1.0 - normalizedDist * 0.4 + edgeNoise * 0.5);

              float cutoffBase = 0.9 + tendrilExtension * 0.25 + pointSeed * 0.2;
              float organicCutoff = smoothstep(cutoffBase + edgeNoise * 0.5, cutoffBase - 0.35, normalizedDist);

              float contribution = spreadEdge * organicCutoff;
              contribution *= 0.5 + iceDensitySample * 0.7;
              contribution *= 0.8 + pointSeed2 * 0.4;

              iceCoverage = max(iceCoverage, contribution);
            }
          }

          iceCoverage *= smoothstep(0.0, 0.1, uProgress);

          vec2 thresholdNoiseUv = uv * 6.0;
          float thresholdNoise = texture2D(uNoiseTexture, thresholdNoiseUv + uTime * 0.01).r;
          float dynamicThreshold = 0.15 + thresholdNoise * 0.1;
          iceCoverage = smoothstep(dynamicThreshold, dynamicThreshold + 0.3, iceCoverage);

          float edgeGlow = smoothstep(0.15, 0.35, iceCoverage) * smoothstep(0.65, 0.45, iceCoverage);
          vec2 glowCrawlUv = uv * 12.0;
          float crawlNoise = texture2D(uNoiseTexture, glowCrawlUv + uTime * 0.03).r;
          float crawlNoise2 = texture2D(uNoiseTexture, glowCrawlUv * 0.7 - uTime * 0.02).r;
          edgeGlow *= 0.5 + crawlNoise * 0.3 + crawlNoise2 * 0.3;

          vec3 finalIce = iceBaseColor;
          finalIce += edgeGlow * vec3(0.4, 0.65, 1.0) * 0.7;

          vec2 sparkleUv = uv * 20.0 + uTime * 0.1;
          float sparkleNoise = texture2D(uNoiseTexture, sparkleUv).r;
          float sparkleNoise2 = texture2D(uNoiseTexture, sparkleUv * 1.3 + 0.5).r;
          float sparkle = pow(sparkleNoise * sparkleNoise2, 5.0) * edgeGlow * 4.0;
          float flicker = step(0.97, fract(sin(dot(uv, vec2(12.9898, 78.233)) + uTime * 10.0) * 43758.5453));
          sparkle += flicker * edgeGlow * 0.5;
          finalIce += sparkle * vec3(0.95, 0.98, 1.0);

          float alpha = iceCoverage * 0.95;
          gl_FragColor = vec4(finalIce, alpha);
        }
      `,
    });
  }

  /**
   * Register a button instance
   */
  register(
    id: string,
    canvas: HTMLCanvasElement,
    container: HTMLElement
  ): void {
    // Initialize shared resources on first registration
    this.initialize();

    // If textures aren't loaded yet, queue the registration
    if (!this.textures) {
      this.pendingRegistrations.push({id, canvas, container});
      return;
    }

    this.completeRegistration(id, canvas, container);
  }

  /**
   * Complete registration once textures are available
   */
  private completeRegistration(
    id: string,
    canvas: HTMLCanvasElement,
    container: HTMLElement
  ): void {
    const rect = container.getBoundingClientRect();
    const material = this.createMaterial(rect.width / rect.height);

    this.instances.set(id, {
      id,
      canvas,
      container,
      material,
      targetProgress: 0,
      currentProgress: 0,
      isActive: false,
    });
  }

  /**
   * Unregister a button instance
   */
  unregister(id: string): void {
    const instance = this.instances.get(id);
    if (instance) {
      instance.material.dispose();
      this.instances.delete(id);
    }

    // Stop animation if no active instances
    if (this.instances.size === 0) {
      this.stopAnimation();
    }
  }

  /**
   * Activate ice effect on hover
   */
  activate(id: string): void {
    const instance = this.instances.get(id);
    if (instance) {
      instance.isActive = true;
      instance.targetProgress = 1.0;
      this.startAnimation();
    }
  }

  /**
   * Deactivate ice effect on mouse leave
   */
  deactivate(id: string): void {
    const instance = this.instances.get(id);
    if (instance) {
      instance.targetProgress = 0.0;
      // Keep animating until progress reaches 0
    }
  }

  /**
   * Update canvas size on resize
   */
  updateSize(id: string): void {
    const instance = this.instances.get(id);
    if (instance) {
      const rect = instance.container.getBoundingClientRect();
      instance.material.uniforms.uAspect.value = rect.width / rect.height;
    }
  }

  /**
   * Start the shared animation loop
   */
  private startAnimation(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.clock?.start();
    this.animate();
  }

  /**
   * Stop the animation loop
   */
  private stopAnimation(): void {
    this.isAnimating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  /**
   * Main animation loop - renders all active buttons
   */
  private animate = (): void => {
    if (!this.isAnimating || !this.renderer || !this.scene || !this.camera || !this.geometry) {
      return;
    }

    const rawDelta = this.clock?.getDelta() || 0.016;
    const deltaTime = Math.min(rawDelta, 0.1);
    const elapsedTime = this.clock?.getElapsedTime() || 0;
    const linearSpeed = 0.12;

    let hasActiveAnimations = false;

    this.instances.forEach((instance) => {
      // Update progress
      const diff = instance.targetProgress - instance.currentProgress;

      if (Math.abs(diff) > 0.001) {
        hasActiveAnimations = true;

        if (diff > 0) {
          instance.currentProgress += deltaTime * linearSpeed;
          if (instance.currentProgress > 1.0) instance.currentProgress = 1.0;
        } else {
          instance.currentProgress -= deltaTime * linearSpeed;
          if (instance.currentProgress < 0.0) instance.currentProgress = 0.0;
        }
      } else if (instance.currentProgress > 0.001) {
        // Still visible, keep animating for sparkles etc
        hasActiveAnimations = true;
      }

      // Only render if there's something to show
      if (instance.currentProgress > 0.001) {
        const rect = instance.container.getBoundingClientRect();

        // Update renderer size for this button
        this.renderer!.setSize(rect.width, rect.height);

        // Update uniforms
        instance.material.uniforms.uTime.value = elapsedTime;
        instance.material.uniforms.uProgress.value = instance.currentProgress;

        // Render to this button's canvas
        const context = instance.canvas.getContext('2d');
        if (context) {
          // Set canvas size
          instance.canvas.width = rect.width * Math.min(window.devicePixelRatio, 2);
          instance.canvas.height = rect.height * Math.min(window.devicePixelRatio, 2);
          instance.canvas.style.width = '100%';
          instance.canvas.style.height = '100%';

          // Clear and setup scene with this material
          this.scene!.clear();
          const mesh = new THREE.Mesh(this.geometry!, instance.material);
          this.scene!.add(mesh);

          // Render
          this.renderer!.render(this.scene!, this.camera!);

          // Copy to button's canvas
          context.clearRect(0, 0, instance.canvas.width, instance.canvas.height);
          context.drawImage(this.renderer!.domElement, 0, 0);

          // Cleanup mesh from scene
          this.scene!.remove(mesh);
        }
      } else {
        // Clear canvas when not active
        const context = instance.canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, instance.canvas.width, instance.canvas.height);
        }
        instance.isActive = false;
      }
    });

    // Continue or stop animation
    if (hasActiveAnimations) {
      this.animationId = requestAnimationFrame(this.animate);
    } else {
      this.isAnimating = false;
    }
  };

  /**
   * Cleanup all resources
   */
  dispose(): void {
    this.stopAnimation();

    this.instances.forEach((instance) => {
      instance.material.dispose();
    });
    this.instances.clear();
    this.pendingRegistrations = [];

    // Note: textures are NOT disposed - they're shared globally with 3D scene
    this.textures = null;

    this.geometry?.dispose();
    this.renderer?.dispose();

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.geometry = null;

    IceButtonManagerClass.instance = null;
  }
}

export const IceButtonManager = IceButtonManagerClass.getInstance();
