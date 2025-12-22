import * as THREE from 'three';

/**
 * Texture Loader Utilities
 * 
 * Centraliseerde texture loading functies voor Three.js scenes.
 * Bevat geoptimaliseerde texture loaders voor metal, ice en smoke effecten.
 */

// Shared texture loader
const textureLoader = new THREE.TextureLoader();

/**
 * Load ice textures - singleton pattern voor memory efficiency
 * Shared tussen alle instances omdat ze read-only zijn
 */
let sharedIceTextures: {
  color: THREE.Texture;
  normal: THREE.Texture;
  density: THREE.Texture;
  noise: THREE.Texture;
  radial: THREE.Texture;
} | null = null;

export function loadSharedIceTextures() {
  if (!sharedIceTextures) {
    const textureLoader = new THREE.TextureLoader();
    
    // Ice texture paths
    const iceColor = textureLoader.load('/assets/textures_dracarys/ice-diffuse-3.jpg');
    const iceNormal = textureLoader.load('/assets/textures_dracarys/ice-normal-4.png');
    const iceDensity = textureLoader.load('/assets/textures_dracarys/ice-density-4.jpg');
    const noiseTexture = textureLoader.load('/assets/textures_dracarys/noise-fbm.png');
    const radialTexture = textureLoader.load('/assets/textures_dracarys/radial.jpg');
    
    // Ice texture settings
    iceColor.wrapS = iceColor.wrapT = THREE.RepeatWrapping;
    iceNormal.wrapS = iceNormal.wrapT = THREE.RepeatWrapping;
    iceDensity.wrapS = iceDensity.wrapT = THREE.RepeatWrapping;
    noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;
    radialTexture.wrapS = radialTexture.wrapT = THREE.ClampToEdgeWrapping;
    
    sharedIceTextures = {
      color: iceColor,
      normal: iceNormal,
      density: iceDensity,
      noise: noiseTexture,
      radial: radialTexture
    };
  }
  
  return sharedIceTextures;
}

/**
 * TextureCache class voor het beheren van texture loading en caching
 */
export class TextureCache {
  private cache: Map<string, THREE.Texture> = new Map();

  /**
   * Load metal textures voor het model
   */
  loadMetalTextures() {
    const textures = {
      color: this.loadTexture('/assets/TEXTREUS_DTD/metal2/Metal055A_1K-JPG_Color.jpg'),
      normal: this.loadTexture('/assets/TEXTREUS_DTD/metal2/Metal055A_1K-JPG_NormalGL.jpg'),
      metalness: this.loadTexture('/assets/TEXTREUS_DTD/metal2/Metal055A_1K-JPG_Metalness.jpg'),
      roughness: this.loadTexture('/assets/TEXTREUS_DTD/metal2/Metal055A_1K-JPG_Roughness.jpg'),
    };

    // Metal texture settings
    Object.values(textures).forEach(texture => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 2);
    });

    return textures;
  }

  /**
   * Load ice textures - uses singleton pattern
   */
  loadIceTextures() {
    return loadSharedIceTextures();
  }

  /**
   * Load smoke texture
   */
  loadSmokeTexture(): THREE.Texture {
    const texture = this.loadTexture('/assets/textures_dracarys/smoke.png');
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Generic texture loader with caching
   */
  private loadTexture(path: string): THREE.Texture {
    if (this.cache.has(path)) {
      return this.cache.get(path)!;
    }

    const texture = textureLoader.load(path);
    texture.anisotropy = 16;
    this.cache.set(path, texture);
    return texture;
  }

  /**
   * Dispose all cached textures
   */
  dispose() {
    this.cache.forEach(texture => texture.dispose());
    this.cache.clear();
  }
}