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
} from '../core/types/messages.js';
import { ContentOrchestrator } from './ContentOrchestrator.js';

console.log('wa-code content script loaded');

const orchestrator = new ContentOrchestrator();

orchestrator.initialize().catch((error) => {
  console.error('[wa-code] Failed to initialize:', error);
});

chrome.runtime.onMessage.addListener(
  (message: ScanResourcesMessage, _sender, sendResponse) => {
    if (message.action === MessageAction.SCAN_RESOURCES) {
      handleScanRequest(sendResponse);
      return true;
    }
    return false;
  }
);

async function handleScanRequest(
  sendResponse: (response: ResourcesFoundMessage) => void
): Promise<void> {
  try {
    const urls = await orchestrator.handleManualScan();

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
