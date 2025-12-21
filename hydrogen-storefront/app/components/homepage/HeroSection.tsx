import {useState, useEffect, lazy, Suspense, startTransition} from 'react';

// Lazy load SharedThreeScene to avoid SSR issues
const SharedThreeScene = lazy(() => 
  import('../three').then(mod => ({ default: mod.SharedThreeScene }))
);

export interface HeroSectionProps {
  productImageSrc?: string;
  leftText?: string;
  rightText?: string;
}

export function HeroSection({
  productImageSrc,
  leftText = 'DARE TO DREAM',
  rightText = 'genesis drop',
}: HeroSectionProps) {
  // Only render 3D scene on client
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setIsClient(true);
    });
  }, []);

  return (
    <section className="dtd-hero">
      {/* 3D Scene with DTD Logo - client only */}
      <div className="dtd-hero__logo">
        {isClient && (
          <Suspense fallback={null}>
            <SharedThreeScene type="hero" />
          </Suspense>
        )}
      </div>

      {/* Product image in front of logo */}
      {productImageSrc && (
        <img
          src={productImageSrc}
          alt="Featured product"
          className="dtd-hero__product-image"
        />
      )}

      {/* Text overlays */}
      <span className="dtd-hero__text-left">{leftText}</span>
      <span className="dtd-hero__text-right">{rightText}</span>

      {/* Scroll indicator */}
      <div className="dtd-hero__scroll-indicator">
        <ScrollIcon />
      </div>
    </section>
  );
}

function ScrollIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{opacity: 0.5}}
    >
      <polyline points="7 13 12 18 17 13" />
      <polyline points="7 6 12 11 17 6" />
    </svg>
  );
}
