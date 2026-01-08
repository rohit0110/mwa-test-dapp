# Icon Setup Instructions

The PWA requires icons for Bubblewrap. You have two options:

## Option 1: Use ImageMagick (if installed)

```bash
# Create 192x192 icon
convert -size 192x192 xc:#4F46E5 -gravity center -pointsize 60 -fill white -annotate +0+0 "MWA" public/icon-192.png

# Create 512x512 icon
convert -size 512x512 xc:#4F46E5 -gravity center -pointsize 160 -fill white -annotate +0+0 "MWA" public/icon-512.png
```

## Option 2: Download placeholder icons

```bash
# Download from a placeholder service
curl -o public/icon-192.png "https://via.placeholder.com/192/4F46E5/FFFFFF?text=MWA"
curl -o public/icon-512.png "https://via.placeholder.com/512/4F46E5/FFFFFF?text=MWA"
```

## Option 3: Create manually

Create two PNG images:
- `public/icon-192.png` (192x192 pixels)
- `public/icon-512.png` (512x512 pixels)

Use any image editor or online tool like:
- https://www.canva.com
- https://www.figma.com
- https://favicon.io

After creating the icons, proceed with the Bubblewrap setup.
