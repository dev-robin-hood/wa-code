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
3. Click the wa-code extension icon
4. Click "Start Download"
5. The minified JavaScript files will be downloaded as a ZIP archive

## What it does

Scans WhatsApp Web for JavaScript resources matching `static.whatsapp.net/rsrc.php/v4*`, downloads them, and packages everything into a compressed ZIP file.

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
