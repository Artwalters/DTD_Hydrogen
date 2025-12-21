import {useEffect} from 'react';
import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;
let threeJsCallbacks: Array<() => void> = [];
let isScrolling = false;
let scrollTimeout: ReturnType<typeof setTimeout>;

export function useLenis() {
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // Create Lenis instance
    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });

    // SEPARATE LENIS LOOP - Only handle scroll
    function lenisRaf(time: number) {
      lenisInstance?.raf(time);
      requestAnimationFrame(lenisRaf);
    }

    // SEPARATE THREE.JS LOOP - Throttled and scroll-aware
    let lastThreeJsFrame = 0;
    function threeJsRaf(time: number) {
      // Throttle Three.js to 30fps during scroll, 60fps when idle
      const targetInterval = isScrolling ? 33.33 : 16.67; // 30fps vs 60fps
      
      if (time - lastThreeJsFrame >= targetInterval) {
        threeJsCallbacks.forEach(callback => callback());
        lastThreeJsFrame = time;
      }
      
      requestAnimationFrame(threeJsRaf);
    }

    // Detect scroll state
    lenisInstance.on('scroll', () => {
      isScrolling = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 150); // Resume full quality 150ms after scroll stops
    });

    // Start both loops
    requestAnimationFrame(lenisRaf);
    requestAnimationFrame(threeJsRaf);

    // Cleanup
    return () => {
      lenisInstance?.destroy();
      lenisInstance = null;
      threeJsCallbacks = [];
      clearTimeout(scrollTimeout);
    };
  }, []);

  return lenisInstance;
}

// Export functions to control Lenis from anywhere
export function stopScroll() {
  lenisInstance?.stop();
}

export function startScroll() {
  lenisInstance?.start();
}

export function scrollTo(target: string | number | HTMLElement, options?: object) {
  lenisInstance?.scrollTo(target, options);
}

export function getLenis() {
  return lenisInstance;
}

// Three.js synchronization functions
export function addThreeJsCallback(callback: () => void) {
  threeJsCallbacks.push(callback);
}

export function removeThreeJsCallback(callback: () => void) {
  threeJsCallbacks = threeJsCallbacks.filter(cb => cb !== callback);
}

// Scroll state access
export function getScrollState() {
  return { isScrolling };
}
