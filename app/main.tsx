'use client';

// This file mirrors the Vibe Predict pattern:
// registerMwa at module level, PrivyProvider imported from separate file

import {
  createDefaultAuthorizationCache,
  createDefaultChainSelector,
  createDefaultWalletNotFoundHandler,
  registerMwa
} from '@solana-mobile/wallet-standard-mobile';
import { usePrivy, useWallets } from '@privy-io/react-auth';

import { PrivyProvider } from './privy-provider';

// Register MWA adapter at module level
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

// App component
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

// Main component
export default function Main() {
  return (
    <PrivyProvider>
      <App />
    </PrivyProvider>
  );
}
