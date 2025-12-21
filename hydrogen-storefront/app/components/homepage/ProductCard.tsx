import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {MoneyV2, Image as ImageType} from '@shopify/hydrogen/storefront-api-types';

interface ProductOption {
  name: string;
  optionValues: Array<{
    name: string;
    swatch?: {
      color?: string | null;
    } | null;
  }>;
}

export interface ProductCardProps {
  product: {
    id: string;
    title: string;
    handle: string;
    priceRange: {
      minVariantPrice: MoneyV2;
    };
    featuredImage?: ImageType | null;
    productType?: string;
    options?: ProductOption[];
  };
  category?: string;
}

// Helper function to get color from common color names
function getColorFromName(name: string): string {
  const colorMap: Record<string, string> = {
    // English
    black: '#141414',
    white: '#ffffff',
    red: '#dc2626',
    blue: '#2563eb',
    green: '#16a34a',
    yellow: '#eab308',
    orange: '#ea580c',
    purple: '#9333ea',
    pink: '#ec4899',
    brown: '#78350f',
    gray: '#6b7280',
    grey: '#6b7280',
    navy: '#1e3a5f',
    beige: '#d4c4a8',
    cream: '#fffdd0',
    // Dutch
    zwart: '#141414',
    wit: '#ffffff',
    rood: '#dc2626',
    blauw: '#2563eb',
    groen: '#16a34a',
    geel: '#eab308',
    oranje: '#ea580c',
    paars: '#9333ea',
    roze: '#ec4899',
    bruin: '#78350f',
    grijs: '#6b7280',
  };

  const lowerName = name.toLowerCase();
  return colorMap[lowerName] || '#888888';
}

export function ProductCard({product, category}: ProductCardProps) {
  const {title, handle, priceRange, featuredImage, productType, options} = product;
  const displayCategory = category || productType || 'Product';

  // Get color swatches from product options
  const colorOption = options?.find(
    (opt) => opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'kleur'
  );

  // Map color swatches - use swatch color if available, otherwise generate from name
  const colorSwatches = colorOption?.optionValues?.map((val) => ({
    name: val.name,
    color: val.swatch?.color || getColorFromName(val.name),
  })) || [];

  return (
    <article className="dtd-product-card">
      <Link to={`/products/${handle}`} className="dtd-product-card__image-container">
        {/* Carousel dots - placeholder for now */}
        <div className="dtd-product-card__carousel-dots">
          <span className="dtd-product-card__dot dtd-product-card__dot--active" />
          <span className="dtd-product-card__dot" />
          <span className="dtd-product-card__dot" />
          <span className="dtd-product-card__dot" />
        </div>

        {/* Category badge */}
        <span className="dtd-product-card__badge">{displayCategory}</span>

        {/* Product image */}
        {featuredImage && (
          <Image
            data={featuredImage}
            className="dtd-product-card__image"
            sizes="(min-width: 768px) 33vw, 100vw"
          />
        )}

        {/* Quick add button on hover */}
        <button
          type="button"
          className="dtd-product-card__quick-add"
          aria-label="Quick add to cart"
        >
          +
        </button>
      </Link>

      <div className="dtd-product-card__info">
        <h3 className="dtd-product-card__name">
          <Link to={`/products/${handle}`}>{title.toUpperCase()}</Link>
        </h3>
        <div className="dtd-product-card__price-row">
          <span className="dtd-product-card__price">
            <Money data={priceRange.minVariantPrice} />
          </span>
          {colorSwatches.length > 0 && (
            <div className="dtd-product-card__swatches">
              {colorSwatches.map((swatch, index) => (
                <Link
                  key={swatch.name}
                  to={`/products/${handle}?Color=${encodeURIComponent(swatch.name)}`}
                  className={`dtd-product-card__swatch ${index === 0 ? 'dtd-product-card__swatch--active' : ''}`}
                  style={{backgroundColor: swatch.color}}
                  aria-label={`Select ${swatch.name}`}
                  title={swatch.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
