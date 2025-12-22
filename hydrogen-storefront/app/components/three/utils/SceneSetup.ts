import * as THREE from 'three';
import {COLORS, CAMERA_CONFIG, PERFORMANCE} from '../constants';
import {isMobile} from './Performance';

/**
 * Scene Setup Utilities
 * 
 * Bevat herbruikbare functies voor het opzetten van Three.js scenes.
 * Zorgt voor consistente scene configuratie tussen verschillende componenten.
 */

/**
 * Maakt een basis Three.js scene met standaard instellingen
 */
export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.scene.background);
  
  // Environment intensity voor HDRI lighting
  scene.environmentIntensity = 0.4;
  
  return scene;
}

/**
 * Maakt een camera met responsive instellingen
 * 
 * @param sizes - Object met width en height van de container
 * @param isMobile - Boolean of het een mobiel apparaat is
 */
export function createCamera(sizes: {width: number; height: number}, isMobile = false): THREE.PerspectiveCamera {
  const distance = isMobile ? CAMERA_CONFIG.mobile.distance : CAMERA_CONFIG.desktop.distance;
  
  const camera = new THREE.PerspectiveCamera(
    CAMERA_CONFIG.fov,
    sizes.width / sizes.height,
    CAMERA_CONFIG.near,
    CAMERA_CONFIG.far
  );
  
  camera.position.set(distance, 0, 0);
  camera.lookAt(0, 0, 0);
  
  return camera;
}

/**
 * Maakt een geoptimaliseerde renderer
 * 
 * @param sizes - Object met width en height van de container
 * @returns Object met renderer en pixelRatio
 */
export function createRenderer(sizes: {width: number; height: number}, isMobile = false) {
  const maxPixelRatio = isMobile ? PERFORMANCE.mobile.maxPixelRatio : PERFORMANCE.maxPixelRatio;
  const pixelRatio = Math.min(window.devicePixelRatio, maxPixelRatio);
  
  const renderer = new THREE.WebGLRenderer({
    antialias: !isMobile,  // Disable antialias on mobile
    powerPreference: isMobile ? 'default' : 'high-performance',
    failIfMajorPerformanceCaveat: false,
    alpha: false,  // No transparency for better performance
    stencil: false,  // Disable stencil buffer
    depth: true,
    premultipliedAlpha: false,
  });
  
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.info.autoReset = false;
  
  // Mobile optimizations
  if (isMobile) {
    renderer.shadowMap.enabled = false;  // Disable shadows on mobile
    renderer.physicallyCorrectLights = false;  // Simpler lighting
  }
  
  return { renderer, pixelRatio };
}

/**
 * Maakt een render target voor post-processing
 * 
 * @param sizes - Object met width en height
 * @param pixelRatio - De pixel ratio om te gebruiken
 */
export function createRenderTarget(sizes: {width: number; height: number}, pixelRatio: number): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(
    sizes.width * pixelRatio,
    sizes.height * pixelRatio,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      samples: PERFORMANCE.renderTargetSamples,
    }
  );
}

/**
 * Setup voor post-processing scene
 */
export function createPostProcessingSetup() {
  const scenePost = new THREE.Scene();
  const cameraPost = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -1000, 1000);
  
  const quadGeometry = new THREE.PlaneGeometry(1, 1);
  
  return { scenePost, cameraPost, quadGeometry };
}


/**
 * Container size helper
 */
export function getContainerSizes(container: HTMLDivElement): {width: number; height: number} {
  return {
    width: container.clientWidth,
    height: container.clientHeight,
  };
}

/**
 * Complete scene setup - combines all setup functions
 * 
 * @param container - HTML container element
 */
export function createSceneSetup(container: HTMLDivElement) {
  const sizes = getContainerSizes(container);
  const isMobileDevice = isMobile();
  const scene = createScene();
  const camera = createCamera(sizes, isMobileDevice);
  const { renderer, pixelRatio } = createRenderer(sizes, isMobileDevice);
  
  container.appendChild(renderer.domElement);
  
  return {
    scene,
    camera,
    renderer,
    sizes,
    pixelRatio,
    isMobile: isMobileDevice
  };
}