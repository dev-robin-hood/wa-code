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

import { IMessageBroker } from '../interfaces/IMessageBroker.js';
import { DownloadProgress, DownloadStatistics } from '../types/download.js';
import { FileStatus } from '../types/messages.js';

export class OptionsMessageBroker implements IMessageBroker {
  constructor(
    private readonly onFileStatus: (url: string, filename: string, status: FileStatus) => void,
    private readonly onProgress: (current: number, total: number, success: number, errors: number, info: string) => void,
    private readonly onComplete: (message: string, type: 'success' | 'error') => void,
    private readonly onError: (message: string) => void
  ) {}

  sendFileStatus(url: string, filename: string, status: FileStatus): void {
    this.onFileStatus(url, filename, status);
  }

  sendProgress(progress: DownloadProgress, info: string): void {
    this.onProgress(
      progress.current,
      progress.total,
      progress.successCount,
      progress.errorCount,
      info
    );
  }

  sendCompletion(statistics: DownloadStatistics): void {
    const message = `Complete: ${statistics.successfulDownloads} files, ${statistics.failedDownloads} errors`;
    this.onComplete(message, statistics.successfulDownloads > 0 ? 'success' : 'error');
  }

  sendError(error: string): void {
    this.onError(error);
  }
}
