# wa-code

Chrome extension for downloading minified JavaScript resources from WhatsApp Web.

## Installation

### Prerequisites

- Node.js 22+
- npm 10+

### Build from Source

```bash
git clone https://github.com/dev-robin-hood/wa-code.git
cd wa-code
npm install
npm run build
```

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` directory

## Usage

1. Navigate to [web.whatsapp.com](https://web.whatsapp.com)
2. Wait for page to load completely
3. Resources are automatically detected and saved
4. A notification appears when detection is complete
5. Click the notification or wait for automatic redirect to the options page
6. Click "Download Resources" to package all files into a ZIP archive

## What it does

Automatically detects JavaScript resources from WhatsApp Web's Bootloader module, monitors for resource stabilization, and packages all discovered files matching `static.whatsapp.net/rsrc.php/*.js` into a compressed ZIP archive with optional code formatting.

## Why Bootloader instead of DOM parsing

WhatsApp Web uses Facebook's Bootloader module to manage resource loading. The extension accesses `window.require('Bootloader').getURLToHashMap()` instead of parsing `<script>` tags from the DOM for several technical reasons:

**Complete resource discovery**

The Bootloader maintains a comprehensive registry of all JavaScript modules loaded by the application, including those loaded dynamically after the initial page load. DOM parsing with `document.querySelectorAll('script[src]')` only captures scripts present in the HTML at the time of query, missing modules loaded asynchronously through code splitting, lazy loading, or dynamic imports.

**Internal module tracking**

WhatsApp Web loads modules on demand based on user interactions and application state. The Bootloader tracks these internal dependencies and their corresponding URLs in a centralized Map structure. This internal registry is authoritative, whereas the DOM only reflects what has been injected into the page tree at any given moment.

**Deduplication and versioning**

The Bootloader's URL to hash mapping ensures each unique module is represented once, with its content hash serving as a cache key. Scanning the DOM can encounter duplicate script references or miss versioned variants that share the same logical module but have different hashes due to updates.

**Timing independence**

Accessing the Bootloader's Map is synchronous once the module system is initialized. DOM-based scanning is subject to timing issues, as scripts may not be rendered into the tree immediately even after their code has executed. The Bootloader provides a stable, race-condition-free source of truth.

The extension implements a stabilization mechanism that polls the Bootloader every 3 seconds until the resource count stabilizes, ensuring all dynamically loaded modules are captured before initiating the download process.

## License

```
Copyright 2025 dev-robin-hood

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

Contributions are welcome.
