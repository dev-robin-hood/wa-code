/**
 * Copyright 2025 dev-robin-hood
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

interface WindowWithRequire extends Window {
  require?: (module: string) => BootloaderModule;
}

interface BootloaderModule {
  getURLToHashMap?: () => Map<string, string>;
}

interface ScanRequest {
  type: 'WA_CODE_SCAN_REQUEST';
}

interface ScanResponseSuccess {
  type: 'WA_CODE_SCAN_RESPONSE';
  success: true;
  urls: string[];
}

interface ScanResponseError {
  type: 'WA_CODE_SCAN_RESPONSE';
  success: false;
  error: string;
}

type ScanResponse = ScanResponseSuccess | ScanResponseError;

const TARGET_HOST = 'https://static.whatsapp.net/rsrc.php';
const JS_EXTENSION = '.js';
const MAX_RETRIES = 1000;
const RETRY_INTERVAL_MS = 100;

window.addEventListener('message', async (event: MessageEvent<ScanRequest>) => {
  if (event.source !== window || event.data.type !== 'WA_CODE_SCAN_REQUEST') {
    return;
  }

  console.log('[wa-code injected] Received scan request');

  try {
    const urls = await scanBootloader();
    const response: ScanResponseSuccess = {
      type: 'WA_CODE_SCAN_RESPONSE',
      success: true,
      urls,
    };
    window.postMessage(response, '*');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ScanResponseError = {
      type: 'WA_CODE_SCAN_RESPONSE',
      success: false,
      error: errorMessage,
    };
    window.postMessage(response, '*');
  }
});

async function scanBootloader(): Promise<string[]> {
  const bootloader = await waitForBootloader();
  const urlToHashMap = bootloader.getURLToHashMap?.();

  if (!urlToHashMap) {
    throw new Error('Bootloader.getURLToHashMap is not available');
  }

  const urls: string[] = [];

  urlToHashMap.forEach((_id: string, url: string) => {
    const fullUrl = buildFullUrl(url);

    if (isValidJavaScriptResource(fullUrl)) {
      urls.push(fullUrl);
    }
  });

  const uniqueResources = [...new Set(urls)];

  if (uniqueResources.length === 0) {
    throw new Error('No JavaScript resources found matching the required pattern');
  }

  return uniqueResources;
}

async function waitForBootloader(): Promise<BootloaderModule> {
  const bootloader = tryGetBootloader();

  if (bootloader) {
    return bootloader;
  }

  for (let attempt = 1; attempt < MAX_RETRIES; attempt++) {
    await sleep(RETRY_INTERVAL_MS);

    const bootloader = tryGetBootloader();

    if (bootloader) {
      return bootloader;
    }
  }

  throw new Error('Bootloader not found after maximum retries');
}

function tryGetBootloader(): BootloaderModule | null {
  try {
    const windowWithRequire = window as WindowWithRequire;
    const requireFn = windowWithRequire.require;

    if (!requireFn) {
      return null;
    }

    const bootloader = requireFn('Bootloader');

    if (!bootloader || typeof bootloader.getURLToHashMap !== 'function') {
      return null;
    }

    return bootloader;
  } catch {
    return null;
  }
}

function buildFullUrl(url: string): string {
  if (url.startsWith('http')) {
    return url;
  }

  if (url.startsWith('/')) {
    return 'https://web.whatsapp.com' + url;
  }

  return 'https://web.whatsapp.com/' + url;
}

function isValidJavaScriptResource(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  return url.startsWith(TARGET_HOST) && url.includes(JS_EXTENSION);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

console.log('[wa-code injected] Page script loaded and ready');

window.postMessage({ type: 'WA_CODE_INJECTED_READY' }, '*');
