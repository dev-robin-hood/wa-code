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
  OpenOptionsMessage,
} from './types/messages.js';
import { ResourceScanner } from './services/ResourceScanner.js';
import { InjectedButton } from './components/InjectedButton.js';

console.log('wa-code content script loaded');

const scanner = new ResourceScanner(document);
const button = new InjectedButton(handleButtonClick);

button.inject();

chrome.runtime.onMessage.addListener(
  (message: ScanResourcesMessage, _sender, sendResponse) => {
    if (message.action === MessageAction.SCAN_RESOURCES) {
      const urls = scanner.scan();

      const response: ResourcesFoundMessage = {
        action: MessageAction.RESOURCES_FOUND,
        urls,
      };

      sendResponse(response);
    }
    return true;
  }
);

function handleButtonClick(): void {
  const urls = scanner.scan();

  const openOptionsMessage: OpenOptionsMessage = {
    action: MessageAction.OPEN_OPTIONS,
    urls,
  };

  chrome.runtime.sendMessage(openOptionsMessage);
}
