# MWA Test dApp - Debugging Guide

## Recent Improvements

### 1. Fixed Wallet Standard API Usage
**Problem**: The app was checking `window.navigator.wallets.getWallets()` (deprecated API) instead of using the modern `getWallets()` API from `@wallet-standard/app`.

**Solution**: Updated all wallet checks to use the correct API:
```typescript
import { getWallets } from '@wallet-standard/app';

const walletsApi = getWallets();
const wallets = walletsApi.get(); // Correct way to get wallets
```

**Files Changed**: `app/wallet-test.tsx`

---

### 2. Proper MWA Registration Synchronization
**Problem**: Privy was initializing before MWA finished registering in the Wallet Standard.

**Solution**: Modified `app/providers.tsx` to:
1. Initialize Wallet Standard API first with `getWallets()`
2. Register MWA using `registerMwa()`
3. Poll the Wallet Standard registry directly (`walletsApi.get()`) to confirm MWA appears
4. Only set `privyReady = true` after MWA is confirmed registered

This ensures Privy can't query the wallet list until MWA is fully registered.

**Files Changed**: `app/providers.tsx`

---

### 3. Early Log Capture
**Problem**: Logs from `providers.tsx` initialization were happening before the LogViewer component mounted, so they weren't visible.

**Solution**: Implemented a global log buffer that intercepts console methods at module load time, before React renders. The LogViewer syncs with this buffer every 100ms.

**Files Changed**: `app/log-viewer.tsx`

---

### 4. Enhanced Logging Throughout
Added detailed categorized logs with emojis for easy scanning:
- `[INIT]` - MWA initialization process
- `[COMPONENT]` - Component lifecycle events
- `[RECONNECT]` - Auto-reconnect attempts
- `[AUTH]` - Authentication state changes
- `[WALLET]` - Wallet state updates
- `[WALLET-CHECK]` - Wallet detection checks
- `[WALLET-MATCH]` - Matching Privy wallet with Wallet Standard
- `[LOGIN]` - Login flow
- `[BUG]` - Bug detection (when Wallet Standard has features but Privy doesn't)

**Files Changed**: `app/providers.tsx`, `app/wallet-test.tsx`

---

### 5. Copy to Clipboard Feature
Added a button to copy all logs to clipboard with formatted output including:
- Timestamp and metadata header
- All log entries with timestamps and levels
- Environment info (URL, user agent)

**Files Changed**: `app/log-viewer.tsx`

---

## How to Debug the Session Restoration Issue

### Step 1: First Connection
1. Open the app on your mobile device
2. Click "Connect Wallet"
3. Expand the log viewer (click "▲ Console Logs")
4. Look for these key log sequences:

```
🚀 [INIT] ========================================
🚀 [INIT] Starting MWA registration process
📡 [INIT] Wallet Standard API obtained. Current wallets: X
🔍 [INIT] Attempt 1/100: Checking for MWA...
✅ [INIT] MWA wallet found after N attempts!
🎯 [INIT] Setting Privy ready = true
```

5. After successful connection, look for:
```
🔐 [AUTH] Authenticated with wallet:
   💼 [AUTH] Wallet type: mobile_wallet_adapter
   🔧 [AUTH] Methods available: {
     "signTransaction": true,
     "signMessage": true
   }
```

6. Check Wallet Standard matching:
```
✅ [WALLET-MATCH] Matching Wallet Standard wallet found: Mobile Wallet Adapter
  ⚙️ [WALLET-MATCH] Available features: [list of features]
  ✅ [WALLET-MATCH] solana:signTransaction IS PRESENT in Wallet Standard
```

7. Copy logs to clipboard for comparison with post-refresh logs.

---

### Step 2: After Page Refresh
1. Refresh the page (pull down to refresh or close and reopen app)
2. Expand the log viewer immediately
3. Look for the initialization sequence:

```
🚀 [INIT] ========================================
🚀 [INIT] Starting MWA registration process
```

**If you DON'T see these logs**, it means the early log capture isn't working properly.

4. Check the authentication state:
```
✅ [RECONNECT] Already authenticated, skipping auto-login
```

5. **CRITICAL**: Check if wallet is restored:
```
🔐 [AUTH] Authenticated with wallet:
```

**OR the problem:**
```
⚠️ [AUTH] CRITICAL: Authenticated but no active wallet!
   This means Privy session was restored but wallet state was not
```

6. Check Wallet Standard state:
```
✅ [WALLET-CHECK] Wallet Standard API initialized successfully
📊 [WALLET-CHECK] Found N wallet(s)
```

**If N = 0**, MWA didn't register after refresh, which means:
- The [INIT] sequence didn't run
- Or registerMwa() is failing silently
- Or there's a race condition we didn't catch

7. Copy logs and compare with first connection logs.

---

## Key Things to Check

### Issue: "Authenticated but no active wallet"
This indicates Privy restored the user session but lost the wallet connection.

**Possible Causes:**
1. Privy's `shouldAutoConnect: true` isn't working for MWA
2. MWA isn't in the Wallet Standard registry when Privy queries it
3. Privy is caching an old state where MWA capabilities were missing

**What to Look For in Logs:**
- How many wallets are in Wallet Standard after refresh?
- Does `[WALLET-CHECK]` show MWA is present?
- Does Privy's `wallets` array have 0 or 1+ items?

---

### Issue: "No wallets in Wallet Standard"
This means MWA didn't register after the refresh.

**Possible Causes:**
1. The `registerMwa()` call is failing silently
2. There's a timing issue we didn't catch
3. The environment checks in `registerMwa()` are failing

**What to Look For in Logs:**
- Do you see `[INIT]` logs at all?
- Do you see "✅ [INIT] MWA wallet found after N attempts"?
- Do you see "⚠️ [INIT] MWA not found after polling"?

---

### Issue: "signTransaction method missing"
This is the bug we're trying to confirm (#1364).

**What to Look For in Logs:**
```
🐛 [BUG] BUG DETECTED: Wallet Standard wallet HAS signTransaction feature!
🐛 [BUG] This indicates Privy failed to properly invoke the wallet capability.
🐛 [BUG] This is likely the caching issue from #1364
```

This will appear if:
1. Wallet Standard shows the wallet has `solana:signTransaction`
2. But Privy's `activeWallet.signTransaction` is undefined/missing
3. And a transaction fails

---

## Expected Log Flow

### First Connection (Success)
```
[INIT] MWA registration → MWA found → Privy ready → Component mounts →
User clicks connect → Privy login → Authenticated with wallet →
Wallet methods available → Wallet Standard match found → Transaction works
```

### After Refresh (Ideal)
```
[INIT] MWA registration → MWA found → Privy ready → Component mounts →
Already authenticated → Wallet restored → Wallet methods available →
Wallet Standard match found → Transaction works
```

### After Refresh (Bug Scenario)
```
[INIT] MWA registration → MWA found → Privy ready → Component mounts →
Already authenticated → ⚠️ No active wallet / Missing signTransaction →
⚠️ No Wallet Standard match → Transaction fails
```

---

## Sharing Logs for Bug Reports

1. Click the "📋 Copy" button in the log viewer
2. Paste into a text editor
3. Save as two separate files:
   - `first-connection-logs.txt`
   - `after-refresh-logs.txt`
4. Attach both to the bug report with description of what failed

---

## Next Steps If Issue Persists

If you still see "authenticated but no active wallet" after refresh:

1. **Check Privy Configuration**: The `shouldAutoConnect: true` may not work for MWA wallets
2. **Add Explicit Reconnection**: May need to manually call `wallets[0].connect()` on mount if authenticated
3. **Check Authorization Cache**: The MWA authorization cache may be working, but Privy isn't using it
4. **Report to Privy**: This could be a Privy + MWA integration issue requiring a fix in Privy

---

## Testing Checklist

- [ ] First connection: See [INIT] logs
- [ ] First connection: MWA found in Wallet Standard
- [ ] First connection: Privy authenticated with wallet
- [ ] First connection: signTransaction method available
- [ ] First connection: Transaction signs successfully
- [ ] After refresh: See [INIT] logs
- [ ] After refresh: MWA found in Wallet Standard
- [ ] After refresh: Privy authenticated
- [ ] After refresh: Wallet restored (not "no active wallet")
- [ ] After refresh: signTransaction method available
- [ ] After refresh: Transaction signs successfully
- [ ] Logs copied to clipboard successfully
- [ ] Compared first connection vs after refresh logs
