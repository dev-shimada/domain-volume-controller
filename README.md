# Domain Volume Controller

Chrome extension to control audio/video volume per domain.

## Features

- 🎚️ Set different volume levels for each website domain
- 🔄 Automatically applies saved volume when visiting a domain
- 🎯 Works with dynamically loaded media elements (YouTube, etc.)
- 🧩 Covers embedded players in iframes, media inside shadow DOM, detached elements (`new Audio()`), and Web Audio API output
- 🎛️ Scales volume as a factor, so page-side volume controls (YouTube, Twitch, etc.) keep working
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

1. **Volume Enforcer (MAIN world)**: Runs at `document_start` in every frame and scales audio output by the saved factor. It hooks `HTMLMediaElement.prototype.volume`/`play()` (so it also reaches shadow DOM and detached elements like `new Audio()`), and interposes a `GainNode` in front of every `AudioContext.destination` connection for Web Audio output. Because it scales rather than overwrites, page-side volume controls keep working
2. **Content Script (isolated world)**: Reads the saved volume for the domain and passes the scale factor to the enforcer. Inside iframes it asks the service worker for the top-level tab's domain, so embedded players follow the setting of the site you are visiting
3. **Service Worker**: Handles communication between popup and content scripts, manages storage
4. **Popup**: Provides UI to adjust volume for the current domain
5. **MutationObserver**: Watches for new media elements added to the page dynamically

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
