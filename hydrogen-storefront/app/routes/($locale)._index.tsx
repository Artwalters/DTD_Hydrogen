import {Await, useLoaderData, useRouteLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import type {RootLoader} from '~/root';

// Import DTD Homepage components
import {
  AnnouncementBar,
  DTDHeader,
  HeroSection,
  NewArrivalsSection,
  FeatureSection,
  FooterLinks,
  FooterLogo,
} from '~/components/homepage';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Dare to Dream | Home'}];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  // Get more products for the homepage sections
  const [{products}] = await Promise.all([
    context.storefront.query(HOMEPAGE_PRODUCTS_QUERY),
  ]);

  return {
    products: products.nodes,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const moreProducts = context.storefront
    .query(MORE_PRODUCTS_QUERY)
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  return {
    moreProducts,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  const rootData = useRouteLoaderData<RootLoader>('root');
  const {products, moreProducts} = data;

  // Split products into sections (3 per section)
  const section1Products = products.slice(0, 3);
  const section2Products = products.slice(3, 6);

  return (
    <div className="dtd-homepage">
      {/* Announcement Bar */}
      <AnnouncementBar
        message="Free delivery on orders over €160"
        languages={['EN', 'NL', 'DE']}
        currentLanguage="EN"
      />

      {/* DTD Header */}
      {rootData?.cart && <DTDHeader cart={rootData.cart} />}

      {/* Hero Section */}
      <HeroSection
        leftText="DARE TO DREAM"
        rightText="genesis drop"
      />

      {/* New Arrivals Section 1 */}
      {section1Products.length > 0 && (
        <NewArrivalsSection
          title="New arrivals"
          viewAllLink="/collections/all"
          products={section1Products}
        />
      )}

      {/* New Arrivals Section 2 */}
      {section2Products.length > 0 && (
        <NewArrivalsSection
          title="New arrivals"
          viewAllLink="/collections/all"
          products={section2Products}
        />
      )}

      {/* Feature Section */}
      <FeatureSection
        title="YOUR TIME IS NOW"
        buttonText="Join the community"
        buttonLink="/collections/all"
      />

      {/* New Arrivals Section 3 (deferred) */}
      <Suspense fallback={<LoadingSection />}>
        <Await resolve={moreProducts}>
          {(response) =>
            response?.products?.nodes && response.products.nodes.length > 0 ? (
              <NewArrivalsSection
                title="New arrivals"
                viewAllLink="/collections/all"
                products={response.products.nodes}
              />
            ) : null
          }
        </Await>
      </Suspense>

      {/* Footer Links */}
      <FooterLinks />

      {/* Footer Logo */}
      <FooterLogo
        brandLeft="DARE TO DREAM"
        brandRight="genesis drop"
        logoText="DARE TO DREAM"
      />
    </div>
  );
}

function LoadingSection() {
  return (
    <div className="dtd-new-arrivals" style={{minHeight: '20em'}}>
      <div className="dtd-new-arrivals__header">
        <h2 className="dtd-new-arrivals__title">Loading...</h2>
      </div>
    </div>
  );
}

// GraphQL query for homepage products (9 products for 3 sections of 3)
const HOMEPAGE_PRODUCTS_QUERY = `#graphql
  fragment HomepageProduct on Product {
    id
    title
    handle
    productType
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
    options {
      name
      optionValues {
        name
        swatch {
          color
        }
      }
    }
  }
  query HomepageProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 6, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...HomepageProduct
      }
    }
  }
` as const;

// Deferred query for more products
const MORE_PRODUCTS_QUERY = `#graphql
  fragment MoreProduct on Product {
    id
    title
    handle
    productType
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
    options {
      name
      optionValues {
        name
        swatch {
          color
        }
      }
    }
  }
  query MoreProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 3, sortKey: CREATED_AT, reverse: true) {
      nodes {
        ...MoreProduct
      }
    }
  }
` as const;
