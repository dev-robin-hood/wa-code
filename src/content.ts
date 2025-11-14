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

import { MessageAction, ContentMessage } from './types/messages.js';
import { ResourceScanner } from './services/ResourceScanner.js';
import { ResourceDownloader } from './services/ResourceDownloader.js';
import { ZipBuilder } from './services/ZipBuilder.js';
import { MessageBroker } from './services/MessageBroker.js';
import { JSZipFactory } from './adapters/JSZipAdapter.js';
import { DownloadOrchestrator } from './orchestrators/DownloadOrchestrator.js';

console.log('wa-code content script loaded');

chrome.runtime.onMessage.addListener(
  (message: ContentMessage, _sender, sendResponse) => {
    console.log('wa-code received message:', message);
    if (message.action === MessageAction.START_DOWNLOAD) {
      handleDownloadRequest();
      sendResponse({ status: 'started' });
    }
    return true;
  }
);

function handleDownloadRequest(): void {
  const scanner = new ResourceScanner(document);
  const downloader = new ResourceDownloader();
  const zipFactory = new JSZipFactory();
  const zipLibrary = zipFactory.create();
  const zipBuilder = new ZipBuilder(zipLibrary);
  const messageBroker = new MessageBroker(chrome.runtime);

  const orchestrator = new DownloadOrchestrator(
    scanner,
    downloader,
    zipBuilder,
    messageBroker
  );

  orchestrator.execute();
}
