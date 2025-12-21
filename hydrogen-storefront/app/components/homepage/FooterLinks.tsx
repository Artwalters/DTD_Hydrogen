import {Link} from 'react-router';

export interface FooterLinksProps {
  knowMoreLinks?: Array<{label: string; url: string}>;
  socialLinks?: Array<{platform: string; url: string}>;
}

const defaultKnowMoreLinks = [
  {label: 'Terms & conditions', url: '/policies/terms-of-service'},
  {label: 'Return & Exchanges', url: '/policies/refund-policy'},
  {label: 'Privacy policy', url: '/policies/privacy-policy'},
];

const defaultSocialLinks = [
  {platform: 'Instagram', url: 'https://instagram.com'},
  {platform: 'TikTok', url: 'https://tiktok.com'},
  {platform: 'Facebook', url: 'https://facebook.com'},
];

export function FooterLinks({
  knowMoreLinks = defaultKnowMoreLinks,
  socialLinks = defaultSocialLinks,
}: FooterLinksProps) {
  return (
    <section className="dtd-footer-links">
      {/* Know more column */}
      <div className="dtd-footer-links__column">
        <h3 className="dtd-footer-links__title">Policies</h3>
        <ul className="dtd-footer-links__list">
          {knowMoreLinks.map((link) => (
            <li key={link.label}>
              <Link to={link.url} className="dtd-footer-links__link">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Social column - Figma: text left, icon button right */}
      <div className="dtd-footer-links__column">
        <div className="dtd-footer-links__social">
          {socialLinks.map((link) => (
            <div key={link.platform} className="dtd-footer-links__social-item">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="dtd-footer-links__social-text"
              >
                {link.platform}
              </a>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="dtd-footer-links__social-icon"
                aria-label={`Visit ${link.platform}`}
              >
                <ArrowIcon />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Contact column - aligned to bottom */}
      <div className="dtd-footer-links__column dtd-footer-links__column--bottom">
        <div className="dtd-footer-links__social-item">
          <a
            href="mailto:contact@daretodream.com"
            className="dtd-footer-links__social-text"
          >
            Contact us
          </a>
          <a
            href="mailto:contact@daretodream.com"
            className="dtd-footer-links__social-icon"
            aria-label="Contact us"
          >
            <ArrowIcon />
          </a>
        </div>
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}
