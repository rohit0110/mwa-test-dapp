# Complete Testing Guide for MWA Issue #1364

## Step 1: Install Dependencies

```bash
cd /Users/icarus/Desktop/Code/bugs/mwa-test-dapp
npm install
```

## Step 2: Create Icon Files

You need to create two icon files. Run ONE of these commands:

### Option A: Using ImageMagick (if you have it)
```bash
brew install imagemagick
convert -size 192x192 xc:#4F46E5 -gravity center -pointsize 60 -fill white -annotate +0+0 "MWA" public/icon-192.png
convert -size 512x512 xc:#4F46E5 -gravity center -pointsize 160 -fill white -annotate +0+0 "MWA" public/icon-512.png
```

### Option B: Copy existing icons
```bash
# If you have any PNG files, just copy them:
cp ~/Downloads/some-icon.png public/icon-192.png
cp ~/Downloads/some-icon.png public/icon-512.png
```

### Option C: Use Python to create simple icons
```bash
python3 << 'EOF'
from PIL import Image, ImageDraw, ImageFont

# Create 192x192 icon
img192 = Image.new('RGB', (192, 192), color='#4F46E5')
d = ImageDraw.Draw(img192)
d.text((96, 96), "MWA", fill='white', anchor='mm')
img192.save('public/icon-192.png')

# Create 512x512 icon
img512 = Image.new('RGB', (512, 512), color='#4F46E5')
d = ImageDraw.Draw(img512)
d.text((256, 256), "MWA", fill='white', anchor='mm')
img512.save('public/icon-512.png')

print("Icons created!")
EOF
```

## Step 3: Build and Start the App

```bash
npm run build
npm start
```

The app should now be running on http://localhost:3000

**Keep this terminal running!**

## Step 4: Verify App Works in Browser

Open http://localhost:3000 in your browser to verify everything works before wrapping with Bubblewrap.

## Step 5: Install Bubblewrap

In a NEW terminal:

```bash
npm install -g @bubblewrap/cli
```

## Step 6: Initialize Bubblewrap Project

```bash
cd /Users/icarus/Desktop/Code/bugs/mwa-test-dapp
npx @bubblewrap/cli init --manifest http://localhost:3000/manifest.json
```

Answer the prompts:
- Domain: `localhost:3000`
- Domain being served from: `http://localhost:3000`
- Package ID: `com.mwatest.app` (or any valid package name)
- App name: `MWA Test`
- Display mode: `standalone`
- Status bar color: `#000000`
- Navigation bar color: `#000000`
- Launcher name: `MWA Test`

## Step 7: Build the APK

```bash
npx @bubblewrap/cli build
```

This will create: `app-release-signed.apk`

## Step 8: Install on Pixel 8 Emulator

Make sure your Pixel 8 emulator is running, then:

```bash
adb devices  # Verify emulator is connected
adb install app-release-signed.apk
```

## Step 9: Test the Scenario

### First Run (Should Work):

1. Open "MWA Test" app on Pixel 8
2. Click "Connect Wallet"
3. Approve connection on mock wallet
4. Click "Sign Test Transaction"
5. Approve transaction on mock wallet
6. ✅ Should succeed

### Second Run (Testing Issue #1364):

7. **Close the app completely** (swipe away from recents)
8. **Reopen "MWA Test" app**
9. Click "Connect Wallet" (should use cached authorization)
10. Click "Sign Test Transaction"
11. **Check the result:**
    - ❌ If v0.4.4 is BROKEN: Error "does not support signing transactions"
    - ✅ If v0.4.4 is FIXED: Transaction succeeds

### What to Watch in Logs:

The app shows detailed logs. Look for:
- `navigator.wallets` initialization
- `Features after connect` - should include `solana:signTransaction`
- After reopen, check if features are restored

## Step 10: Collect Debug Info

### In the app logs, check:
```
✓ Has solana:signTransaction: ✅ or ❌
✓ Has solana:signAndSendTransaction: ✅ or ❌
```

### In Android logcat:
```bash
adb logcat | grep -i "mwallet\|capabilities"
```

## Expected Results

### If Issue #1364 is FIXED (v0.4.4):
- First run: ✅ Transaction succeeds
- After reopen: ✅ Transaction succeeds
- Logs show: `solana:signTransaction: ✅` both times

### If Issue #1364 is PRESENT:
- First run: ✅ Transaction succeeds
- After reopen: ❌ "does not support signing transactions"
- Logs show: `solana:signTransaction: ❌` after reopen

## Troubleshooting

### "No wallets found"
- Make sure mock-mwa-wallet is installed and running
- Check that MWA initialized: look for "MWA registered" in logs

### Build fails
- Make sure you have JDK 17+ installed
- Make sure Android SDK is configured
- Try: `npx @bubblewrap/cli doctor`

### APK install fails
- Check emulator is running: `adb devices`
- Try uninstalling first: `adb uninstall com.mwatest.app`

### App crashes on open
- Check logcat: `adb logcat | grep -E "AndroidRuntime|FATAL"`
- Make sure Next.js dev server is running on localhost:3000

## Alternative: Test Without Bubblewrap

You can also test directly in Chrome on the emulator:

1. Start the app: `npm start`
2. On Pixel 8 emulator, open Chrome
3. Navigate to http://10.0.2.2:3000 (emulator's localhost)
4. Test the same scenario

Note: This tests the Chrome PWA issue we found, not the original #1364.

## Files Created

```
mwa-test-dapp/
├── package.json          # Dependencies including MWA 0.4.4
├── app/
│   ├── layout.tsx        # Root layout with PWA metadata
│   ├── page.tsx          # Main app with wallet integration
│   └── globals.css       # Styles
├── public/
│   ├── manifest.json     # PWA manifest
│   ├── icon-192.png      # App icon (you need to create)
│   └── icon-512.png      # App icon (you need to create)
├── next.config.js        # Next.js config
├── tsconfig.json         # TypeScript config
└── README.md             # Quick reference

```

## Next Steps After Testing

1. Document your findings
2. Compare with the bug report we created
3. Report results on GitHub issue #1364
