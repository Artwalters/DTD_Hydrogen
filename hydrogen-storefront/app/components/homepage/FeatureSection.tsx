import {Link} from 'react-router';
import featureBackground from '~/assets/bram_dtd.jpg';
import arrowIcon from '~/assets/arrow1.svg';

export interface FeatureSectionProps {
  title?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundImageSrc?: string;
}

export function FeatureSection({
  title = 'YOUR TIME IS NOW',
  buttonText = 'Join the community',
  buttonLink = '/collections/all',
  backgroundImageSrc = featureBackground,
}: FeatureSectionProps) {
  return (
    <section className="dtd-feature">
      {/* Image wrapper */}
      <div className="dtd-feature__image-wrapper">
        {/* Background image */}
        <div className="dtd-feature__background">
          <img src={backgroundImageSrc} alt="" />
        </div>

        {/* Dark overlay */}
        <div className="dtd-feature__overlay" />

        {/* Top bar with title and button */}
        <div className="dtd-feature__top-bar">
          <span className="dtd-feature__top-title">{title}</span>
          <div className="dtd-feature__top-btn-group">
            <Link to={buttonLink} className="dtd-feature__top-btn-icon-box">
              <img src={arrowIcon} alt="" className="dtd-feature__top-btn-icon" />
            </Link>
            <Link to={buttonLink} className="dtd-feature__top-btn-text-box">
              {buttonText}
            </Link>
          </div>
        </div>

        {/* Top divider line */}
        <div className="dtd-feature__divider dtd-feature__divider--top" />

        {/* Bottom divider line */}
        <div className="dtd-feature__divider dtd-feature__divider--bottom" />
      </div>
    </section>
  );
}

