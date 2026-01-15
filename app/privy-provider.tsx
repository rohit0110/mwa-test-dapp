'use client';

import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <BasePrivyProvider
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
          walletList: [
            'detected_solana_wallets',
            'phantom',
            'solflare',
            'wallet_connect',
          ],
        },
        loginMethods: ['wallet', 'email'],
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors()
          }
        },
        embeddedWallets: {
          solana: {
            createOnLogin: 'all-users'
          }
        }
      }}
    >
      {children}
    </BasePrivyProvider>
  );
}
