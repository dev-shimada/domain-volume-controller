#!/bin/bash
# Script to create simple placeholder icons using ImageMagick
# If ImageMagick is not available, you can create these icons manually

if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found. Please create icons manually or install ImageMagick."
    echo "Required icons:"
    echo "  - icons/icon16.png (16x16 pixels)"
    echo "  - icons/icon48.png (48x48 pixels)"
    echo "  - icons/icon128.png (128x128 pixels)"
    exit 1
fi

# Create 16x16 icon
convert -size 16x16 xc:none -fill '#1a73e8' -draw "circle 8,8 8,2" \
    -fill white -draw "polygon 6,10 6,6 10,8" icon16.png

# Create 48x48 icon
convert -size 48x48 xc:none -fill '#1a73e8' -draw "circle 24,24 24,6" \
    -fill white -draw "polygon 18,30 18,18 30,24" icon48.png

# Create 128x128 icon
convert -size 128x128 xc:none -fill '#1a73e8' -draw "circle 64,64 64,16" \
    -fill white -draw "polygon 48,80 48,48 80,64" icon128.png

echo "Icons created successfully!"
