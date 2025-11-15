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

import { IScanStage } from '../IScanStage.js';
import { ScanContext } from '../ScanContext.js';

interface WindowWithRequire extends Window {
  require?: (module: string) => BootloaderModule;
}

interface BootloaderModule {
  getURLToHashMap?: () => Map<string, string>;
}

const TARGET_HOST = 'https://static.whatsapp.net/rsrc.php';
const JS_EXTENSION = '.js';
const MAX_RETRIES = 1000;
const RETRY_INTERVAL_MS = 100;

export class BootloaderExtraction implements IScanStage {
  async execute(context: ScanContext): Promise<ScanContext> {
    const bootloader = await this.waitForBootloader();
    const urlToHashMap = bootloader.getURLToHashMap?.();

    if (!urlToHashMap) {
      throw new Error('Bootloader.getURLToHashMap is not available');
    }

    const urls: string[] = [];

    urlToHashMap.forEach((_id: string, url: string) => {
      const fullUrl = this.buildFullUrl(url);

      if (this.isValidJavaScriptResource(fullUrl)) {
        urls.push(fullUrl);
      }
    });

    return context.mergeUrls(urls);
  }

  private async waitForBootloader(): Promise<BootloaderModule> {
    const bootloader = this.tryGetBootloader();

    if (bootloader) {
      return bootloader;
    }

    for (let attempt = 1; attempt < MAX_RETRIES; attempt++) {
      await this.sleep(RETRY_INTERVAL_MS);

      const bootloader = this.tryGetBootloader();

      if (bootloader) {
        return bootloader;
      }
    }

    throw new Error('Bootloader not found after maximum retries');
  }

  private tryGetBootloader(): BootloaderModule | null {
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

  private buildFullUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }

    if (url.startsWith('/')) {
      return 'https://web.whatsapp.com' + url;
    }

    return 'https://web.whatsapp.com/' + url;
  }

  private isValidJavaScriptResource(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    return url.startsWith(TARGET_HOST) && url.includes(JS_EXTENSION);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
