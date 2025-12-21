import {useState, useEffect, lazy, Suspense, startTransition} from 'react';

// Lazy load SharedThreeScene to avoid SSR issues
const SharedThreeScene = lazy(() => 
  import('../three').then(mod => ({ default: mod.SharedThreeScene }))
);

export interface FooterLogoProps {
  brandLeft?: string;
  brandRight?: string;
}

export function FooterLogo({
  brandLeft = 'DARE TO DREAM',
  brandRight = 'genesis drop',
}: FooterLogoProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setIsClient(true);
    });
  }, []);

  return (
    <section className="dtd-footer-logo">
      {/* 3D Scene with logo and smoke */}
      <div className="dtd-footer-logo__scene">
        {isClient && (
          <Suspense fallback={null}>
            <SharedThreeScene type="footer" />
          </Suspense>
        )}
      </div>

      <span className="dtd-footer-logo__brand-left">{brandLeft}</span>
      <span className="dtd-footer-logo__brand-right">{brandRight}</span>
    </section>
  );
}
