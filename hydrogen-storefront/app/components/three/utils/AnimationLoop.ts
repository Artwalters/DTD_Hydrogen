import * as THREE from 'three';

/**
 * Animation Loop Utility
 * 
 * Manages animation timing, frame counting, and delta time calculations.
 * Extracted from the original HeroScene/FooterScene implementations.
 */

export interface AnimationLoopOptions {
  enableFrameSkipping?: boolean;
  frameSkipInterval?: number;
}

export class AnimationLoop {
  private clock: THREE.Clock;
  private frameCount: number = 0;
  private elapsedTime: number = 0;
  private options: Required<AnimationLoopOptions>;

  constructor(options: AnimationLoopOptions = {}) {
    this.clock = new THREE.Clock();
    this.options = {
      enableFrameSkipping: options.enableFrameSkipping ?? false,
      frameSkipInterval: options.frameSkipInterval ?? 2
    };
  }

  /**
   * Update animation timing and check if frame should be rendered
   * @returns {object} Animation timing data and whether to skip frame
   */
  update(): {
    deltaTime: number;
    elapsedTime: number;
    frameCount: number;
    shouldSkipFrame: boolean;
  } {
    const deltaTime = this.clock.getDelta();
    this.elapsedTime += deltaTime;
    this.frameCount++;

    const shouldSkipFrame = this.options.enableFrameSkipping && 
                           (this.frameCount % this.options.frameSkipInterval === 0);

    return {
      deltaTime,
      elapsedTime: this.elapsedTime,
      frameCount: this.frameCount,
      shouldSkipFrame
    };
  }

  /**
   * Get current elapsed time
   */
  getElapsedTime(): number {
    return this.elapsedTime;
  }

  /**
   * Get current frame count
   */
  getFrameCount(): number {
    return this.frameCount;
  }

  /**
   * Reset timing
   */
  reset(): void {
    this.clock = new THREE.Clock();
    this.frameCount = 0;
    this.elapsedTime = 0;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    // Clock doesn't need explicit disposal
  }
}