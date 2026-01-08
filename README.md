# MWA Test dApp

Minimal dApp to test Mobile Wallet Adapter issue #1364

## Setup

```bash
npm install
npm run dev
```

## Testing with Bubblewrap

1. Build the app:
```bash
npm run build
npm start
```

2. Generate icons (192x192 and 512x512):
```bash
# Create placeholder icons or use actual ones
```

3. Initialize Bubblewrap:
```bash
npx @bubblewrap/cli init --manifest http://localhost:3000/manifest.json
```

4. Build APK:
```bash
npx @bubblewrap/cli build
```

5. Install on device:
```bash
adb install app-release-signed.apk
```

## Testing Scenario

1. Connect wallet and sign a transaction (should work)
2. Close the app completely
3. Reopen the app
4. Try signing a transaction again
5. Check if it fails with "does not support signing transactions"

## Expected Behavior

With MWA v0.4.4, the issue #1364 should be fixed and transactions should work after app restart.

## Dependencies

- `@solana-mobile/wallet-standard-mobile`: 0.4.4
- `@solana/wallet-adapter-react`: Latest
- `@solana/web3.js`: Latest
- Next.js: 15.x
- React: 19.x
