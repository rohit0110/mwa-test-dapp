'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import { useEffect, useState } from 'react';
import {
  registerMwa,
  createDefaultAuthorizationCache,
  createDefaultChainSelector,
  createDefaultWalletNotFoundHandler,
} from '@solana-mobile/wallet-standard-mobile';
import '@solana/wallet-adapter-react-ui/styles.css';
import { SolanaMobileWalletAdapterWalletName } from '@solana-mobile/wallet-adapter-mobile';
import { getWallets } from '@wallet-standard/app';

export function Providers({ children }: { children: React.ReactNode }) {
  const [privyReady, setPrivyReady] = useState(false);

  useEffect(() => {
    console.log("🚀 [INIT] ========================================");
    console.log("🚀 [INIT] Starting MWA registration process");
    console.log("🚀 [INIT] ========================================");

    const initializeMWA = async () => {
      if (typeof window === 'undefined') {
        console.log("❌ [INIT] Window undefined, skipping");
        return;
      }

      console.log(`📊 [INIT] Environment: ${window.location.origin}`);
      console.log(`📊 [INIT] User Agent: ${navigator.userAgent.substring(0, 80)}...`);
      console.log(`📊 [INIT] Secure Context: ${window.isSecureContext}`);

      // First, get the Wallet Standard API to ensure it's initialized
      console.log("📡 [INIT] Getting Wallet Standard API...");
      const walletsApi = getWallets();
      const initialWallets = walletsApi.get();
      console.log(`📡 [INIT] Wallet Standard API obtained. Current wallets: ${initialWallets.length}`);

      if (initialWallets.length > 0) {
        console.log(`ℹ️ [INIT] Existing wallets before MWA registration:`);
        initialWallets.forEach((w: any, idx: number) => {
          console.log(`   ${idx + 1}. ${w.name} (${w.version || 'unknown'})`);
        });
      }

      // Register Mobile Wallet Adapter
      console.log("📝 [INIT] Calling registerMwa...");
      registerMwa({
        appIdentity: {
          uri: window.location.origin,
          name: 'MWA Test dApp',
        },
        authorizationCache: createDefaultAuthorizationCache(),
        chains: ['solana:devnet', 'solana:mainnet'],
        chainSelector: createDefaultChainSelector(),
        onWalletNotFound: createDefaultWalletNotFoundHandler(),
      });
      console.log("✅ [INIT] registerMwa() call completed");

      // Wait for MWA to actually appear in the Wallet Standard registry
      const waitForMWA = async (maxAttempts = 100, delayMs = 50): Promise<boolean> => {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          const wallets = walletsApi.get();
          console.log(`🔍 [INIT] Attempt ${attempt}/${maxAttempts}: Checking for MWA... (${wallets.length} wallets found)`);

          // Log all detected wallets
          if (wallets.length > 0) {
            wallets.forEach((w: any) => {
              console.log(`   📱 [INIT] Found wallet: "${w.name}"`);
            });
          }

          const mwaWallet = wallets.find((w: any) =>
            w.name === SolanaMobileWalletAdapterWalletName ||
            w.name.includes('Mobile Wallet Adapter')
          );

          if (mwaWallet) {
            console.log(`✅ [INIT] MWA wallet found after ${attempt} attempts (${attempt * delayMs}ms)!`);
            console.log(`   📱 [INIT] MWA Wallet details:`, {
              name: mwaWallet.name,
              version: mwaWallet.version,
              features: Object.keys(mwaWallet.features || {}),
              accounts: mwaWallet.accounts?.length || 0
            });
            return true;
          }

          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        console.log(`⚠️ [INIT] MWA not found after ${maxAttempts} attempts (${maxAttempts * delayMs}ms)`);
        return false;
      };

      const mwaFound = await waitForMWA();

      if (mwaFound) {
        console.log("✅ [INIT] MWA fully registered and ready");
      } else {
        console.log("⚠️ [INIT] Proceeding without MWA confirmation (may be desktop browser)");
      }

      console.log("🎯 [INIT] Setting Privy ready = true");
      setPrivyReady(true);
    };

    initializeMWA();
  }, []);

  if (!privyReady) {
    // You might want to render a loading spinner here
    return null;
  }

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        solana: {
          rpcs: {
            'solana:devnet': {
              rpc: createSolanaRpc('https://api.devnet.solana.com'),
              rpcSubscriptions: createSolanaRpcSubscriptions('wss://api.devnet.solana.com')
            },
            'solana:mainnet': {
              rpc: createSolanaRpc('https://api.mainnet-beta.solana.com'),
              rpcSubscriptions: createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com')
            }
          }
        },
        appearance: {
          theme: 'light',
          accentColor: '#4F46E5',
          showWalletLoginFirst: true,
          walletChainType: 'solana-only',
          walletList: [
            'detected_solana_wallets',
            'phantom',
            'solflare',
            'wallet_connect',
          ],
        },
        loginMethods: ['wallet'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors(
              {shouldAutoConnect: true}
            ),
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
