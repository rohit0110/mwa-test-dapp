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
import { getWallets } from '@wallet-standard/app';
import { useEffect, useState } from 'react';

import { PrivyProvider } from './privy-provider';

// Register MWA adapter at module level
let mwaRegistered = false;
let mwaError: string | null = null;

try {
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
  mwaRegistered = true;
} catch (e: any) {
  mwaError = e?.message || String(e);
}

// App component
function App() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const [logs, setLogs] = useState<string[]>([]);
  const [walletStandardInfo, setWalletStandardInfo] = useState<string>('');
  const [error, setError] = useState<string>('');

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
    console.log(msg);
  };

  useEffect(() => {
    addLog(`MWA registered: ${mwaRegistered}`);
    if (mwaError) {
      addLog(`MWA error: ${mwaError}`);
      setError(mwaError);
    }
  }, []);

  useEffect(() => {
    addLog(`State: ready=${ready}, authenticated=${authenticated}, wallets=${wallets.length}`);

    if (typeof window !== 'undefined') {
      try {
        const walletsApi = getWallets();
        const standardWallets = walletsApi.get();
        const info = standardWallets.map((w: any) =>
          `${w.name} (${Object.keys(w.features || {}).length} features)`
        ).join(', ');
        setWalletStandardInfo(`${standardWallets.length} wallets: ${info || 'none'}`);
        addLog(`Wallet Standard: ${standardWallets.length} wallets found`);

        standardWallets.forEach((w: any) => {
          addLog(`  - ${w.name}: ${Object.keys(w.features || {}).join(', ')}`);
        });
      } catch (e: any) {
        setError(`Wallet Standard error: ${e?.message}`);
        addLog(`Wallet Standard error: ${e?.message}`);
      }
    }
  }, [ready, authenticated, wallets]);

  const handleConnect = () => {
    if (!authenticated) {
      addLog('Attempting login...');
      try {
        login();
      } catch (e: any) {
        addLog(`Login error: ${e?.message}`);
        setError(e?.message || 'Login failed');
      }
    }
  };

  const handleDisconnect = () => {
    addLog('Disconnecting...');
    logout();
  };

  if (!ready) {
    return (
      <div style={{ padding: 20, fontFamily: 'monospace' }}>
        <h1>Loading Privy...</h1>
        <p>MWA registered: {mwaRegistered ? 'YES' : 'NO'}</p>
        {mwaError && <p style={{ color: 'red' }}>MWA Error: {mwaError}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', maxWidth: 600 }}>
      <h1>Seeker MWA Connection</h1>

      {/* Status */}
      <div style={{ background: '#f0f0f0', padding: 10, marginBottom: 10, borderRadius: 4 }}>
        <p><strong>MWA Registered:</strong> {mwaRegistered ? '✅ YES' : '❌ NO'}</p>
        <p><strong>Privy Ready:</strong> {ready ? '✅ YES' : '❌ NO'}</p>
        <p><strong>Authenticated:</strong> {authenticated ? '✅ YES' : '❌ NO'}</p>
        <p><strong>Wallets Count:</strong> {wallets.length}</p>
        <p><strong>Wallet Standard:</strong> {walletStandardInfo || 'checking...'}</p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fee', padding: 10, marginBottom: 10, borderRadius: 4, color: 'red' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Auth UI */}
      {authenticated ? (
        <div>
          <p style={{ color: 'green' }}>✅ Connected</p>
          {wallets.length > 0 ? (
            wallets.map((wallet) => (
              <div key={wallet.address} style={{ background: '#e8f5e9', padding: 10, marginBottom: 10, borderRadius: 4 }}>
                <p><strong>Address:</strong> {wallet.address}</p>
                <p><strong>Type:</strong> {wallet.walletClientType}</p>
                <p><strong>Connector:</strong> {wallet.connectorType}</p>
              </div>
            ))
          ) : (
            <div style={{ background: '#fff3e0', padding: 10, marginBottom: 10, borderRadius: 4 }}>
              <p style={{ color: '#e65100' }}>⚠️ Authenticated but NO wallets!</p>
              <p>This is likely the "no solana adapters" issue.</p>
              {user && <p>User ID: {user.id}</p>}
            </div>
          )}
          <button onClick={handleDisconnect} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Disconnect
          </button>
        </div>
      ) : (
        <button onClick={handleConnect} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Connect Wallet
        </button>
      )}

      {/* Logs */}
      <div style={{ marginTop: 20 }}>
        <h3>Debug Logs:</h3>
        <div style={{ background: '#1e1e1e', color: '#0f0', padding: 10, borderRadius: 4, fontSize: 11, maxHeight: 200, overflow: 'auto' }}>
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
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
