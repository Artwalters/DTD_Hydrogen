import * as THREE from 'three';

/**
 * Performance Utilities
 * 
 * Hulpmiddelen voor het monitoren en optimaliseren van Three.js performance.
 * Bevat throttling, context loss handling, en visibility optimalisaties.
 */

/**
 * Throttle functie - beperkt function calls tot eens per delay milliseconden
 * 
 * @param fn - De functie om te throttlen
 * @param delay - Minimale tijd tussen calls in milliseconden
 */
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T {
  let lastCall = 0;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}

/**
 * Setup context loss handling voor WebGL
 * Voorkomt crashes bij GPU resets
 * 
 * @param renderer - Three.js renderer
 * @param onContextLost - Callback wanneer context verloren gaat
 * @param onContextRestored - Callback wanneer context hersteld wordt
 * @returns Cleanup functie
 */
export function setupContextLossHandling(
  renderer: THREE.WebGLRenderer,
  onContextLost: () => void,
  onContextRestored: () => void
): () => void {
  const handleContextLost = (event: Event) => {
    event.preventDefault();
    console.warn('WebGL context lost - animation paused');
    onContextLost();
  };
  
  const handleContextRestored = () => {
    console.log('WebGL context restored - resuming animation');
    onContextRestored();
  };
  
  renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);
  
  // Return cleanup function
  return () => {
    renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
  };
}

/**
 * Setup page visibility API
 * Pauseert rendering wanneer tab niet zichtbaar is
 * 
 * @param onHidden - Callback wanneer pagina verborgen wordt
 * @param onVisible - Callback wanneer pagina zichtbaar wordt
 * @returns Cleanup functie
 */
export function setupVisibilityHandling(
  onHidden: () => void,
  onVisible: () => void
): () => void {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      console.log('🛑 Tab hidden - rendering paused');
      onHidden();
    } else {
      console.log('▶️ Tab visible - rendering resumed');
      onVisible();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

/**
 * Setup resize handling met debouncing
 * 
 * @param callback - Functie om uit te voeren bij resize
 * @param delay - Debounce delay in milliseconden
 * @returns Cleanup functie
 */
export function setupResizeHandler(
  callback: () => void,
  delay: number = 100
): () => void {
  let resizeTimeout: ReturnType<typeof setTimeout>;
  
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(callback, delay);
  };
  
  window.addEventListener('resize', handleResize);
  
  // Return cleanup function
  return () => {
    clearTimeout(resizeTimeout);
    window.removeEventListener('resize', handleResize);
  };
}

/**
 * Mouse position tracker met throttling
 * 
 * @param container - Container element voor relative positioning
 * @param callback - Functie die mouse positie ontvangt (normalized -1 tot 1)
 * @param throttleDelay - Throttle delay in milliseconden
 * @returns Cleanup functie
 */
export function setupMouseTracking(
  container: HTMLElement,
  callback: (mouse: {x: number, y: number}) => void,
  throttleDelay: number = 16 // ~60fps
): () => void {
  const handleMouseMove = throttle((event: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    callback({x, y});
  }, throttleDelay);
  
  window.addEventListener('mousemove', handleMouseMove);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
  };
}

// Check if device is mobile - moved from SceneSetup to avoid duplication
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}