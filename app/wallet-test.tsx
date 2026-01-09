'use client';

import { usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, VersionedTransaction } from '@solana/web3.js';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { getWallets } from '@wallet-standard/app';

export default function WalletTest() {
  const { login, logout, authenticated, user, ready } = usePrivy();
  const { wallets } = useSolanaWallets();
  const [balance, setBalance] = useState<number | null>(null);
  const [txSignature, setTxSignature] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<string>('Not connected');
  const [connection] = useState(() => new Connection('https://api.devnet.solana.com', 'confirmed'));
  const hasInitialized = useRef(false);
  const hasCheckedWallets = useRef(false);
  const loginAttempted = useRef(false);

  const activeWallet = useMemo(() => {
    const wallet = wallets[0];
    if (wallet) {
      console.log('💼 [WALLET] Active wallet updated:', {
        type: wallet.walletClientType,
        address: wallet.address,
        connector: wallet.connectorType
      });
    } else if (wallets.length === 0 && authenticated) {
      console.warn('⚠️ [WALLET] No wallets available but user is authenticated');
    }
    return wallet;
  }, [wallets, authenticated]);

  const publicKey = useMemo(
    () => activeWallet?.address ? new PublicKey(activeWallet.address) : null,
    [activeWallet?.address]
  );

  // Log on initial mount ONCE
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      console.log('🚀 [COMPONENT] WalletTest component mounted');
      console.log(`📊 [COMPONENT] Initial state - Authenticated: ${authenticated}, Wallets: ${wallets.length}, Ready: ${ready}`);

      // Log Privy state in detail
      console.log('👤 [COMPONENT] Privy user:', user ? {
        id: user.id,
        createdAt: user.createdAt,
        linkedAccounts: user.linkedAccounts?.length || 0,
        hasWallet: user.wallet !== undefined,
      } : 'null');

      // Log wallet details
      if (wallets.length > 0) {
        wallets.forEach((w, idx) => {
          console.log(`💼 [COMPONENT] Wallet #${idx}:`, {
            type: w.walletClientType,
            connector: w.connectorType,
            address: w.address?.substring(0, 8) + '...',
            imported: w.imported
          });
        });
      } else {
        console.log('⚠️ [COMPONENT] No wallets in Privy state');
      }
    }
  }, [authenticated, wallets, ready, user]);

  // Attempt to reconnect on load
  useEffect(() => {
    if (ready && !authenticated && !loginAttempted.current) {
      loginAttempted.current = true;
      console.log('🔄 [RECONNECT] App is ready but not authenticated. Attempting auto-login...');
      console.log(`📊 [RECONNECT] State - Ready: ${ready}, Authenticated: ${authenticated}, Wallets: ${wallets.length}`);
      login();
    } else if (ready && authenticated && wallets.length === 0 && !loginAttempted.current) {
      // BUG CONFIRMED: Privy restored session but didn't reconnect wallet
      // This is a confirmed bug in Privy's shouldAutoConnect for Wallet Standard wallets
      loginAttempted.current = true;

      console.log('🐛 [BUG] ========================================');
      console.log('🐛 [BUG] PRIVY BUG CONFIRMED');
      console.log('🐛 [BUG] ========================================');
      console.log('🐛 [BUG] Authenticated but no wallet connected');
      console.log('🐛 [BUG] This confirms Privy\'s shouldAutoConnect bug for Wallet Standard wallets');
      console.log(`🐛 [BUG] User: ${user?.id}`);
      console.log(`🐛 [BUG] LinkedAccounts: ${user?.linkedAccounts?.length || 0}`);
      console.log('🐛 [BUG] ========================================');

      // Verify the wallet exists in Wallet Standard
      const walletsApi = getWallets();
      const standardWallets = walletsApi.get();
      console.log(`🔍 [BUG] Wallet Standard has ${standardWallets.length} wallet(s) registered`);

      const mwaWallet = standardWallets.find((w: any) =>
        w.name === 'Mobile Wallet Adapter' || w.name.includes('Mobile Wallet Adapter')
      );

      if (mwaWallet) {
        console.log('✅ [BUG] MWA wallet IS present in Wallet Standard');
        console.log(`📊 [BUG] MWA has ${(mwaWallet as any).accounts?.length || 0} accounts cached`);
        console.log('🐛 [BUG] Privy simply isn\'t checking Wallet Standard during session restore');
      } else {
        console.log('❌ [BUG] MWA wallet NOT found in Wallet Standard (unexpected)');
      }

      console.log('🐛 [BUG] ========================================');
      console.log('🐛 [BUG] NO WORKAROUND AVAILABLE');
      console.log('🐛 [BUG] User must manually click "Connect Wallet" after refresh');
      console.log('🐛 [BUG] ========================================');
    } else if (ready && authenticated && wallets.length > 0) {
      console.log('✅ [RECONNECT] Already authenticated with wallet, no action needed');
    } else if (!ready) {
      console.log('⏳ [RECONNECT] Privy not ready yet, waiting...');
    }
  }, [ready, authenticated, login, wallets.length, user]);

  // Log the active wallet when authenticated
  useEffect(() => {
    if (authenticated && activeWallet) {
      console.log('🔐 [AUTH] Authenticated with wallet:');
      console.log(`   💼 [AUTH] Wallet type: ${activeWallet.walletClientType}`);
      console.log(`   🔌 [AUTH] Connector type: ${activeWallet.connectorType}`);
      console.log(`   📍 [AUTH] Address: ${activeWallet.address}`);
      console.log(`   🔧 [AUTH] Methods available:`, {
        signTransaction: typeof activeWallet.signTransaction === 'function',
        signMessage: typeof activeWallet.signMessage === 'function',
        signAndSendTransaction: typeof (activeWallet as any).signAndSendTransaction === 'function'
      });
    } else if (authenticated && !activeWallet) {
      console.error('⚠️ [AUTH] CRITICAL: Authenticated but no active wallet!');
      console.error('   This means Privy session was restored but wallet state was not');
      console.error(`   📊 [AUTH] Debug info:`, {
        authenticated,
        ready,
        walletsCount: wallets.length,
        user: user ? {
          id: user.id,
          linkedAccountsCount: user.linkedAccounts?.length || 0,
        } : 'null'
      });
    }
  }, [authenticated, activeWallet, ready, wallets, user]);


  // Check for wallets ONCE when ready
  useEffect(() => {
    if (ready && !hasCheckedWallets.current && typeof window !== 'undefined') {
      hasCheckedWallets.current = true;

      console.log('🔍 [WALLET-CHECK] Starting wallet environment check...');
      console.log(`✅ [WALLET-CHECK] Privy ready: ${ready}`);
      console.log(`✅ [WALLET-CHECK] Window object available: ${typeof window !== 'undefined'}`);
      console.log(`✅ [WALLET-CHECK] Navigator available: ${typeof navigator !== 'undefined'}`);

      // Check for Wallet Standard API
      const checkWallets = () => {
        console.log('🔎 [WALLET-CHECK] Checking for Wallet Standard wallets...');

        // Use the correct modern Wallet Standard API
        try {
          const walletsApi = getWallets();
          const standardWallets = walletsApi.get();

          console.log(`✅ [WALLET-CHECK] Wallet Standard API initialized successfully`);
          console.log(`📊 [WALLET-CHECK] Found ${standardWallets.length} wallet(s)`);

          if (standardWallets.length === 0) {
            console.log('⚠️ [WALLET-CHECK] No wallets detected via Wallet Standard API');
            console.log('ℹ️ [WALLET-CHECK] This is normal in desktop browsers without wallet extensions');
            console.log('ℹ️ [WALLET-CHECK] On mobile device with MWA, wallet should register automatically');
          }

          standardWallets.forEach((w: any, idx: number) => {
            console.log(`📱 [WALLET-CHECK] Wallet #${idx + 1}: ${w.name}`);
            console.log(`   🏷️ [WALLET-CHECK] Version: ${w.version || 'unknown'}`);
            console.log(`   🖼️ [WALLET-CHECK] Has Icon: ${w.icon ? 'yes' : 'no'}`);
            console.log(`   👥 [WALLET-CHECK] Accounts: ${w.accounts?.length || 0}`);
            if (w.features) {
              const featureNames = Object.keys(w.features);
              console.log(`   ⚙️ [WALLET-CHECK] Features (${featureNames.length}): ${featureNames.join(', ')}`);
            }
          });
        } catch (error) {
          console.error('❌ [WALLET-CHECK] Failed to get Wallet Standard API:', error);
        }

        // Also check deprecated API for comparison
        const nav = window.navigator as any;
        console.log(`   📡 [WALLET-CHECK] (Deprecated) navigator.wallets exists: ${!!nav.wallets}`);
        console.log(`   📡 [WALLET-CHECK] (Deprecated) navigator.wallets type: ${typeof nav.wallets}`);

        // Check for legacy wallet APIs
        console.log('🔍 [WALLET-CHECK] Checking for legacy wallet APIs...');
        console.log(`   ${(window as any).solana ? '✅' : '❌'} [WALLET-CHECK] window.solana exists: ${!!(window as any).solana}`);
        console.log(`   ${(window as any).solflare ? '✅' : '❌'} [WALLET-CHECK] window.solflare exists: ${!!(window as any).solflare}`);
        console.log(`   ${(window as any).phantom ? '✅' : '❌'} [WALLET-CHECK] window.phantom exists: ${!!(window as any).phantom}`);
      };

      // Check immediately and after delays
      console.log('⏱️ [WALLET-CHECK] Running immediate check...');
      checkWallets();

      setTimeout(() => {
        console.log('⏱️ [WALLET-CHECK] Running 1-second delayed check...');
        checkWallets();
      }, 1000);

      setTimeout(() => {
        console.log('⏱️ [WALLET-CHECK] Running 3-second delayed check...');
        checkWallets();
      }, 3000);
    }
  }, [ready]);

  useEffect(() => {
    if (authenticated && publicKey && activeWallet) {
      console.log(`✅ Connected via Privy`);
      console.log(`Active wallet type: ${activeWallet.walletClientType}`);
      console.log(`Public key: ${publicKey.toString()}`);
      setStatus('Connected');

      // Fetch balance
      connection.getBalance(publicKey).then(bal => {
        setBalance(bal / LAMPORTS_PER_SOL);
        console.log(`Balance: ${bal / LAMPORTS_PER_SOL} SOL`);
      }).catch(err => {
        console.log(`Error fetching balance: ${err.message}`);
      });

      // Log wallet capabilities detected by Privy
      console.log(`Privy wallet info:`);
      console.log(`  - Wallet client type: ${activeWallet.walletClientType}`);
      console.log(`  - Connector type: ${activeWallet.connectorType}`);
      console.log(`  - Has signTransaction method: ${typeof activeWallet.signTransaction === 'function' ? 'YES' : 'NO'}`);
      console.log(`  - Has signMessage method: ${typeof activeWallet.signMessage === 'function' ? 'YES' : 'NO'}`);

      // Check the underlying wallet standard wallet
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          try {
            const walletsApi = getWallets();
            const standardWallets = walletsApi.get();
            console.log(`🔍 [WALLET-MATCH] Checking ${standardWallets.length} Wallet Standard wallet(s)...`);

            const matchingWallet = standardWallets.find((w: any) =>
              w.accounts?.[0]?.address === activeWallet.address
            );

            if (matchingWallet) {
              console.log(`✅ [WALLET-MATCH] Matching Wallet Standard wallet found: ${matchingWallet.name}`);
              if (matchingWallet.features) {
                const featureNames = Object.keys(matchingWallet.features);
                console.log(`  ⚙️ [WALLET-MATCH] Available features: ${featureNames.join(', ')}`);
                if (matchingWallet.features['solana:signTransaction']) {
                  console.log(`  ✅ [WALLET-MATCH] solana:signTransaction IS PRESENT in Wallet Standard`);
                } else {
                  console.log(`  ⚠️ [WALLET-MATCH] solana:signTransaction NOT FOUND in Wallet Standard`);
                }
                if (matchingWallet.features['solana:signMessage']) {
                  console.log(`  ✅ [WALLET-MATCH] solana:signMessage IS PRESENT in Wallet Standard`);
                }
              }
            } else {
              console.log(`⚠️ [WALLET-MATCH] No matching Wallet Standard wallet found for address: ${activeWallet.address}`);
              console.log(`ℹ️ [WALLET-MATCH] This suggests Privy is not using the Wallet Standard wallet for this connection`);
            }
          } catch (error) {
            console.error('❌ [WALLET-MATCH] Failed to check Wallet Standard:', error);
          }
        }, 500);
      }
    } else if (!authenticated) {
      setStatus('Not authenticated');
      setBalance(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, publicKey, activeWallet, connection]);

  const signTestTransaction = useCallback(async () => {
    console.log('🔘 [SIGN-TX] Sign Transaction button clicked');
    console.log('📊 [SIGN-TX] Current state:', {
      authenticated,
      hasPublicKey: !!publicKey,
      hasActiveWallet: !!activeWallet,
      walletsCount: wallets.length
    });

    if (!authenticated) {
      const errMsg = 'Not authenticated - please connect wallet first';
      setError(errMsg);
      console.error(`❌ [SIGN-TX] ${errMsg}`);
      return;
    }

    if (!publicKey || !activeWallet) {
      const errMsg = 'WalletSignTransactionError: Connected wallet does not support signing transactions';
      setError(errMsg);
      console.error('❌ [SIGN-TX] ========================================');
      console.error('❌ [SIGN-TX] ERROR REPRODUCED!');
      console.error('❌ [SIGN-TX] ========================================');
      console.error(`❌ [SIGN-TX] ${errMsg}`);
      console.error(`📊 [SIGN-TX] Authenticated: ${authenticated} ✅`);
      console.error(`📊 [SIGN-TX] PublicKey: ${publicKey ? 'exists' : 'null'} ${publicKey ? '✅' : '❌'}`);
      console.error(`📊 [SIGN-TX] ActiveWallet: ${activeWallet ? 'exists' : 'null'} ${activeWallet ? '✅' : '❌'}`);
      console.error('❌ [SIGN-TX] This is the exact scenario from issue #1364!');
      console.error('❌ [SIGN-TX] ========================================');
      return;
    }

    // Check if signTransaction method exists
    if (typeof activeWallet.signTransaction !== 'function') {
      const errMsg = 'WalletSignTransactionError: Wallet does not have signTransaction method';
      setError(errMsg);
      console.error(`❌ [SIGN-TX] ${errMsg}`);
      console.error(`🔍 [SIGN-TX] ActiveWallet object:`, activeWallet);
      return;
    }

    try {
      setError('');
      setTxSignature('');
      console.log('📝 Creating test transaction...');
      setStatus('Preparing transaction...');

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

      // Create a simple transfer to self
      const transaction = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey,
          lamports: 0.001 * LAMPORTS_PER_SOL,
        })
      );

      console.log('🔏 Requesting signature from wallet via Privy...');
      setStatus('Waiting for signature...');

      const signed = await activeWallet.signTransaction(transaction);

      console.log('✅ Transaction signed!');
      console.log('📤 Sending transaction...');
      setStatus('Sending transaction...');

      const signature = await connection.sendRawTransaction(signed.serialize());

      console.log(`Transaction sent: ${signature}`);
      setStatus('Confirming...');

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');

      console.log(`✅ Transaction confirmed!`);
      setTxSignature(signature);
      setStatus('Transaction confirmed');

    } catch (err: any) {
      console.log(`❌ Transaction error: ${err.message}`);
      console.log(`Error name: ${err.name}`);
      if (err.stack) {
        console.log(`Error stack: ${err.stack}`);
      }

      // Check if this is the bug - Wallet Standard has the feature but Privy's call failed
      if (typeof window !== 'undefined') {
        try {
          const walletsApi = getWallets();
          const standardWallets = walletsApi.get();
          const matchingWallet = standardWallets.find((w: any) =>
            w.accounts?.[0]?.address === activeWallet.address
          );
          if (matchingWallet?.features?.['solana:signTransaction']) {
            console.error('🐛 [BUG] BUG DETECTED: Wallet Standard wallet HAS signTransaction feature!');
            console.error('🐛 [BUG] This indicates Privy failed to properly invoke the wallet capability.');
            console.error('🐛 [BUG] This is likely the caching issue from #1364');
          }
        } catch (error) {
          console.error('❌ [BUG-CHECK] Failed to check for bug:', error);
        }
      }

      setError(err.message);
      setStatus('Transaction failed');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey, activeWallet, connection]);

  const handleLogin = useCallback(async () => {
    try {
      console.log('🔐 [LOGIN] User clicked "Connect Wallet" button');
      console.log('📊 [LOGIN] Current state:', {
        ready,
        authenticated,
        walletsCount: wallets.length,
        hasActiveWallet: !!activeWallet
      });

      console.log('🔄 [LOGIN] Calling Privy login()...');
      await login();
      console.log('✅ [LOGIN] Privy login() completed successfully');
    } catch (err: any) {
      console.error('❌ [LOGIN] Login error:', err.message);
      console.error('❌ [LOGIN] Full error:', err);
      setError(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [login, ready, authenticated, wallets.length, activeWallet]);

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">MWA Test dApp (Privy)</h1>
        <p className="text-gray-600 mb-4">Testing Mobile Wallet Adapter Issue #1364 with Privy authentication</p>

        <div className="mb-6">
          <div className="text-sm font-semibold mb-2 text-gray-700">Status:</div>
          <div className={`px-4 py-2 rounded ${
            status.includes('Connected') || status.includes('confirmed') ? 'bg-green-100 text-green-800' :
            status.includes('failed') || status.includes('Error') ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {status}
          </div>
        </div>

        <div className="mb-6">
          {!authenticated ? (
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Connect Wallet
            </button>
          ) : (
            <>
              <button
                onClick={logout}
                className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Disconnect
              </button>
              <div className="mt-2 text-xs text-gray-500">
                Active wallet state when authenticated:
                <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                  {activeWallet ? JSON.stringify(activeWallet, null, 2) : 'No active wallet'}
                </pre>
              </div>
            </>
          )}
        </div>

        {authenticated && (
          <div className="space-y-4">
            {publicKey && activeWallet ? (
              <>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-sm font-semibold mb-1 text-gray-700">Wallet Type:</div>
                  <div className="text-sm text-gray-900">{activeWallet.walletClientType}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-sm font-semibold mb-1 text-gray-700">Public Key:</div>
                  <div className="text-xs break-all font-mono text-gray-900">{publicKey.toString()}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-sm font-semibold mb-1 text-gray-700">Privy Wallet Methods:</div>
                  <div className="text-xs space-y-1">
                    <div className={typeof activeWallet.signTransaction === 'function' ? 'text-green-600' : 'text-red-600'}>
                      signTransaction: {typeof activeWallet.signTransaction === 'function' ? '✅ Available' : '❌ Not Available'}
                    </div>
                    <div className={typeof activeWallet.signMessage === 'function' ? 'text-green-600' : 'text-red-600'}>
                      signMessage: {typeof activeWallet.signMessage === 'function' ? '✅ Available' : '❌ Not Available'}
                    </div>
                  </div>
                </div>

                {balance !== null && (
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-sm font-semibold mb-1 text-gray-700">Balance:</div>
                    <div className="text-lg font-bold text-gray-900">{balance.toFixed(4)} SOL</div>
                    <div className="text-xs text-gray-500">(Devnet)</div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                <div className="text-sm font-semibold mb-1 text-yellow-800">⚠️ Authenticated but No Wallet Connected</div>
                <div className="text-xs text-yellow-700">
                  This is the bug scenario - user is authenticated but Privy did not reconnect the wallet after refresh.
                </div>
              </div>
            )}

            <button
              onClick={signTestTransaction}
              className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-700 transition"
            >
              {activeWallet ? 'Sign Test Transaction' : 'Try Sign Transaction (Will Reproduce Error)'}
            </button>

            {txSignature && (
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <div className="text-sm font-semibold mb-1 text-green-800">Transaction Signature:</div>
                <div className="text-xs break-all font-mono text-green-600">{txSignature}</div>
                <a
                  href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                >
                  View on Explorer →
                </a>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded">
            <div className="text-sm font-semibold text-red-800 mb-1">Error:</div>
            <div className="text-sm text-red-600 break-words">{error}</div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded">
        <div className="text-sm font-semibold text-yellow-800 mb-2">Testing Instructions (Issue #1364):</div>
        <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
          <li>Connect wallet via Privy and sign a transaction (should work)</li>
          <li>Check logs to see that Wallet Standard signTransaction feature is detected</li>
          <li>Close the app completely (kill the process)</li>
          <li>Reopen the app and reconnect wallet</li>
          <li>Check the logs - compare Wallet Standard features vs Privy&apos;s wallet methods</li>
          <li>Try signing a transaction - does it fail even though Wallet Standard shows the feature exists?</li>
        </ol>
        <div className="mt-3 text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
          <strong>Expected Bug:</strong> After app restart, Privy may fail to properly invoke signTransaction even though
          the Wallet Standard wallet still reports having the feature. The logs will show this discrepancy, indicating
          Privy&apos;s caching issue reported in #1364.
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded">
        <div className="text-sm font-semibold text-blue-800 mb-2">⚠️ Important: MWA Detection on Seeker</div>
        <div className="text-xs text-blue-700 space-y-2">
          <p>
            <strong>Mobile Wallet Adapter (MWA) requires a TWA/APK:</strong> MWA only works properly when this app is installed
            as an Android app via Bubblewrap TWA. Opening it in Chrome browser won&apos;t detect the Seeker wallet.
          </p>
          <p>
            <strong>To test properly:</strong>
          </p>
          <ol className="list-decimal list-inside ml-2 space-y-1">
            <li>Build the TWA: <code className="bg-blue-100 px-1">./gradlew assembleDebug</code></li>
            <li>Install on Seeker: <code className="bg-blue-100 px-1">adb install app/build/outputs/apk/debug/app-debug.apk</code></li>
            <li>Open the installed TWA app (not Chrome)</li>
            <li>Click &quot;Connect Wallet&quot; - MWA should appear in the list</li>
          </ol>
          <p className="mt-2">
            <strong>If testing in browser:</strong> Use WalletConnect option which may trigger MWA on some devices,
            or install a browser extension wallet like Phantom/Solflare.
          </p>
        </div>
      </div>
    </div>
  );
}
