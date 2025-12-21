import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';

/**
 * Texture Loader Utilities
 * 
 * Centraliseerde texture loading functies met caching en error handling.
 * Voorkomt dubbel laden van textures tussen scenes.
 */

// Cache voor geladen textures
const textureCache = new Map<string, THREE.Texture>();
const modelCache = new Map<string, THREE.Group>();

/**
 * Laadt een texture met caching
 * 
 * @param path - Path naar de texture
 * @param onProgress - Optional progress callback
 * @returns Promise met de geladen texture
 */
export async function loadTexture(
  path: string,
  onProgress?: (progress: number) => void
): Promise<THREE.Texture> {
  // Check cache
  if (textureCache.has(path)) {
    return textureCache.get(path)!;
  }
  
  const loader = new THREE.TextureLoader();
  
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (texture) => {
        // Cache de texture
        textureCache.set(path, texture);
        resolve(texture);
      },
      (xhr) => {
        if (onProgress) {
          onProgress((xhr.loaded / xhr.total) * 100);
        }
      },
      (error) => {
        console.error(`Failed to load texture: ${path}`, error);
        reject(error);
      }
    );
  });
}

/**
 * Laadt een HDRI environment map
 * 
 * @param path - Path naar de HDRI
 * @param pmremGenerator - PMREM generator voor environment map processing
 * @returns Promise met de processed environment texture
 */
export async function loadHDRI(
  path: string,
  pmremGenerator: THREE.PMREMGenerator
): Promise<THREE.Texture> {
  const loader = new RGBELoader();
  
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (texture) => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        texture.dispose(); // Cleanup originele texture
        resolve(envMap);
      },
      undefined,
      (error) => {
        console.error(`Failed to load HDRI: ${path}`, error);
        reject(error);
      }
    );
  });
}

/**
 * Laadt een GLTF/GLB model met Draco compression support
 * 
 * @param path - Path naar het model
 * @param onProgress - Optional progress callback
 * @returns Promise met de geladen model group
 */
export async function loadModel(
  path: string,
  onProgress?: (progress: number) => void
): Promise<THREE.Group> {
  // Check cache
  if (modelCache.has(path)) {
    return modelCache.get(path)!.clone(); // Return een clone voor unieke transforms
  }
  
  const loader = new GLTFLoader();
  
  // Setup Draco loader voor compressed models
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  loader.setDRACOLoader(dracoLoader);
  
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        // Cache het originele model
        modelCache.set(path, model);
        // Return een clone zodat elke scene eigen transforms kan hebben
        resolve(model.clone());
        
        // Cleanup Draco loader
        dracoLoader.dispose();
      },
      (xhr) => {
        if (onProgress) {
          onProgress((xhr.loaded / xhr.total) * 100);
        }
      },
      (error) => {
        console.error(`Failed to load model: ${path}`, error);
        dracoLoader.dispose();
        reject(error);
      }
    );
  });
}

/**
 * Maakt een procedurele smoke texture
 * 
 * @param size - Texture size (default 128 voor performance)
 * @returns Canvas texture voor smoke effect
 */
export function createSmokeTexture(size: number = 128): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Radial gradient voor smoke
  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.35)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.2)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.08)');
  gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.02)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Voeg noise toe voor realisme
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 15;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  // Blur voor smoother look
  const blurCanvas = document.createElement('canvas');
  blurCanvas.width = size;
  blurCanvas.height = size;
  const blurCtx = blurCanvas.getContext('2d')!;
  blurCtx.filter = 'blur(8px)';
  blurCtx.drawImage(canvas, 0, 0, size, size);

  const texture = new THREE.CanvasTexture(blurCanvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Cleanup alle cached textures en models
 * Belangrijk om te callen bij unmount om memory leaks te voorkomen
 */
export function clearTextureCache(): void {
  textureCache.forEach(texture => texture.dispose());
  textureCache.clear();
  
  modelCache.forEach(model => {
    model.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        } else if (Array.isArray(child.material)) {
          (child.material as THREE.Material[]).forEach(mat => mat.dispose());
        }
      }
    });
  });
  modelCache.clear();
}

/**
 * Ice textures type
 */
export interface IceTextures {
  color: THREE.Texture;
  normal: THREE.Texture;
  density: THREE.Texture;
  noise: THREE.Texture;
  radial: THREE.Texture;
}

/**
 * Shared ice textures singleton - loaded once, used everywhere
 */
let sharedIceTextures: IceTextures | null = null;
let sharedIceTexturesLoading = false;
const iceTexturesCallbacks: ((textures: IceTextures) => void)[] = [];

/**
 * Get shared ice textures (singleton pattern)
 * Returns cached textures if already loaded, otherwise loads them once
 */
export function getSharedIceTextures(): IceTextures | null {
  return sharedIceTextures;
}

/**
 * Load shared ice textures (called once, shared everywhere)
 */
export function loadSharedIceTextures(
  onLoaded?: (textures: IceTextures) => void
): IceTextures | null {
  // Already loaded - return immediately
  if (sharedIceTextures) {
    onLoaded?.(sharedIceTextures);
    return sharedIceTextures;
  }

  // Loading in progress - queue callback
  if (sharedIceTexturesLoading) {
    if (onLoaded) iceTexturesCallbacks.push(onLoaded);
    return null;
  }

  // Start loading
  sharedIceTexturesLoading = true;
  if (onLoaded) iceTexturesCallbacks.push(onLoaded);

  const loader = new THREE.TextureLoader();
  const iceTexturePath = '/assets/textures_dracarys/';

  const iceColorMap = loader.load(iceTexturePath + 'ice-diffuse-3.jpg');
  const iceNormalMap = loader.load(iceTexturePath + 'ice-normal-4.png');
  const iceDensityMap = loader.load(iceTexturePath + 'ice-density-4.jpg');
  const noiseTexture = loader.load(iceTexturePath + 'noise-fbm.png');
  const radialTexture = loader.load(iceTexturePath + 'radial.jpg');

  [iceColorMap, iceNormalMap, iceDensityMap, noiseTexture, radialTexture].forEach((tex) => {
    tex.flipY = false;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  });
  iceColorMap.colorSpace = THREE.SRGBColorSpace;

  sharedIceTextures = {
    color: iceColorMap,
    normal: iceNormalMap,
    density: iceDensityMap,
    noise: noiseTexture,
    radial: radialTexture,
  };

  // Notify all waiting callbacks
  iceTexturesCallbacks.forEach((cb) => cb(sharedIceTextures!));
  iceTexturesCallbacks.length = 0;

  return sharedIceTextures;
}

/**
 * TextureCache class for easy texture management
 */
export class TextureCache {
  private textureLoader = new THREE.TextureLoader();
  private loadedTextures = new Map<string, THREE.Texture>();

  loadMetalTextures() {
    const texturePath = '/assets/TEXTREUS_DTD/metal2/Metal055A_1K-JPG_';

    const colorMap = this.textureLoader.load(texturePath + 'Color.jpg');
    const normalMap = this.textureLoader.load(texturePath + 'NormalDX.jpg');
    const metalnessMap = this.textureLoader.load(texturePath + 'Metalness.jpg');
    const roughnessMap = this.textureLoader.load(texturePath + 'Roughness.jpg');

    colorMap.colorSpace = THREE.SRGBColorSpace;
    normalMap.colorSpace = THREE.LinearSRGBColorSpace;
    metalnessMap.colorSpace = THREE.LinearSRGBColorSpace;
    roughnessMap.colorSpace = THREE.LinearSRGBColorSpace;

    // Tiling: texture herhaalt 5x voor meer detail
    const tiling = 5;

    [colorMap, normalMap, metalnessMap, roughnessMap].forEach((tex) => {
      tex.flipY = false;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(tiling, tiling);
    });

    return {
      color: colorMap,
      normal: normalMap,
      metalness: metalnessMap,
      roughness: roughnessMap
    };
  }

  loadIceTextures(): IceTextures {
    // Use shared singleton - textures are loaded only once
    const existing = getSharedIceTextures();
    if (existing) return existing;

    // Load and return (will be cached for future calls)
    return loadSharedIceTextures()!;
  }

  loadSmokeTexture() {
    const smokeTexture = this.textureLoader.load('/assets/textures_dracarys/smoke.png');
    smokeTexture.wrapS = THREE.RepeatWrapping;
    smokeTexture.wrapT = THREE.RepeatWrapping;
    return smokeTexture;
  }

  dispose() {
    this.loadedTextures.forEach(texture => texture.dispose());
    this.loadedTextures.clear();
    // Note: shared ice textures are NOT disposed here - they're shared globally
  }
}