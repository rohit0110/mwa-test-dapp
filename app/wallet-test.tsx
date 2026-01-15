'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { getWallets } from '@wallet-standard/app';

// Simplified component matching seeker-test's App.tsx pattern
// Added logging to help debug the "connected wallet has no solana adapters" error

export default function WalletTest() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Log state changes for debugging
  useEffect(() => {
    console.log('📊 [STATE] ready:', ready, 'authenticated:', authenticated, 'wallets:', wallets.length);

    if (authenticated) {
      console.log('👤 [USER]', user);
      console.log('💼 [WALLETS]', wallets);

      // Check what wallets are in Wallet Standard
      if (typeof window !== 'undefined') {
        try {
          const walletsApi = getWallets();
          const standardWallets = walletsApi.get();
          console.log('🔍 [WALLET-STANDARD] Found', standardWallets.length, 'wallets:');
          standardWallets.forEach((w: any) => {
            console.log('  -', w.name, 'features:', Object.keys(w.features || {}));
          });

          setDebugInfo(`Wallet Standard: ${standardWallets.length} wallets, Privy wallets: ${wallets.length}`);
        } catch (e) {
          console.error('❌ [WALLET-STANDARD] Error:', e);
        }
      }
    }
  }, [ready, authenticated, wallets, user]);

  const handleConnect = () => {
    if (!authenticated) {
      console.log('🔐 [LOGIN] Attempting login...');
      login();
    }
  };

  const handleDisconnect = () => {
    console.log('🔓 [LOGOUT] Disconnecting...');
    logout();
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading Privy...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Seeker MWA Connection Test</h1>
        <p className="text-sm text-gray-500 mb-6">
          Replicating seeker-test pattern to debug &quot;connected wallet has no solana adapters&quot; error
        </p>

        {authenticated ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded">
              <p className="text-green-800 font-semibold">Connected</p>
            </div>

            {wallets.length > 0 ? (
              <div className="space-y-2">
                {wallets.map((wallet) => (
                  <div key={wallet.address} className="bg-gray-50 p-4 rounded border">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Address:</span> {wallet.address}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Wallet:</span> {wallet.walletClientType}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Connector:</span> {wallet.connectorType}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                <p className="text-yellow-800 font-semibold">⚠️ No wallets in Privy state</p>
                <p className="text-sm text-yellow-700">
                  User is authenticated but no wallet adapters found.
                  This might be the &quot;connected wallet has no solana adapters&quot; scenario.
                </p>
              </div>
            )}

            {debugInfo && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                <p className="text-sm text-blue-700">{debugInfo}</p>
              </div>
            )}

            <button
              onClick={handleDisconnect}
              className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Connect Wallet
          </button>
        )}
      </div>

      <div className="mt-6 bg-gray-100 p-4 rounded text-xs">
        <p className="font-semibold mb-2">Config (matching seeker-test):</p>
        <ul className="space-y-1 text-gray-600">
          <li>• registerMwa at module level (no useEffect)</li>
          <li>• loginMethods: [&apos;wallet&apos;, &apos;email&apos;]</li>
          <li>• embeddedWallets.solana.createOnLogin: &apos;all-users&apos;</li>
          <li>• walletChainType: &apos;solana-only&apos;</li>
          <li>• NO walletList configured (unlike working apps)</li>
        </ul>
      </div>
    </div>
  );
}
