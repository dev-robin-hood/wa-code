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

import { InjectedBridge } from "./InjectedBridge.js";
import { ScanNotification } from "./ui/ScanNotification.js";
import {
  MessageAction,
  OpenOptionsPageMessage,
} from "../core/types/messages.js";
import { Logger } from "../core/services/Logger.js";

export class ContentOrchestrator {
  private readonly bridge: InjectedBridge;
  private readonly notification: ScanNotification;
  private readonly stabilityDelayMs: number;
  private readonly logger = new Logger("ContentOrchestrator");

  constructor(stabilityDelayMs: number = 3000) {
    this.bridge = new InjectedBridge();
    this.notification = new ScanNotification();
    this.stabilityDelayMs = stabilityDelayMs;
  }

  async initialize(): Promise<void> {
    this.injectPageScript();
    await this.bridge.waitForReady();
    await this.autoScanAndStore();
  }

  async handleManualScan(): Promise<string[]> {
    this.logger.info("Starting manual scan");
    const urls = await this.bridge.requestScan();
    this.logger.info(`Found ${urls.length} JavaScript resources`);
    return urls;
  }

  private injectPageScript(): void {
    const script = document.createElement("script");
    script.type = "module";
    script.src = chrome.runtime.getURL("injected.js");
    (document.head || document.documentElement).appendChild(script);
  }

  private async autoScanAndStore(): Promise<void> {
    try {
      this.notification.showLoading();
      this.logger.info("Auto-scanning resources with stabilization");
      const urls = await this.scanUntilStable();

      this.logger.info(`Resources stabilized at ${urls.length} items`);

      await chrome.storage.local.set({ scannedUrls: urls });
      this.logger.info("Resources saved to storage");

      this.showSuccessNotification(urls.length);
    } catch (error) {
      this.logger.error("Auto-scan failed", error);
      this.showErrorNotification(error);
    }
  }

  private async scanUntilStable(): Promise<string[]> {
    let previousBootloaderCount = -1;
    let staticUrls: string[] = [];

    const firstScanUrls = await this.bridge.requestScan(true);
    this.logger.info(
      `Initial scan found ${firstScanUrls.length} resources (with static)`,
    );

    const firstBootloaderOnlyUrls = await this.bridge.requestScan(false);
    previousBootloaderCount = firstBootloaderOnlyUrls.length;
    staticUrls = firstScanUrls.filter(
      (url) => !firstBootloaderOnlyUrls.includes(url),
    );

    this.logger.info(
      `Extracted ${staticUrls.length} static URLs for preservation`,
    );

    while (true) {
      this.logger.debug(
        `Waiting ${this.stabilityDelayMs / 1000} seconds for stabilization`,
      );
      await this.sleep(this.stabilityDelayMs);

      const bootloaderUrls = await this.bridge.requestScan(false);
      const currentCount = bootloaderUrls.length;

      this.logger.debug(
        `Scan iteration found ${currentCount} bootloader resources`,
      );

      if (currentCount === previousBootloaderCount) {
        this.logger.info("Bootloader stable, merging with static resources");

        const allUrls = [...bootloaderUrls, ...staticUrls];
        const uniqueUrls = [...new Set(allUrls)];

        this.logger.info(`Final total: ${uniqueUrls.length} unique resources`);
        return uniqueUrls;
      }

      previousBootloaderCount = currentCount;
    }
  }

  private showSuccessNotification(count: number): void {
    this.notification.showSuccess(count, () => {
      const message: OpenOptionsPageMessage = {
        action: MessageAction.OPEN_OPTIONS_PAGE,
      };
      chrome.runtime.sendMessage(message);
    });
  }

  private showErrorNotification(error: unknown): void {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to scan resources. Please refresh the page and try again.";
    this.notification.showError(message);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
