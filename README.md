# Domain Volume Controller

Chrome extension to control audio/video volume per domain.

## Features

- 🎚️ Set different volume levels for each website domain
- 🔄 Automatically applies saved volume when visiting a domain
- 🎯 Works with dynamically loaded media elements (YouTube, etc.)
- 💾 Volume settings persist across browser sessions

## Installation

### For Development

1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build
```

3. Load in Chrome:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Creating Icons

The extension requires icons in the following sizes:
- 16x16 pixels (toolbar icon)
- 48x48 pixels (extension management)
- 128x128 pixels (Chrome Web Store)

Create a `icons` folder in the project root and add PNG files:
- `icons/icon16.png`
- `icons/icon48.png`
- `icons/icon128.png`

You can use any image editor or online tool to create these icons. A simple speaker or volume icon works well.

## Usage

1. Navigate to any website with audio or video content
2. Click the extension icon in the toolbar
3. Adjust the volume slider (0-100%)
4. The volume is saved automatically and will be applied whenever you visit that domain

## Development

### Run Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Test Coverage

```bash
npm run test:coverage
```

### Build for Development

```bash
npm run build:dev
```

### Build for Production

```bash
npm run build
```

### Watch Mode (for development)

```bash
npm run watch
```

### Package for Chrome Web Store

Create a production-ready zip file for uploading to Chrome Web Store:

```bash
cd domain-volume-controller
npm run package
```

This will create `domain-volume-controller.zip` in the project root, excluding development files and source maps.

## Release Process

### Automated Release (GitHub Actions)

1. Update the version in `domain-volume-controller/manifest.json`
2. Commit your changes:
   ```bash
   git add .
   git commit -m "Release v1.0.0"
   ```
3. Create and push a version tag:
   ```bash
   git tag v1.0.0
   git push origin main --tags
   ```
4. GitHub Actions will automatically:
   - Run tests
   - Build the extension
   - Create a clean zip file
   - Create a GitHub Release with the zip file attached

### Manual Release

1. Build and package:
   ```bash
   cd domain-volume-controller
   npm run package
   ```
2. Upload `domain-volume-controller.zip` to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

## Project Structure

```
domain-volume-controller/
├── src/
│   ├── background/
│   │   └── service-worker.ts      # Service Worker
│   ├── content/
│   │   └── content-script.ts      # Volume control logic
│   ├── popup/
│   │   ├── popup.ts               # Popup UI logic
│   │   ├── popup.html             # Popup UI
│   │   └── popup.css              # Popup styles
│   ├── shared/
│   │   ├── types.ts               # Type definitions
│   │   ├── storage.ts             # Chrome Storage operations
│   │   └── constants.ts           # Constants
│   └── utils/
│       └── domain.ts              # Domain extraction utilities
├── tests/
│   ├── unit/                      # Unit tests
│   └── mocks/
│       └── chrome.ts              # Chrome API mocks
├── dist/                          # Build output
├── manifest.json                  # Manifest V3
├── package.json
├── tsconfig.json
├── jest.config.js
└── webpack.config.js
```

## Technical Details

- **Manifest V3**: Uses the latest Chrome extension manifest version
- **TypeScript**: Fully typed for better development experience
- **Jest**: Comprehensive test coverage
- **Webpack**: Optimized builds
- **MutationObserver**: Automatically detects dynamically loaded media elements

## How It Works

1. **Content Script**: Runs on every page, finds all `<audio>` and `<video>` elements, and applies the saved volume
2. **Service Worker**: Handles communication between popup and content script, manages storage
3. **Popup**: Provides UI to adjust volume for the current domain
4. **MutationObserver**: Watches for new media elements added to the page dynamically

## Browser Compatibility

- Chrome 88+
- Edge 88+
- Any Chromium-based browser supporting Manifest V3

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Write tests for your changes
4. Ensure all tests pass
5. Submit a pull request
