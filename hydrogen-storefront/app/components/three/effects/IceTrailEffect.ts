import * as THREE from 'three';
import {ICE_CONFIG} from '../constants';

/**
 * Ice Trail Effect Component
 * 
 * Creates an interactive ice trail effect with organic spread patterns.
 * Features UV-based trail storage for proper model mapping.
 */

export class IceTrailEffect {
  private trailData: Float32Array;
  private trailMeta: Float32Array; 
  private trailTexture: THREE.DataTexture;
  private trailIndex = 0;
  private trailCount = 0;
  private lastTrailTime = 0;
  private modelBoundingSphere: THREE.Sphere | null = null;
  private modelCenterOffset = new THREE.Vector3();

  // Ice uniforms shared across materials
  public iceUniforms = {
    uIceColor: {value: null as THREE.Texture | null},
    uIceNormal: {value: null as THREE.Texture | null},
    uIceDensity: {value: null as THREE.Texture | null},
    uNoiseTexture: {value: null as THREE.Texture | null},
    uRadialTexture: {value: null as THREE.Texture | null},
    uTrailTexture: {value: null as THREE.DataTexture | null},
    uTrailCount: {value: 0},
    uTime: {value: 0},
    uMaxRadius: {value: ICE_CONFIG.maxRadius},
  };

  constructor(textureCache: any) {
    // Initialize trail data
    this.trailData = new Float32Array(ICE_CONFIG.maxTrailPoints * 4); // x, y, age, intensity
    this.trailMeta = new Float32Array(ICE_CONFIG.maxTrailPoints * 2); // fadeSpeed, maxAge
    
    // Create data texture for trail points
    this.trailTexture = new THREE.DataTexture(
      this.trailData,
      ICE_CONFIG.maxTrailPoints,
      1,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    this.trailTexture.needsUpdate = true;

    // Set texture references
    this.iceUniforms.uTrailTexture.value = this.trailTexture;

    // Load ice textures through texture cache
    const iceTextures = textureCache.loadIceTextures();
    this.iceUniforms.uIceColor.value = iceTextures.color;
    this.iceUniforms.uIceNormal.value = iceTextures.normal; 
    this.iceUniforms.uIceDensity.value = iceTextures.density;
    this.iceUniforms.uNoiseTexture.value = iceTextures.noise;
    this.iceUniforms.uRadialTexture.value = iceTextures.radial;
  }

  /**
   * Calculate bounding sphere for model to improve hover detection
   */
  calculateBoundingSphere(model: THREE.Group) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Store center offset relative to model origin
    this.modelCenterOffset.copy(center).sub(model.position);
    // Use larger radius for more reliable detection
    this.modelBoundingSphere = new THREE.Sphere(center, maxDim * 0.6);
  }

  /**
   * Update ice trail effect (optimized for scroll performance)
   */
  update(deltaTime: number, elapsedTime: number, intersects: THREE.Intersection[], isScrolling = false) {
    // Update all existing trail points with organic fade
    for (let i = 0; i < ICE_CONFIG.maxTrailPoints; i++) {
      const idx = i * 4;
      const metaIdx = i * 2;
      
      if (this.trailData[idx + 3] > 0) {
        // Increase age
        this.trailData[idx + 2] += deltaTime;

        // Get random fade speed and max age for this point
        const pointFadeSpeed = this.trailMeta[metaIdx];
        const maxAge = this.trailMeta[metaIdx + 1];

        // Non-linear fade: slow at first, then accelerates
        const age = this.trailData[idx + 2];
        const normalizedAge = age / maxAge;

        // Organic fade curve with randomness
        const fadeCurve = Math.pow(normalizedAge, 1.5 + Math.sin(age * 3.0) * 0.3);

        // Calculate intensity based on age with organic curve
        this.trailData[idx + 3] = Math.max(0, 1.0 - fadeCurve);

        // Add random "melting" effect - some points fade faster randomly
        if (Math.random() < 0.002) {
          this.trailData[idx + 3] *= 0.7; // Random quick melt
        }
      }
    }

    // Skip new trail point creation during scroll for performance
    if (!isScrolling && intersects.length > 0 && intersects[0].uv && 
        elapsedTime - this.lastTrailTime > ICE_CONFIG.trailInterval) {
      
      const hitUv = intersects[0].uv;

      // Use circular buffer for trail points (stored in UV space)
      const idx = this.trailIndex * 4;
      const metaIdx = this.trailIndex * 2;

      this.trailData[idx] = hitUv.x;
      this.trailData[idx + 1] = hitUv.y;
      this.trailData[idx + 2] = 0; // Age starts at 0
      this.trailData[idx + 3] = 1.0; // Full intensity

      // Random fade parameters for organic melting
      this.trailMeta[metaIdx] = 0.1 + Math.random() * 0.2; // Random fade speed
      this.trailMeta[metaIdx + 1] = 2.0 + Math.random() * 3.0; // Random max age (2-5 seconds)

      this.trailIndex = (this.trailIndex + 1) % ICE_CONFIG.maxTrailPoints;
      this.trailCount = Math.min(this.trailCount + 1, ICE_CONFIG.maxTrailPoints);
      this.lastTrailTime = elapsedTime;
    }

    // Throttle texture updates during scroll (only update every other frame)
    const shouldUpdateTexture = !isScrolling || (Math.floor(elapsedTime * 60) % 2 === 0);
    
    if (shouldUpdateTexture) {
      this.trailTexture.needsUpdate = true;
    }
    
    this.iceUniforms.uTrailCount.value = this.trailCount;
    this.iceUniforms.uTime.value = elapsedTime;
  }

  /**
   * Inject ice shader code into a material
   */
  injectIceShader(material: THREE.MeshStandardMaterial, iceTextures: any) {
    material.onBeforeCompile = (shader) => {
      // Add ice uniforms
      Object.assign(shader.uniforms, this.iceUniforms);

      // Add varyings to vertex shader
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
        varying vec2 vIceUv;
        varying vec3 vWorldPos;`
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
        vIceUv = uv;
        vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
      );

      // Add ice shader to fragment
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D uIceColor;
        uniform sampler2D uIceNormal;
        uniform sampler2D uIceDensity;
        uniform sampler2D uNoiseTexture;
        uniform sampler2D uRadialTexture;
        uniform sampler2D uTrailTexture;
        uniform int uTrailCount;
        uniform float uTime;
        uniform float uMaxRadius;
        varying vec2 vIceUv;
        varying vec3 vWorldPos;

        #define MAX_TRAIL_POINTS 64`
      );

      // Inject ice blending before final output
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>

        // Sample ice textures using UV for consistent mapping
        vec2 iceTexUv = vIceUv * 2.0;
        vec4 iceColorSample = texture2D(uIceColor, iceTexUv);
        vec3 iceNormalSample = texture2D(uIceNormal, iceTexUv).rgb * 2.0 - 1.0;
        float iceDensitySample = texture2D(uIceDensity, iceTexUv * 0.5).r;

        // Ice color with blue-white tint
        vec3 iceTint = vec3(0.7, 0.85, 1.0);
        vec3 iceBaseColor = iceColorSample.rgb * iceTint;

        // Simple lighting for ice
        vec3 lightDir = normalize(vec3(1.0, 0.5, 0.3));
        float iceDiff = max(dot(iceNormalSample, lightDir), 0.0) * 0.5 + 0.5;

        // Fresnel for icy shine
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);

        vec3 finalIce = iceBaseColor * iceDiff * 1.2;
        finalIce += fresnel * vec3(0.5, 0.7, 1.0) * 0.5;

        // Calculate accumulated ice coverage from trail points
        float iceCoverage = 0.0;

        for (int i = 0; i < MAX_TRAIL_POINTS; i++) {
          if (i >= uTrailCount) break;

          // Sample trail point from data texture (stored in UV space)
          float texCoord = (float(i) + 0.5) / float(MAX_TRAIL_POINTS);
          vec4 trailPoint = texture2D(uTrailTexture, vec2(texCoord, 0.5));

          vec2 pointUv = trailPoint.xy;
          float age = trailPoint.z;
          float intensity = trailPoint.w;

          if (intensity > 0.01) {
            // Unique random seed for this point
            float pointSeed = fract(sin(dot(pointUv, vec2(12.9898, 78.233))) * 43758.5453);
            float pointSeed2 = fract(sin(dot(pointUv, vec2(93.989, 67.345))) * 24634.6345);
            float pointSeed3 = fract(sin(dot(pointUv, vec2(45.234, 89.123))) * 65432.1234);

            // Direction from point to current fragment
            vec2 dir = vIceUv - pointUv;
            float dist = length(dir);
            vec2 normDir = dist > 0.001 ? dir / dist : vec2(0.0);

            // Organic spread: radius grows over time with random speed per point
            float growthSpeed = 1.5 + pointSeed * 2.0;
            float spreadProgress = 1.0 - exp(-age * growthSpeed);
            float baseRadius = uMaxRadius * spreadProgress * (0.7 + pointSeed2 * 0.6);

            // === RANDOMIZED TENDRILS ===
            float angle = atan(normDir.y, normDir.x);

            // Random angle offset unique to this point
            float angleOffset = pointSeed * 6.28318;
            float adjustedAngle = angle + angleOffset;

            // Random number of tendrils per point (3-7)
            float tendrilCount = 3.0 + pointSeed2 * 4.0;
            float tendrilAngle = adjustedAngle * tendrilCount;

            // Noise sampling with point-unique offsets
            vec2 noiseSeed = pointUv * 50.0;
            float tendrilNoise1 = texture2D(uNoiseTexture, vec2(tendrilAngle * 0.3, noiseSeed.x) + age * 0.05).r;
            float tendrilNoise2 = texture2D(uNoiseTexture, vec2(tendrilAngle * 0.5 + 0.5, noiseSeed.y) - age * 0.03).r;
            float tendrilNoise3 = texture2D(uNoiseTexture, noiseSeed * 0.3 + vec2(angle * 0.2, age * 0.04)).r;

            // Create irregular tendril pattern
            float tendrilBase = pow(tendrilNoise1, 0.5 + pointSeed * 0.5);
            float tendrilDetail = tendrilNoise2 * tendrilNoise3;

            // Random tendril strength per point
            float maxTendrilLength = 1.5 + pointSeed3 * 2.5;
            float tendrilStrength = tendrilBase * 0.6 + tendrilDetail * 0.4;
            float tendrilExtension = tendrilStrength * maxTendrilLength * spreadProgress;

            // Random "burst" tendrils
            float burstAngle = pointSeed * 6.28318;
            float burstMatch = 1.0 - smoothstep(0.0, 0.5 + pointSeed2 * 0.5, abs(sin(angle - burstAngle)));
            float burstTendril = burstMatch * pointSeed3 * 2.0 * spreadProgress;
            tendrilExtension += burstTendril;

            // Random holes/gaps in the spread
            float gapNoise = texture2D(uNoiseTexture, vec2(angle * 2.0 + pointSeed * 10.0, pointSeed2 * 5.0)).r;
            float hasGap = step(0.85, gapNoise) * (1.0 - pointSeed * 0.5);
            tendrilExtension *= 1.0 - hasGap * 0.7;

            // Final radius with tendrils
            float radius = baseRadius * (1.0 + tendrilExtension);

            // Irregular pulsing
            float pulseSpeed = 2.0 + pointSeed * 3.0;
            radius *= 1.0 + sin(age * pulseSpeed + angle * (1.0 + pointSeed2 * 2.0)) * 0.08;

            float normalizedDist = dist / (radius + 0.001);

            // === ORGANIC EDGE ===
            vec2 noiseUv = vIceUv * (4.0 + pointSeed * 3.0) + pointUv * 5.0;
            float crawlSpeed = 0.08 + pointSeed2 * 0.08;
            float crawlNoise1 = texture2D(uNoiseTexture, noiseUv + age * crawlSpeed).r;
            float crawlNoise2 = texture2D(uNoiseTexture, noiseUv * 1.7 - age * crawlSpeed * 0.7).r;

            // Edge distortion
            float edgeNoise = (crawlNoise1 + crawlNoise2 - 1.0) * (0.5 + pointSeed3 * 0.4);

            // === ORGANIC SPREAD SHAPE ===
            vec2 radialUv = vec2(normalizedDist * 0.35, 0.5 + edgeNoise * 0.5);
            float radialValue = texture2D(uRadialTexture, radialUv).r;

            // Organic spread edge
            float spreadEdge = radialValue * (1.0 - normalizedDist * 0.4 + edgeNoise * 0.5);

            // Organic cutoff
            float cutoffBase = 0.9 + tendrilExtension * 0.25 + pointSeed * 0.2;
            float organicCutoff = smoothstep(cutoffBase + edgeNoise * 0.5, cutoffBase - 0.35, normalizedDist);

            float contribution = spreadEdge * organicCutoff;

            // Crystalline variation
            contribution *= 0.5 + iceDensitySample * 0.7;

            // Intensity fades
            float finalContribution = contribution * intensity;

            // Point-unique opacity variation
            finalContribution *= 0.8 + pointSeed2 * 0.4;

            iceCoverage = max(iceCoverage, finalContribution);
          }
        }

        // Organic threshold with noise variation
        vec2 thresholdNoiseUv = vIceUv * 6.0;
        float thresholdNoise = texture2D(uNoiseTexture, thresholdNoiseUv + uTime * 0.01).r;
        float dynamicThreshold = 0.15 + thresholdNoise * 0.1;
        iceCoverage = smoothstep(dynamicThreshold, dynamicThreshold + 0.3, iceCoverage);

        // Edge glow effect
        float edgeGlow = smoothstep(0.15, 0.35, iceCoverage) * smoothstep(0.65, 0.45, iceCoverage);

        // Animated edge crawl effect
        vec2 crawlUv = vIceUv * 12.0;
        float crawlNoise = texture2D(uNoiseTexture, crawlUv + uTime * 0.03).r;
        float crawlNoise2 = texture2D(uNoiseTexture, crawlUv * 0.7 - uTime * 0.02).r;
        edgeGlow *= 0.5 + crawlNoise * 0.3 + crawlNoise2 * 0.3;

        finalIce += edgeGlow * vec3(0.4, 0.65, 1.0) * 0.7;

        // Crystalline frost sparkle
        vec2 sparkleUv = vIceUv * 20.0 + uTime * 0.1;
        float sparkleNoise = texture2D(uNoiseTexture, sparkleUv).r;
        float sparkleNoise2 = texture2D(uNoiseTexture, sparkleUv * 1.3 + 0.5).r;
        float sparkle = pow(sparkleNoise * sparkleNoise2, 5.0) * edgeGlow * 4.0;

        // Random flicker
        float flicker = step(0.97, fract(sin(dot(vIceUv, vec2(12.9898, 78.233)) + uTime * 10.0) * 43758.5453));
        sparkle += flicker * edgeGlow * 0.5;

        finalIce += sparkle * vec3(0.95, 0.98, 1.0);

        // Blend: iceCoverage=1 means full ice, iceCoverage=0 means full metal
        gl_FragColor.rgb = mix(gl_FragColor.rgb, finalIce, iceCoverage * 0.95);`
      );
    };
  }

  dispose() {
    this.trailTexture.dispose();
  }
}