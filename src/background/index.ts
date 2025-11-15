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
  OpenOptionsMessage,
  ExtensionMessage,
} from "../core/types/messages.js";

chrome.runtime.onInstalled.addListener(() => {
  console.log("wa-code extension installed successfully");
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage): boolean => {
  console.log("[wa-code background] Received message:", message.action);

  if (message.action === MessageAction.OPEN_OPTIONS) {
    const openMessage = message as OpenOptionsMessage;
    chrome.storage.session.set({ pendingUrls: openMessage.urls }).then(() => {
      chrome.runtime.openOptionsPage();
    });
    return true;
  }

  if (message.action === MessageAction.OPEN_OPTIONS_PAGE) {
    chrome.runtime.openOptionsPage();
    return true;
  }

  return false;
});
