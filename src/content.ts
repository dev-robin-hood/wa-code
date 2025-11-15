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

import {
  MessageAction,
  ScanResourcesMessage,
  ResourcesFoundMessage,
  OpenOptionsPageMessage,
} from './types/messages.js';

console.log('wa-code content script loaded');

injectPageScript();

waitForInjectedScriptThenScan();

function injectPageScript(): void {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  (document.head || document.documentElement).appendChild(script);
}

function waitForInjectedScriptThenScan(): void {
  let hasStarted = false;

  const readyHandler = (event: MessageEvent): void => {
    if (event.source !== window || event.data.type !== 'WA_CODE_INJECTED_READY') {
      return;
    }

    console.log('[wa-code] Injected script is ready');
    window.removeEventListener('message', readyHandler);

    if (!hasStarted) {
      hasStarted = true;
      autoScanAndStore();
    }
  };

  window.addEventListener('message', readyHandler);

  setTimeout(() => {
    window.removeEventListener('message', readyHandler);
    if (!hasStarted) {
      console.error('[wa-code] Injected script did not signal ready in time');
    }
  }, 30000);
}

chrome.runtime.onMessage.addListener(
  (message: ScanResourcesMessage, _sender, sendResponse) => {
    if (message.action === MessageAction.SCAN_RESOURCES) {
      handleScanRequest(sendResponse);
      return true;
    }
    return false;
  }
);

async function autoScanAndStore(): Promise<void> {
  try {
    console.log('[wa-code] Auto-scanning resources with stabilization...');
    const urls = await scanUntilStable();

    console.log('[wa-code] Resources stabilized at', urls.length, 'items');

    await chrome.storage.local.set({ scannedUrls: urls });
    console.log('[wa-code] Resources saved to storage');

    showSuccessNotification(urls.length);
  } catch (error) {
    console.error('[wa-code] Auto-scan failed:', error);
  }
}

async function scanUntilStable(): Promise<string[]> {
  const STABILITY_DELAY_MS = 3000;
  let previousCount = -1;
  let stableUrls: string[] = [];

  while (true) {
    const urls = await requestScanFromPage();
    const currentCount = urls.length;

    console.log('[wa-code] Scan iteration: found', currentCount, 'resources');

    if (currentCount === previousCount) {
      console.log('[wa-code] Resource count stable, finishing scan');
      return stableUrls;
    }

    previousCount = currentCount;
    stableUrls = urls;

    console.log('[wa-code] Waiting', STABILITY_DELAY_MS / 1000, 'seconds for stabilization...');
    await sleep(STABILITY_DELAY_MS);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showSuccessNotification(count: number): void {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2D4438;
    color: #B3E6CC;
    padding: 16px 24px;
    border-radius: 8px;
    border: 1px solid #3D5848;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 999999;
    animation: slideIn 0.3s ease-out;
    cursor: pointer;
    line-height: 1.5;
  `;

  const title = document.createElement('div');
  title.style.cssText = `
    font-weight: 600;
    margin-bottom: 4px;
  `;
  title.textContent = `✓ ${count} resources detected`;

  const subtitle = document.createElement('div');
  subtitle.style.cssText = `
    font-size: 12px;
    opacity: 0.9;
  `;
  subtitle.textContent = 'Redirecting in 5s, or click here';

  notification.appendChild(title);
  notification.appendChild(subtitle);

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(notification);

  let timeoutId: number | null = null;

  const openOptionsPage = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      notification.remove();
      style.remove();

      const message: OpenOptionsPageMessage = {
        action: MessageAction.OPEN_OPTIONS_PAGE,
      };
      chrome.runtime.sendMessage(message);
    }, 300);
  };

  notification.addEventListener('click', openOptionsPage);

  timeoutId = window.setTimeout(openOptionsPage, 5000);
}

async function handleScanRequest(
  sendResponse: (response: ResourcesFoundMessage) => void
): Promise<void> {
  try {
    console.log('[wa-code] Starting scan request...');
    const urls = await requestScanFromPage();

    console.log('[wa-code] Found', urls.length, 'JavaScript resources');

    const response: ResourcesFoundMessage = {
      action: MessageAction.RESOURCES_FOUND,
      urls,
    };

    sendResponse(response);
  } catch (error) {
    console.error('[wa-code] Scan failed:', error);
    throw error;
  }
}


function requestScanFromPage(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const messageHandler = (event: MessageEvent): void => {
      if (event.source !== window || event.data.type !== 'WA_CODE_SCAN_RESPONSE') {
        return;
      }

      window.removeEventListener('message', messageHandler);

      if (event.data.success) {
        resolve(event.data.urls);
      } else {
        reject(new Error(event.data.error));
      }
    };

    window.addEventListener('message', messageHandler);

    window.postMessage({ type: 'WA_CODE_SCAN_REQUEST' }, '*');
  });
}

