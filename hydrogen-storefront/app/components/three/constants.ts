/**
 * Three.js Scene Constants
 * 
 * Centrale locatie voor alle constanten gebruikt in Three.js scenes.
 * Dit zorgt voor consistentie tussen verschillende scenes.
 */

// HDRI Environment Settings
export const HDRI_ROTATION = {
  horizontal: 90,
  vertical: -260
} as const;

export const HDRI_ROTATION_FOOTER = {
  horizontal: 90,
  vertical: -260
} as const;

// Performance Settings
export const PERFORMANCE = {
  maxPixelRatio: 1.5,  // Reduced from 2
  renderTargetSamples: 2,  // Reduced from 4
  defaultFPS: 60,
  throttledFPS: 30,
  mobile: {
    maxPixelRatio: 1.0,  // Lower resolution for mobile
    renderTargetSamples: 0,  // No anti-aliasing on mobile
    targetFPS: 30,  // Lower FPS for mobile
    smokeCount: 100,  // Fewer particles on mobile
    enablePostProcessing: false,  // Disable post-processing on mobile
  }
} as const;

// Scene Colors
export const COLORS = {
  scene: {
    background: 0x000000,
    fog: 0x000000
  },
  lights: {
    main: 0xffffff,
    ambient: 0xffffff
  }
} as const;

// Smoke Effect Settings  
export const SMOKE_CONFIG = {
  count: 200,  // Reduced from 400 (50% reduction)
  geometry: {
    width: 8,
    height: 8
  },
  material: {
    baseAlpha: 0.15,  // Slightly increased to compensate for fewer particles
    blending: 'additive' as const
  },
  distribution: {
    xRange: { min: -11, max: -3 },
    ySpread: 70,
    zSpread: 160
  },
  orbit: {
    xRadius: 6.0,
    zRadius: 8.0
  }
} as const;

// Ice Effect Settings
export const ICE_CONFIG = {
  maxTrailPoints: 64,
  trailInterval: 0.025,
  maxRadius: 0.04,    // Iets kleiner (was 0.05)
  effectRadius: 0.08,  // Iets kleiner (was 0.1)
  fadeSpeed: 0.05,     // Iets sneller verdwijnen (was 0.04)
  maxAge: 0.7          // Iets korter zichtbaar (was 0.8)
} as const;

// Animation Configuration
export const ANIMATION_CONFIG = {
  floatSpeed: 0.3,
  floatAmplitude: 0.05,
  mouseFollowSpeed: 0.015,
  mouseFollowRange: 0.4,
  mouseRotationScale: { x: -0.03, z: 0.02 }
} as const;

// Raycaster Configuration
export const RAYCASTER_CONFIG = {
  lineThreshold: 0.1,
  pointsThreshold: 0.1
} as const;

// Model Settings
export const MODEL_CONFIG = {
  hero: {
    path: '/assets/dtd_logo7.glb',
    scale: [3.51, 3.51, 3.51] as [number, number, number],
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
  footer: {
    path: '/assets/Daretodream_full.glb',
    scale: [5.625, 5.625, 5.625] as [number, number, number],
    position: [5, 0, 0] as [number, number, number],
    rotation: [0, Math.PI, 0] as [number, number, number],
  }
} as const;

// Camera Settings
export const CAMERA_CONFIG = {
  fov: 75,
  near: 0.1,
  far: 1000,
  desktop: {
    distance: 18.009
  },
  mobile: {
    distance: 32.016
  }
} as const;