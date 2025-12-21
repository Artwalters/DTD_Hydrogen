import {Suspense} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';

export interface DTDHeaderProps {
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn?: Promise<boolean>;
}

// DTD navigation menu items
const DTD_MENU_ITEMS = [
  {id: 'shop', title: 'Shop', url: '/collections/all'},
  {id: 'about', title: 'About', url: '/pages/about'},
  {id: 'community', title: 'Community', url: '/pages/community'},
];

export function DTDHeader({cart, isLoggedIn}: DTDHeaderProps) {
  return (
    <header className="dtd-header">
      {/* Left: Navigation Menu */}
      <nav className="dtd-header__nav" role="navigation">
        {DTD_MENU_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.url}
            className="dtd-header__nav-item"
            prefetch="intent"
          >
            {item.title}
          </NavLink>
        ))}
      </nav>

      {/* Right: Cart/Bag buttons */}
      <div className="dtd-header__actions">
        <CartToggle cart={cart} />
      </div>
    </header>
  );
}

function CartToggle({cart}: {cart: DTDHeaderProps['cart']}) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

function CartBadge({count}: {count: number | null}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <div className="dtd-header__cart-group">
      {/* Bag icon button */}
      <button
        className="dtd-header__cart-icon"
        onClick={(e) => {
          e.preventDefault();
          open('cart');
          publish('cart_viewed', {
            cart,
            prevCart,
            shop,
            url: window.location.href || '',
          } as CartViewPayload);
        }}
        aria-label="Open cart"
      >
        <BagIcon />
      </button>

      {/* Bag text + count button */}
      <button
        className="dtd-header__cart-btn"
        onClick={(e) => {
          e.preventDefault();
          open('cart');
          publish('cart_viewed', {
            cart,
            prevCart,
            shop,
            url: window.location.href || '',
          } as CartViewPayload);
        }}
      >
        <span className="dtd-header__cart-text">Bag</span>
        <span className="dtd-header__cart-divider">/</span>
        <span className="dtd-header__cart-count">
          {count === null ? '0' : count}
        </span>
      </button>
    </div>
  );
}

function BagIcon() {
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
      {/* Shopping bag icon */}
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
