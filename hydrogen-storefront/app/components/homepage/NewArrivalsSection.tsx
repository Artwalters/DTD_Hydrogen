import {Link} from 'react-router';
import {ProductCard} from './ProductCard';
import type {ProductCardProps} from './ProductCard';
import arrowIcon from '~/assets/arrow1.svg';

export interface NewArrivalsSectionProps {
  title: string;
  viewAllLink: string;
  products: ProductCardProps['product'][];
}

export function NewArrivalsSection({
  title,
  viewAllLink,
  products,
}: NewArrivalsSectionProps) {
  return (
    <section className="dtd-new-arrivals">
      <div className="dtd-section-divider" />

      <div className="dtd-new-arrivals__header">
        <span className="dtd-new-arrivals__title">{title}</span>
        <div className="dtd-new-arrivals__btn-group">
          <Link to={viewAllLink} className="dtd-new-arrivals__btn-icon">
            <img src={arrowIcon} alt="" className="dtd-new-arrivals__btn-icon-img" />
          </Link>
          <Link to={viewAllLink} className="dtd-new-arrivals__btn-text">
            View collection
          </Link>
        </div>
      </div>

      <div className="dtd-new-arrivals__grid">
        {products.slice(0, 3).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
