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

import { InjectedBridge } from './InjectedBridge.js';
import { SuccessNotification } from './ui/SuccessNotification.js';
import { MessageAction, OpenOptionsPageMessage } from '../core/types/messages.js';

export class ContentOrchestrator {
  private readonly bridge: InjectedBridge;
  private readonly notification: SuccessNotification;
  private readonly stabilityDelayMs: number;

  constructor(stabilityDelayMs: number = 3000) {
    this.bridge = new InjectedBridge();
    this.notification = new SuccessNotification();
    this.stabilityDelayMs = stabilityDelayMs;
  }

  async initialize(): Promise<void> {
    this.injectPageScript();
    await this.bridge.waitForReady();
    await this.autoScanAndStore();
  }

  async handleManualScan(): Promise<string[]> {
    console.log('[ContentOrchestrator] Starting manual scan...');
    const urls = await this.bridge.requestScan();
    console.log('[ContentOrchestrator] Found', urls.length, 'JavaScript resources');
    return urls;
  }

  private injectPageScript(): void {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    (document.head || document.documentElement).appendChild(script);
  }

  private async autoScanAndStore(): Promise<void> {
    try {
      console.log('[ContentOrchestrator] Auto-scanning resources with stabilization...');
      const urls = await this.scanUntilStable();

      console.log('[ContentOrchestrator] Resources stabilized at', urls.length, 'items');

      await chrome.storage.local.set({ scannedUrls: urls });
      console.log('[ContentOrchestrator] Resources saved to storage');

      this.showSuccessNotification(urls.length);
    } catch (error) {
      console.error('[ContentOrchestrator] Auto-scan failed:', error);
    }
  }

  private async scanUntilStable(): Promise<string[]> {
    let previousBootloaderCount = -1;
    let staticUrls: string[] = [];

    const firstScanUrls = await this.bridge.requestScan(true);
    console.log('[ContentOrchestrator] Initial scan: found', firstScanUrls.length, 'resources (with static)');

    const firstBootloaderOnlyUrls = await this.bridge.requestScan(false);
    previousBootloaderCount = firstBootloaderOnlyUrls.length;
    staticUrls = firstScanUrls.filter((url) => !firstBootloaderOnlyUrls.includes(url));

    console.log('[ContentOrchestrator] Extracted', staticUrls.length, 'static URLs for preservation');

    while (true) {
      console.log('[ContentOrchestrator] Waiting', this.stabilityDelayMs / 1000, 'seconds for stabilization...');
      await this.sleep(this.stabilityDelayMs);

      const bootloaderUrls = await this.bridge.requestScan(false);
      const currentCount = bootloaderUrls.length;

      console.log('[ContentOrchestrator] Scan iteration: found', currentCount, 'bootloader resources');

      if (currentCount === previousBootloaderCount) {
        console.log('[ContentOrchestrator] Bootloader stable, merging with static resources');

        const allUrls = [...bootloaderUrls, ...staticUrls];
        const uniqueUrls = [...new Set(allUrls)];

        console.log('[ContentOrchestrator] Final total:', uniqueUrls.length, 'unique resources');
        return uniqueUrls;
      }

      previousBootloaderCount = currentCount;
    }
  }

  private showSuccessNotification(count: number): void {
    this.notification.show(count, () => {
      const message: OpenOptionsPageMessage = {
        action: MessageAction.OPEN_OPTIONS_PAGE,
      };
      chrome.runtime.sendMessage(message);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
