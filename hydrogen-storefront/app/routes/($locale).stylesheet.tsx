import {IceButton} from '~/components/ui/IceButton';

export const meta = () => {
  return [{title: 'Stylesheet | Design System'}];
};

export default function Stylesheet() {
  return (
    <div style={{
      background: 'var(--color-dark)',
      color: 'var(--color-light)',
      minHeight: '100vh',
      padding: '2em'
    }}>
      <h1 style={{fontSize: 'var(--font-h1)', marginBottom: '1em'}}>Design System</h1>
      <p style={{color: 'var(--color-muted)', marginBottom: '2em'}}>
        Overzicht van alle CSS variables en componenten.
      </p>

      {/* Typography */}
      <Section title="Typography">
        <SubSection title="Headings">
          <div style={{display: 'flex', flexDirection: 'column', gap: '1em'}}>
            <TypographyRow variable="--font-h1" value="3em">
              <span style={{fontSize: 'var(--font-h1)'}}>Heading 1</span>
            </TypographyRow>
            <TypographyRow variable="--font-h2" value="2em">
              <span style={{fontSize: 'var(--font-h2)'}}>Heading 2</span>
            </TypographyRow>
            <TypographyRow variable="--font-h3" value="1.5em">
              <span style={{fontSize: 'var(--font-h3)'}}>Heading 3</span>
            </TypographyRow>
            <TypographyRow variable="--font-h4" value="1.25em">
              <span style={{fontSize: 'var(--font-h4)'}}>Heading 4</span>
            </TypographyRow>
          </div>
        </SubSection>

        <SubSection title="Paragraphs">
          <div style={{display: 'flex', flexDirection: 'column', gap: '1em'}}>
            <TypographyRow variable="--font-p-big" value="1.125em">
              <span style={{fontSize: 'var(--font-p-big)'}}>Paragraph Big - Lorem ipsum dolor sit amet</span>
            </TypographyRow>
            <TypographyRow variable="--font-p-base" value="1em">
              <span style={{fontSize: 'var(--font-p-base)'}}>Paragraph Base - Lorem ipsum dolor sit amet</span>
            </TypographyRow>
            <TypographyRow variable="--font-p-small" value="0.875em">
              <span style={{fontSize: 'var(--font-p-small)'}}>Paragraph Small - Lorem ipsum dolor sit amet</span>
            </TypographyRow>
          </div>
        </SubSection>
      </Section>

      {/* Colors */}
      <Section title="Colors">
        <SubSection title="Base Colors">
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10em, 1fr))', gap: '1em'}}>
            <ColorSwatch name="--color-dark" color="#0a0a0a" />
            <ColorSwatch name="--color-light" color="#f1f1f1" light />
            <ColorSwatch name="--color-muted" color="#999999" />
            <ColorSwatch name="--color-border" color="rgba(255,255,255,0.1)" />
          </div>
        </SubSection>

        <SubSection title="Glass Effect">
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10em, 1fr))', gap: '1em'}}>
            <ColorSwatch name="--glass-bg" color="rgba(255,255,255,0.08)" />
            <ColorSwatch name="--glass-bg-hover" color="rgba(255,255,255,0.12)" />
            <ColorSwatch name="--glass-border" color="rgba(255,255,255,0.08)" />
          </div>
        </SubSection>
      </Section>

      {/* Spacing */}
      <Section title="Spacing">
        <div style={{display: 'flex', flexWrap: 'wrap', gap: '2em', alignItems: 'flex-end'}}>
          <SpacingBox name="--space-sm" size="0.5em" />
          <SpacingBox name="--space-md" size="1em" />
          <SpacingBox name="--space-lg" size="2em" />
          <SpacingBox name="--space-section" size="4em" />
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Buttons">
        <SubSection title="Glass Button (.btn-glass)">
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '1em', alignItems: 'center'}}>
            <button className="btn-glass">Button</button>
            <button className="btn-glass">Shop</button>
            <button className="btn-glass">About</button>
            <a href="/stylesheet" className="btn-glass">Link Button</a>
          </div>
        </SubSection>

        <SubSection title="Solid Button (.btn-solid)">
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '1em', alignItems: 'center'}}>
            <button className="btn-solid">Button</button>
            <button className="btn-solid">Subscribe</button>
            <a href="/stylesheet" className="btn-solid">Link Button</a>
          </div>
        </SubSection>

        <SubSection title="With Icons">
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '1em', alignItems: 'center'}}>
            <button className="btn-glass">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              Cart
            </button>
            <button className="btn-glass">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              Wishlist
            </button>
            <button className="btn-glass">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              Search
            </button>
            <button className="btn-solid">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
              Next
            </button>
          </div>
        </SubSection>

        <SubSection title="Icon Only">
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '1em', alignItems: 'center'}}>
            <button className="btn-glass" style={{padding: '0.625em'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </button>
            <button className="btn-glass" style={{padding: '0.625em'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <button className="btn-glass" style={{padding: '0.625em'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            <button className="btn-glass" style={{padding: '0.625em'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button className="btn-glass" style={{padding: '0.625em'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </SubSection>

        <SubSection title="DTD Genesis Drop Effect">
          <p style={{color: 'var(--color-muted)', marginBottom: '1em', fontSize: 'var(--font-p-small)'}}>
            Hover over de buttons om het ijs effect te zien.
          </p>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '1em', alignItems: 'center'}}>
            <IceButton variant="glass">Ice Glass</IceButton>
            <IceButton variant="solid">Ice Solid</IceButton>
            <IceButton variant="glass">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '0.5em'}}>
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              Cart
            </IceButton>
            <IceButton variant="glass" href="/stylesheet">Link Button</IceButton>
          </div>
        </SubSection>
      </Section>

      {/* Misc */}
      <Section title="Misc">
        <div style={{display: 'flex', flexDirection: 'column', gap: '1em'}}>
          <Row label="--radius" value="0.25em">
            <div style={{
              width: '4em',
              height: '4em',
              background: 'var(--color-light)',
              borderRadius: 'var(--radius)'
            }}></div>
          </Row>
          <Row label="--transition" value="150ms ease">
            <button className="btn-glass">Hover me</button>
          </Row>
        </div>
      </Section>
    </div>
  );
}

// Helper Components
function Section({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <section style={{marginBottom: '3em'}}>
      <h2 style={{
        fontSize: 'var(--font-h3)',
        marginBottom: '1em',
        paddingBottom: '0.5em',
        borderBottom: '1px solid var(--color-border)'
      }}>{title}</h2>
      {children}
    </section>
  );
}

function SubSection({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <div style={{marginBottom: '2em'}}>
      <h3 style={{
        fontSize: 'var(--font-p-small)',
        color: 'var(--color-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '1em'
      }}>{title}</h3>
      {children}
    </div>
  );
}

function TypographyRow({variable, value, children}: {variable: string; value: string; children: React.ReactNode}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '2em',
      padding: '0.75em 1em',
      background: '#1a1a1a',
      borderRadius: 'var(--radius)'
    }}>
      <code style={{minWidth: '10em', fontSize: '0.875em'}}>{variable}</code>
      <span style={{minWidth: '5em', color: 'var(--color-muted)', fontSize: '0.875em'}}>{value}</span>
      <div>{children}</div>
    </div>
  );
}

function ColorSwatch({name, color, light}: {name: string; color: string; light?: boolean}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5em',
      padding: '1.5em',
      borderRadius: 'var(--radius)',
      background: color,
      color: light ? 'var(--color-dark)' : 'var(--color-light)',
      minHeight: '8em'
    }}>
      <code style={{fontSize: '0.75em'}}>{name}</code>
      <span style={{fontSize: '0.75em', opacity: 0.8}}>{color}</span>
    </div>
  );
}

function SpacingBox({name, size}: {name: string; size: string}) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5em'}}>
      <div style={{
        width: size,
        height: size,
        background: 'var(--color-light)',
        borderRadius: 'var(--radius)'
      }}></div>
      <code style={{fontSize: '0.625em', color: 'var(--color-muted)'}}>{name}</code>
      <span style={{fontSize: '0.75em', color: 'var(--color-muted)'}}>{size}</span>
    </div>
  );
}

function Row({label, value, children}: {label: string; value: string; children: React.ReactNode}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '2em',
      padding: '0.75em 1em',
      background: '#1a1a1a',
      borderRadius: 'var(--radius)'
    }}>
      <code style={{minWidth: '10em', fontSize: '0.875em'}}>{label}</code>
      <span style={{minWidth: '8em', color: 'var(--color-muted)', fontSize: '0.875em'}}>{value}</span>
      <div>{children}</div>
    </div>
  );
}
