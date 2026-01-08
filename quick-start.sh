#!/bin/bash

set -e

echo "======================================"
echo "MWA Test dApp Quick Start"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd "$(dirname "$0")"

# Step 1: Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
    echo ""
fi

# Step 2: Check for icons
if [ ! -f "public/icon-192.png" ] || [ ! -f "public/icon-512.png" ]; then
    echo -e "${YELLOW}🎨 Creating placeholder icons...${NC}"

    # Try Python PIL
    if command -v python3 &> /dev/null; then
        python3 << 'EOF'
try:
    from PIL import Image, ImageDraw

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

    print("✅ Icons created with Python PIL")
except ImportError:
    print("⚠️  PIL not installed, trying ImageMagick...")
    exit(1)
EOF
        if [ $? -ne 0 ]; then
            # Try ImageMagick
            if command -v convert &> /dev/null; then
                convert -size 192x192 xc:#4F46E5 -gravity center -pointsize 60 -fill white -annotate +0+0 "MWA" public/icon-192.png
                convert -size 512x512 xc:#4F46E5 -gravity center -pointsize 160 -fill white -annotate +0+0 "MWA" public/icon-512.png
                echo -e "${GREEN}✅ Icons created with ImageMagick${NC}"
            else
                echo -e "${RED}❌ Could not create icons. Please create them manually.${NC}"
                echo "See SETUP_ICONS.md for instructions."
                exit 1
            fi
        fi
    else
        echo -e "${RED}❌ Python not found. Please create icons manually.${NC}"
        echo "See SETUP_ICONS.md for instructions."
        exit 1
    fi
    echo ""
else
    echo -e "${GREEN}✅ Icons already exist${NC}"
    echo ""
fi

# Step 3: Build the app
echo -e "${YELLOW}🏗️  Building app...${NC}"
npm run build
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Step 4: Check if Bubblewrap is installed
if ! command -v bubblewrap &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Bubblewrap CLI...${NC}"
    npm install -g @bubblewrap/cli
    echo -e "${GREEN}✅ Bubblewrap installed${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Bubblewrap already installed${NC}"
    echo ""
fi

echo "======================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Start the app:"
echo "   ${YELLOW}npm start${NC}"
echo ""
echo "2. In a NEW terminal, initialize Bubblewrap:"
echo "   ${YELLOW}npx @bubblewrap/cli init --manifest http://localhost:3000/manifest.json${NC}"
echo ""
echo "3. Build APK:"
echo "   ${YELLOW}npx @bubblewrap/cli build${NC}"
echo ""
echo "4. Install on emulator:"
echo "   ${YELLOW}adb install app-release-signed.apk${NC}"
echo ""
echo "See TESTING_GUIDE.md for detailed instructions."
echo ""
