# Privy + MWA Wallet Reconnection Bug - NO WORKAROUND AVAILABLE

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

## Why No Workaround Works

### Attempted Workarounds

**Attempt 1: Call `login()` when authenticated but no wallet**
- Result: ❌ Privy rejects with "Attempted to log in, but user is already logged in"
- Reason: Can't login again when already authenticated

**Attempt 2: Direct Wallet Standard Connection**
- Result: ❌ Connection succeeds but Privy state doesn't update
- Evidence: Silent connect returns account successfully, but `wallets.length` stays 0
- Code tested:
```typescript
const mwaWallet = getWallets().get().find(w => w.name === 'Mobile Wallet Adapter');
const result = await mwaWallet.features['standard:connect'].connect({ silent: true });
// Returns: { accounts: [...] } ✅
// BUT Privy wallets.length still = 0 ❌
```
- Reason: Privy has internal state management that isn't updated by direct Wallet Standard connections

**Attempt 3: Reload after Wallet Standard connection**
- Result: ❌ Creates infinite reload loop
- Flow:
  1. Page loads → authenticated but no wallet
  2. Silent connect succeeds
  3. Page reloads
  4. After reload, Privy still has same bug
  5. Loop repeats infinitely
- Reason: Privy has the same `shouldAutoConnect` bug after every reload

### The Core Problem

Privy manages wallet state internally and only updates it through its own connection flow. There's no way to:
- Force Privy to re-scan Wallet Standard
- Update Privy's wallet state from outside
- Skip the authentication check to re-login

**Current Status**: Users must manually click "Connect Wallet" after every page refresh

## Bug Confirmation

### What You'll See After Page Refresh

The logs clearly demonstrate the bug:

```
✅ [INIT] MWA wallet found after 1 attempts (50ms)!
🐛 [BUG] ========================================
🐛 [BUG] PRIVY BUG CONFIRMED
🐛 [BUG] ========================================
🐛 [BUG] Authenticated but no wallet connected
🔍 [BUG] Wallet Standard has 1 wallet(s) registered
✅ [BUG] MWA wallet IS present in Wallet Standard
🐛 [BUG] Privy simply isn't checking Wallet Standard during session restore
🐛 [BUG] NO WORKAROUND AVAILABLE
🐛 [BUG] User must manually click "Connect Wallet" after refresh
```

### Evidence of the Bug

1. ✅ MWA successfully registers in Wallet Standard
2. ✅ Privy restores user authentication (`authenticated: true`)
3. ❌ Privy does NOT reconnect to wallet (`walletsCount: 0`)
4. ✅ MWA wallet IS present and queryable in Wallet Standard
5. ❌ Privy's `shouldAutoConnect` simply doesn't check Wallet Standard during restore

## Reporting to Privy

This bug should be reported to Privy. The issue should include:

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
None available. Attempted solutions:
1. Calling `login()` - rejected (already authenticated)
2. Direct Wallet Standard connect - doesn't update Privy state
3. Reload after connect - creates infinite loop

Users must manually reconnect wallet after every page refresh.

**Evidence**:
See production logs at https://mwa-test-dapp.vercel.app showing:
- Wallet Standard has 1 wallet registered ✅
- Privy session restored (authenticated: true) ✅
- Privy wallet state empty (walletsCount: 0) ❌
- Silent Wallet Standard connect succeeds but Privy state not updated ❌

## Next Steps

### What Privy Needs to Fix

Privy's `shouldAutoConnect: true` in `toSolanaWalletConnectors` needs to:
1. Re-query Wallet Standard API during session restore (not just check `window.solana`)
2. Attempt silent connection to previously connected Wallet Standard wallets
3. Update internal wallet state when Wallet Standard connection succeeds

### Alternative Solutions (If Privy Doesn't Fix)

1. Switch to a different wallet adapter library that properly supports Wallet Standard
2. Implement custom state persistence outside of Privy
3. Accept the UX limitation and require manual reconnection after refresh

## Documentation References

- Privy Docs: https://docs.privy.io/
- Wallet Standard: https://github.com/wallet-standard/wallet-standard
- MWA Docs: https://github.com/solana-mobile/mobile-wallet-adapter

## Change Log

- **2026-01-09**: Confirmed NO workaround available after testing multiple approaches
- **2026-01-09**: Removed infinite reload loop from failed workaround attempt
- **2026-01-09**: Updated documentation with evidence that bug cannot be worked around
- **2026-01-08**: Identified root cause as Privy bug, attempted workarounds
- **2026-01-08**: Updated RCA in MWA1364.txt with log evidence
- **2026-01-08**: Added comprehensive logging to track issue
