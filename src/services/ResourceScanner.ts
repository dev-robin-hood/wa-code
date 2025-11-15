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

import { IResourceScanner } from '../interfaces/IResourceScanner.js';

interface WindowWithBootloader extends Window {
  require?: (module: string) => BootloaderModule;
}

interface BootloaderModule {
  getURLToHashMap?: () => Map<string, string>;
}

export class ResourceScanner implements IResourceScanner {
  private static readonly TARGET_HOST = 'https://static.whatsapp.net/rsrc.php' as const;
  private static readonly JS_EXTENSION = '.js' as const;
  private static readonly MAX_RETRIES = 1000;
  private static readonly RETRY_INTERVAL_MS = 100;

  constructor(private readonly window: WindowWithBootloader) {}

  async scan(): Promise<ReadonlyArray<string>> {
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

    const uniqueResources = [...new Set(urls)];

    if (uniqueResources.length === 0) {
      throw new Error('No JavaScript resources found matching the required pattern');
    }

    return Object.freeze(uniqueResources);
  }

  private async waitForBootloader(): Promise<BootloaderModule> {
    const bootloader = this.tryGetBootloader();

    if (bootloader) {
      return bootloader;
    }

    for (let attempt = 1; attempt < ResourceScanner.MAX_RETRIES; attempt++) {
      await this.sleep(ResourceScanner.RETRY_INTERVAL_MS);

      const bootloader = this.tryGetBootloader();

      if (bootloader) {
        return bootloader;
      }
    }

    throw new Error('Bootloader not found after maximum retries');
  }

  private tryGetBootloader(): BootloaderModule | null {
    try {
      const requireFn = this.window.require;

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

    return (
      url.startsWith(ResourceScanner.TARGET_HOST) &&
      url.includes(ResourceScanner.JS_EXTENSION)
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
