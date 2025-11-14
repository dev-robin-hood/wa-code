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
  UpdateProgressMessage,
  DownloadCompleteMessage,
  DownloadErrorMessage,
  FileStatusUpdateMessage,
  FileStatus,
} from '../types/messages.js';
import { DownloadProgress, DownloadStatistics } from '../types/download.js';
import { IMessageBroker } from '../interfaces/IMessageBroker.js';

export class MessageBroker implements IMessageBroker {
  constructor(private readonly runtime: typeof chrome.runtime) {}

  sendFileStatus(url: string, filename: string, status: FileStatus): void {
    const message: FileStatusUpdateMessage = {
      action: MessageAction.FILE_STATUS_UPDATE,
      url,
      filename,
      status,
    };

    this.runtime.sendMessage(message);
  }

  sendProgress(progress: DownloadProgress, info: string): void {
    const message: UpdateProgressMessage = {
      action: MessageAction.UPDATE_PROGRESS,
      current: progress.current,
      total: progress.total,
      success: progress.successCount,
      errors: progress.errorCount,
      info,
    };

    this.runtime.sendMessage(message);
  }

  sendCompletion(statistics: DownloadStatistics): void {
    const message: DownloadCompleteMessage = {
      action: MessageAction.DOWNLOAD_COMPLETE,
      success: statistics.successfulDownloads,
      errors: statistics.failedDownloads,
    };

    this.runtime.sendMessage(message);
  }

  sendError(error: string): void {
    const message: DownloadErrorMessage = {
      action: MessageAction.DOWNLOAD_ERROR,
      error,
    };

    this.runtime.sendMessage(message);
  }
}
