'use client';

// This file mirrors seeker-test's src/main.tsx exactly
// Everything in ONE file: registerMwa + PrivyProvider + App

import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import {
  createDefaultAuthorizationCache,
  createDefaultChainSelector,
  createDefaultWalletNotFoundHandler,
  registerMwa
} from '@solana-mobile/wallet-standard-mobile';
import { usePrivy, useWallets } from '@privy-io/react-auth';

// Register MWA adapter (exactly like seeker-test)
registerMwa({
  appIdentity: {
    name: 'Seeker App',
    uri: typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000',
    icon: typeof window !== 'undefined' ? `${window.location.origin}/vite.svg` : '/vite.svg'
  },
  authorizationCache: createDefaultAuthorizationCache(),
  chains: ['solana:mainnet'],
  chainSelector: createDefaultChainSelector(),
  onWalletNotFound: createDefaultWalletNotFoundHandler()
});

// App component (exactly like seeker-test's src/App.tsx)
function App() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const handleConnect = () => {
    if (!authenticated) {
      login();
    }
  };

  const handleDisconnect = () => {
    logout();
  };

  if (!ready) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Seeker MWA Connection</h1>
      {authenticated ? (
        <div>
          <p>Connected</p>
          {wallets.map((wallet) => (
            <div key={wallet.address}>
              <p>Address: {wallet.address}</p>
              <p>Wallet: {wallet.walletClientType}</p>
            </div>
          ))}
          <button onClick={handleDisconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={handleConnect}>Connect Wallet</button>
      )}
    </div>
  );
}

// Main component that wraps everything (simulates createRoot render)
export default function Main() {
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
      <App />
    </PrivyProvider>
  );
}
