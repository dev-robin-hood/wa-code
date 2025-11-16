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

interface ScanResponse {
  type: 'WA_CODE_SCAN_RESPONSE';
  success: boolean;
  urls?: string[];
  error?: string;
}

interface ReadyMessage {
  type: 'WA_CODE_INJECTED_READY';
}

import { Logger } from '../core/services/Logger.js';

export class InjectedBridge {
  private static readonly READY_TIMEOUT_MS = 30000;
  private readonly logger = new Logger('InjectedBridge');

  async waitForReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const readyHandler = (event: MessageEvent<ReadyMessage>): void => {
        if (event.source !== window || event.data.type !== 'WA_CODE_INJECTED_READY') {
          return;
        }

        this.logger.info('Injected script is ready');
        window.removeEventListener('message', readyHandler);
        clearTimeout(timeout);
        resolve();
      };

      const timeout = setTimeout(() => {
        window.removeEventListener('message', readyHandler);
        reject(new Error('Injected script did not signal ready in time'));
      }, InjectedBridge.READY_TIMEOUT_MS);

      window.addEventListener('message', readyHandler);
    });
  }

  async requestScan(includeStatic: boolean = true): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const messageHandler = (event: MessageEvent<ScanResponse>): void => {
        if (event.source !== window || event.data.type !== 'WA_CODE_SCAN_RESPONSE') {
          return;
        }

        window.removeEventListener('message', messageHandler);

        if (event.data.success && event.data.urls) {
          resolve(event.data.urls);
        } else {
          reject(new Error(event.data.error || 'Unknown error'));
        }
      };

      window.addEventListener('message', messageHandler);

      window.postMessage({ type: 'WA_CODE_SCAN_REQUEST', includeStatic }, '*');
    });
  }
}
