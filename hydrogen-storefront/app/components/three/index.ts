/**
 * Three.js Components Exports
 * 
 * Deze module exporteert alle herbruikbare Three.js componenten
 * voor gebruik in verschillende scenes via SharedThreeScene
 */

// Main shared component
export {SharedThreeScene} from './SharedThreeScene';

// Core utilities
export * from './utils/SceneSetup';
export * from './utils/Performance';
export * from './utils/TextureLoaders';
export * from './utils/ModelInteraction';
export * from './utils/AnimationLoop';

// Effects
export * from './effects/SmokeEffect';
export * from './effects/IceTrailEffect';

// Lighting
export * from './lighting/SceneLighting';

// Post-processing
export * from './postprocessing/GodrayEffect';

// Constants
export * from './constants';