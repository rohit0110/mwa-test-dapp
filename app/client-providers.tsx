'use client';

import {
  registerMwa,
  createDefaultAuthorizationCache,
  createDefaultChainSelector,
  createDefaultWalletNotFoundHandler,
} from '@solana-mobile/wallet-standard-mobile';
import { Providers } from './providers';
import { ReactNode } from 'react';

// Register MWA at module level (like seeker-test)
// This runs synchronously before PrivyProvider renders
registerMwa({
  appIdentity: {
    name: 'MWA Test dApp',
    uri: typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000',
  },
  authorizationCache: createDefaultAuthorizationCache(),
  chains: ['solana:mainnet'],
  chainSelector: createDefaultChainSelector(),
  onWalletNotFound: createDefaultWalletNotFoundHandler(),
});

console.log('✅ [MODULE] registerMwa() called at module level');

export function ClientProviders({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
