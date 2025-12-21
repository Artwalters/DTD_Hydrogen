import {useEffect, useRef, useId} from 'react';
import {IceButtonManager} from './IceButtonManager';

interface IceButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  variant?: 'glass' | 'solid';
}

/**
 * IceButton - Button with WebGL ice effect from edges
 *
 * Optimized version using:
 * - Shared WebGL renderer (IceButtonManager singleton)
 * - Lazy initialization (only activates on hover)
 * - Automatic cleanup
 */
export function IceButton({
  children,
  onClick,
  href,
  className = '',
  variant = 'glass',
}: IceButtonProps) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isRegistered = useRef(false);

  // Register with manager on mount
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (isRegistered.current) {
        IceButtonManager.unregister(id);
        isRegistered.current = false;
      }
    };
  }, [id]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (isRegistered.current) {
        IceButtonManager.updateSize(id);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [id]);

  const handleMouseEnter = () => {
    // Lazy registration - only register on first hover
    if (!isRegistered.current && canvasRef.current && containerRef.current) {
      IceButtonManager.register(id, canvasRef.current, containerRef.current);
      isRegistered.current = true;
    }

    // Activate ice effect
    IceButtonManager.activate(id);
  };

  const handleMouseLeave = () => {
    IceButtonManager.deactivate(id);
  };

  const baseClass = variant === 'solid' ? 'btn-solid' : 'btn-glass';

  const content = (
    <div
      ref={containerRef}
      className={`ice-button ${baseClass} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{position: 'relative', overflow: 'hidden'}}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
      <span style={{position: 'relative', zIndex: 1}}>{children}</span>
    </div>
  );

  if (href) {
    return (
      <a href={href} style={{textDecoration: 'none'}}>
        {content}
      </a>
    );
  }

  return content;
}
