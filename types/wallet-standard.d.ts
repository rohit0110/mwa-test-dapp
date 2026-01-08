// Type declarations for Wallet Standard
declare global {
  interface Navigator {
    wallets?: {
      getWallets(): any[];
      on?(event: string, callback: (...args: any[]) => void): () => void;
    };
  }

  interface Window {
    navigator: Navigator;
  }
}

export {};
