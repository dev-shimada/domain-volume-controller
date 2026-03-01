# Icons for Domain Volume Controller

This extension requires three icon sizes:

- **icon16.png** (16x16 pixels) - Toolbar icon
- **icon48.png** (48x48 pixels) - Extension management page
- **icon128.png** (128x128 pixels) - Chrome Web Store listing

## Creating Icons

### Option 1: Use Online Tools

You can use free online icon generators:
- [Favicon.io](https://favicon.io/) - Generate icons from text or images
- [RealFaviconGenerator](https://realfavicongenerator.net/) - Comprehensive icon generator
- [Canva](https://www.canva.com/) - Design custom icons

### Option 2: Design Your Own

Use any image editor (Photoshop, GIMP, Figma, etc.) to create:
- Simple speaker/volume icon
- Use blue color (#1a73e8) to match the UI
- Export in PNG format at the required sizes

### Option 3: Use ImageMagick (if available)

If you have ImageMagick installed, run:
```bash
cd icons
./create_icons.sh
```

## Temporary Solution

For development purposes, you can create simple solid color icons:

```bash
# Create solid blue icons as placeholders
cd icons

# Using convert (ImageMagick)
convert -size 16x16 xc:#1a73e8 icon16.png
convert -size 48x48 xc:#1a73e8 icon48.png
convert -size 128x128 xc:#1a73e8 icon128.png
```

Or use any online tool to create simple colored squares and save them with the correct filenames.
