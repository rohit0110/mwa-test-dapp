'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import '@solana/wallet-adapter-react-ui/styles.css';

// Simplified providers to match seeker-test pattern
// NO useEffect, NO polling, NO ready state
// Just render PrivyProvider immediately after registerMwa (in client-providers.tsx)

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmkfbew1z00d1jo0cnryzn3f4'}
      config={{
        solana: {
          rpcs: {
            'solana:mainnet': {
              rpc: createSolanaRpc('https://api.mainnet-beta.solana.com'),
              rpcSubscriptions: createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com')
            }
          }
        },
        appearance: {
          showWalletLoginFirst: true,
          walletChainType: 'solana-only',
          // NOTE: seeker-test does NOT have walletList configured
          // This might be why MWA isn't being detected properly
        },
        loginMethods: ['wallet', 'email'], // seeker-test has both
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors(),
          },
        },
        embeddedWallets: {
          solana: {
            createOnLogin: 'all-users', // seeker-test creates embedded wallets
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
