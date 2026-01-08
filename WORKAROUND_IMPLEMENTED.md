# Privy + MWA Wallet Reconnection Workaround

## Issue Summary

After implementing comprehensive logging and testing, we've identified that the issue is **NOT** with MWA registration timing, but rather a **Privy integration bug**.

### What's Happening

**First Connection (Works):**
1. MWA registers successfully in Wallet Standard
2. User clicks "Connect Wallet"
3. Privy queries Wallet Standard and finds MWA
4. Connection established: `walletsCount = 1` ✅

**After Page Refresh (Broken):**
1. MWA registers successfully in Wallet Standard ✅
2. Privy restores user session: `authenticated = true` ✅
3. Privy does NOT reconnect to the wallet: `walletsCount = 0` ❌
4. Result: User authenticated but no wallet available

### Root Cause

Privy's `shouldAutoConnect: true` configuration (in `toSolanaWalletConnectors`) has inconsistent behavior:
- ✅ **Restores user authentication session**
- ❌ **Does NOT reconnect to Wallet Standard wallets**

This is a bug in Privy's Wallet Standard integration where `shouldAutoConnect` doesn't properly handle wallet reconnection for Wallet Standard wallets after page refresh.

## The Workaround

### Location
File: `app/wallet-test.tsx` (lines 82-95)

### Implementation

```typescript
useEffect(() => {
  // ... existing auto-login logic ...

  else if (ready && authenticated && wallets.length === 0 && !loginAttempted.current) {
    // WORKAROUND: Privy restored session but didn't reconnect wallet
    // This is a bug in Privy's shouldAutoConnect for Wallet Standard wallets
    loginAttempted.current = true;
    console.log('🔧 [RECONNECT] WORKAROUND: Authenticated but no wallet detected');
    console.log('🔧 [RECONNECT] This is a Privy bug - shouldAutoConnect doesn\'t reconnect Wallet Standard wallets');
    console.log('🔄 [RECONNECT] Manually triggering wallet reconnection via login()...');

    login().then(() => {
      console.log('✅ [RECONNECT] Wallet reconnection successful');
    }).catch((err) => {
      console.error('❌ [RECONNECT] Wallet reconnection failed:', err.message);
    });
  }
}, [ready, authenticated, login, wallets.length, user]);
```

### How It Works

1. **Detects the broken state**: `authenticated && wallets.length === 0`
2. **Logs the workaround**: Documents that this is addressing a Privy bug
3. **Manually triggers reconnection**: Calls `login()` to force Privy to reconnect to the wallet
4. **One-time execution**: Uses `loginAttempted` ref to prevent infinite loops

### Expected Behavior After Fix

**After Page Refresh (With Workaround):**
1. MWA registers successfully ✅
2. Privy restores user session ✅
3. App detects: `authenticated but no wallet`
4. Workaround triggers: Calls `login()` automatically
5. Privy reconnects to MWA wallet ✅
6. Result: User authenticated AND wallet available ✅

## Testing

### What to Look For

After implementing this workaround and refreshing the page, you should see:

```
🔧 [RECONNECT] WORKAROUND: Authenticated but no wallet detected
🔧 [RECONNECT] This is a Privy bug - shouldAutoConnect doesn't reconnect Wallet Standard wallets
🔄 [RECONNECT] Manually triggering wallet reconnection via login()...
✅ [RECONNECT] Wallet reconnection successful
🔐 [AUTH] Authenticated with wallet:
   💼 [AUTH] Wallet type: mobile_wallet_adapter
   🔧 [AUTH] Methods available: { signTransaction: true, signMessage: true }
```

### Success Criteria

- ✅ No more "CRITICAL: Authenticated but no active wallet!" error
- ✅ `walletsCount` should be 1 after refresh
- ✅ `signTransaction` method available
- ✅ Transactions work after refresh without manual reconnection

## Reporting to Privy

This workaround should be reported to Privy as a bug. The issue should include:

### Bug Report Template

**Title**: `shouldAutoConnect` doesn't reconnect Wallet Standard wallets after page refresh

**Description**:
When using Privy with Wallet Standard wallets (specifically Mobile Wallet Adapter), the `shouldAutoConnect: true` configuration in `toSolanaWalletConnectors` only restores the user authentication session but does NOT reconnect to the wallet.

**Expected Behavior**:
After page refresh, both user session AND wallet connection should be restored automatically.

**Actual Behavior**:
- User session IS restored: `authenticated = true`
- Wallet connection is NOT restored: `wallets.length = 0`

**Reproduction**:
1. Connect to a Wallet Standard wallet (e.g., Mobile Wallet Adapter)
2. Refresh the page
3. Observe: User is authenticated but `useSolanaWallets().wallets` is empty

**Configuration**:
```typescript
externalWallets: {
  solana: {
    connectors: toSolanaWalletConnectors({
      shouldAutoConnect: true  // Not working for Wallet Standard wallets
    }),
  },
}
```

**Workaround**:
Manually call `login()` when detecting `authenticated && wallets.length === 0`

**Evidence**:
See attached logs showing:
- Wallet Standard has 1 wallet registered
- Privy session restored (authenticated: true)
- Privy wallet state empty (walletsCount: 0)

## Future Considerations

### When Privy Fixes This

Once Privy fixes their `shouldAutoConnect` implementation for Wallet Standard wallets, this workaround can be removed. The original auto-login logic will be sufficient.

### Alternative Solutions

If Privy doesn't fix this, consider:
1. Using Privy's `autoLogin` feature (if available for Wallet Standard)
2. Implementing a custom wallet state persistence layer
3. Switching to a different wallet adapter library

## Documentation References

- Privy Docs: https://docs.privy.io/
- Wallet Standard: https://github.com/wallet-standard/wallet-standard
- MWA Docs: https://github.com/solana-mobile/mobile-wallet-adapter

## Change Log

- **2026-01-08**: Identified root cause as Privy bug, implemented workaround
- **2026-01-08**: Updated RCA in MWA1364.txt with log evidence
- **2026-01-08**: Added comprehensive logging to track issue
