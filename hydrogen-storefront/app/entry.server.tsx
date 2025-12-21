import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import type {HydrogenRouterContextProvider} from '@shopify/hydrogen';
import type {EntryContext} from 'react-router';
import type {ReactNode} from 'react';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: HydrogenRouterContextProvider,
) {
  // Disable CSP for Three.js/WebGL support
  // TODO: Re-enable with proper CSP for production
  const nonce = '';
  const NonceProvider = ({children}: {children: ReactNode}) => <>{children}</>;

  // Original CSP (commented out for Three.js compatibility)
  // const {nonce, header, NonceProvider} = createContentSecurityPolicy({
  //   shop: {
  //     checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
  //     storeDomain: context.env.PUBLIC_STORE_DOMAIN,
  //   },
  // });

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={nonce}
      />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  // CSP disabled for Three.js/WebGL
  // responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
