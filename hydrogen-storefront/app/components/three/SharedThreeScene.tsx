import {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import {addThreeJsCallback, removeThreeJsCallback, getScrollState} from '~/hooks/useLenis';
import {
  HDRI_ROTATION,
  HDRI_ROTATION_FOOTER,
  SMOKE_CONFIG,
  MODEL_CONFIG,
  PERFORMANCE,
} from './constants';
import {createSceneSetup} from './utils/SceneSetup';
import {throttle, setupContextLossHandling, setupVisibilityHandling, setupResizeHandler} from './utils/Performance';
import {TextureCache} from './utils/TextureLoaders';
import {ModelInteraction} from './utils/ModelInteraction';
import {AnimationLoop} from './utils/AnimationLoop';
import {SmokeEffect} from './effects/SmokeEffect';
import {IceTrailEffect} from './effects/IceTrailEffect';
import {SceneLighting} from './lighting/SceneLighting';
import {GodrayPostProcessing} from './postprocessing/GodrayEffect';

export interface SharedThreeSceneProps {
  type: 'hero' | 'footer';
  modelPath?: string;
  modelScale?: [number, number, number];
  modelPosition?: [number, number, number];
  modelRotation?: [number, number, number];
}

export function SharedThreeScene({
  type,
  modelPath = type === 'hero' ? MODEL_CONFIG.hero.path : MODEL_CONFIG.footer.path,
  modelScale = type === 'hero' ? MODEL_CONFIG.hero.scale : MODEL_CONFIG.footer.scale,
  modelPosition = type === 'hero' ? MODEL_CONFIG.hero.position : MODEL_CONFIG.footer.position,
  modelRotation = type === 'hero' ? MODEL_CONFIG.hero.rotation : MODEL_CONFIG.footer.rotation,
}: SharedThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let animationFrameId: number | undefined;
    let model: THREE.Group | null = null;
    let mixer: THREE.AnimationMixer | null = null;

    // Scene setup (get isMobile first)
    const {scene, camera, renderer, sizes, pixelRatio, isMobile} = createSceneSetup(container);

    // Mouse tracking - only when mouse is within container bounds (disabled on mobile)
    const mouse = {x: 0, y: 0};
    let isMouseInContainer = false;
    
    const handleMouseMove = !isMobile ? throttle((event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      
      // Check if mouse is within container bounds
      if (event.clientX >= rect.left && event.clientX <= rect.right &&
          event.clientY >= rect.top && event.clientY <= rect.bottom) {
        isMouseInContainer = true;
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      } else {
        // Mouse is outside container - gradually return to neutral position
        isMouseInContainer = false;
        mouse.x *= 0.95;
        mouse.y *= 0.95;
      }
    }, 16) : () => {}; // No-op function for mobile
    
    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Footer krijgt aangepaste HDRI intensity
    if (type === 'footer') {
      scene.environmentIntensity = 0.5;
    }

    // Context loss handling
    let contextLost = false;
    const cleanupContextLoss = setupContextLossHandling(
      renderer,
      () => { 
        contextLost = true;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      },
      () => { 
        contextLost = false;
        if (isPageVisible) animate();
      }
    );

    // Visibility optimization
    let isPageVisible = true;
    const cleanupVisibility = setupVisibilityHandling(
      () => {
        isPageVisible = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      },
      () => {
        isPageVisible = true;
        if (!contextLost) animate();
      }
    );

    // Initialize effects and systems
    const textureCache = new TextureCache();
    // Mobile-optimized smoke effect
    const smokeOptions = isMobile ? { count: PERFORMANCE.mobile.smokeCount } : {};
    const smokeEffect = new SmokeEffect(scene, textureCache, smokeOptions);
    const iceTrailEffect = !isMobile ? new IceTrailEffect(textureCache) : null;
    // Footer: subtiele verlichting rondom het model
    const lightingConfig = type === 'footer'
      ? { ambientIntensity: 0.3, mainLightIntensity: 0.4, frontLightIntensity: 0.2 }
      : {};
    const sceneLighting = new SceneLighting(scene, lightingConfig);
    // Disable post-processing on mobile for performance
    const godrayPostProcessing = !isMobile ? new GodrayPostProcessing(sizes, pixelRatio) : null;
    const modelInteraction = new ModelInteraction();
    const animationLoop = new AnimationLoop();

    // Setup loaders
    const rgbeLoader = new RGBELoader();
    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    gltfLoader.setDRACOLoader(dracoLoader);

    // Load HDR environment
    rgbeLoader.load('/assets/studio_small_09_1k.hdr', (environmentMap) => {
      environmentMap.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = environmentMap;
      const hdriRotation = type === 'footer' ? HDRI_ROTATION_FOOTER : HDRI_ROTATION;
      scene.environmentRotation.y = (hdriRotation.horizontal * Math.PI) / 180;
      scene.environmentRotation.x = (hdriRotation.vertical * Math.PI) / 180;
    });

    // Raycaster is now handled by ModelInteraction utility

    // Load model
    gltfLoader.load(modelPath, (gltf) => {
      model = gltf.scene;
      model.scale.set(...modelScale);
      model.position.set(...modelPosition);
      model.rotation.set(...modelRotation);

      // Apply textures and inject ice shader
      const metalTextures = textureCache.loadMetalTextures();
      const iceTextures = textureCache.loadIceTextures();

      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const material = mesh.material as THREE.MeshStandardMaterial;

          // Apply metal textures
          material.map = metalTextures.color;
          material.normalMap = metalTextures.normal;
          material.metalnessMap = metalTextures.metalness;
          material.roughnessMap = metalTextures.roughness;
          material.metalness = 1.0;
          material.roughness = 1.0;

          // Inject ice effect (only on desktop)
          if (!isMobile && iceTrailEffect) {
            iceTrailEffect.injectIceShader(material, iceTextures);
          }
          material.needsUpdate = true;
        }
      });

      scene.add(model);
      if (!isMobile && iceTrailEffect) {
        iceTrailEffect.calculateBoundingSphere(model);
      }

      // Setup animation mixer
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
          const action = mixer!.clipAction(clip);
          action.play();
        });
      }
    });

    // Resize handler
    const cleanupResize = setupResizeHandler(() => {
      sizes.width = container.clientWidth;
      sizes.height = container.clientHeight;

      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      renderer.setSize(sizes.width, sizes.height);
      const newPixelRatio = Math.min(window.devicePixelRatio, isMobile ? PERFORMANCE.mobile.maxPixelRatio : PERFORMANCE.maxPixelRatio);
      renderer.setPixelRatio(newPixelRatio);

      if (godrayPostProcessing) {
        godrayPostProcessing.resize(sizes.width, sizes.height, newPixelRatio);
      }
    }, 100);

    // Check if element is in viewport
    let isInViewport = false;
    const checkViewport = () => {
      const rect = container.getBoundingClientRect();
      isInViewport = (
        rect.bottom >= 0 &&
        rect.top <= window.innerHeight &&
        rect.right >= 0 &&
        rect.left <= window.innerWidth
      );
    };

    // Animation loop
    const animate = () => {
      if (contextLost || !isPageVisible) return;

      // Check if scene is visible
      checkViewport();
      if (!isInViewport) return;

      // Update animation timing
      const { deltaTime, elapsedTime, shouldSkipFrame } = animationLoop.update();

      if (shouldSkipFrame) return;

      // Update animation mixer
      if (mixer) {
        mixer.update(deltaTime);
      }

      // Get scroll state for performance optimization
      const { isScrolling } = getScrollState();

      // Mouse interaction with model (only on desktop)
      if (model && !isMobile) {
        // Skip model interaction during scroll for performance
        if (!isScrolling) {
          modelInteraction.updateModelInteraction(model, mouse, elapsedTime, deltaTime);
        }

        // Handle ice trail effect with scroll-aware optimization
        if (iceTrailEffect) {
          const intersects = !isScrolling ? 
            modelInteraction.performRaycasting(mouse, camera, model) : [];
          iceTrailEffect.update(deltaTime, elapsedTime, intersects, isScrolling);
        }
      }

      // Update effects
      smokeEffect.update(elapsedTime);

      // Render with post-processing (mobile renders directly)
      if (godrayPostProcessing) {
        godrayPostProcessing.render(renderer, scene, camera, elapsedTime);
      } else {
        renderer.render(scene, camera);
      }
    };

    // Register with Lenis
    addThreeJsCallback(animate);

    // Cleanup
    return () => {
      removeThreeJsCallback(animate);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      
      // Cleanup event handlers
      cleanupResize();
      cleanupVisibility();
      cleanupContextLoss();
      
      if (!isMobile) {
        window.removeEventListener('mousemove', handleMouseMove);
      }

      // Dispose resources
      renderer.dispose();
      if (godrayPostProcessing) {
        godrayPostProcessing.dispose();
      }
      smokeEffect.dispose();
      if (iceTrailEffect) {
        iceTrailEffect.dispose();
      }
      textureCache.dispose();
      modelInteraction.dispose();
      animationLoop.dispose();
      dracoLoader.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
    };
  }, [type, modelPath, modelScale, modelPosition, modelRotation]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    />
  );
}