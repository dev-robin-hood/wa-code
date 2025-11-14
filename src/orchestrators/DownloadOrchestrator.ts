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

import { IResourceScanner } from '../interfaces/IResourceScanner.js';
import { IResourceDownloader } from '../interfaces/IResourceDownloader.js';
import { IZipBuilder } from '../interfaces/IZipBuilder.js';
import { IMessageBroker } from '../interfaces/IMessageBroker.js';
import { DownloadError, DownloadProgress } from '../types/download.js';

export class DownloadOrchestrator {
  constructor(
    private readonly scanner: IResourceScanner,
    private readonly downloader: IResourceDownloader,
    private readonly zipBuilder: IZipBuilder,
    private readonly messageBroker: IMessageBroker
  ) {}

  async execute(): Promise<void> {
    try {
      await this.performDownload();
    } catch (error) {
      this.handleError(error);
    }
  }

  private async performDownload(): Promise<void> {
    this.messageBroker.sendProgress(
      { current: 0, total: 0, successCount: 0, errorCount: 0 },
      'Scanning for JavaScript resources...'
    );

    const resources = this.scanner.scan();
    const total = resources.length;

    let successCount = 0;
    let errorCount = 0;

    for (let index = 0; index < resources.length; index++) {
      const url = resources[index];

      try {
        const result = await this.downloader.download(url);
        this.zipBuilder.addFile(result);
        successCount++;

        this.reportProgress({
          current: index + 1,
          total,
          successCount,
          errorCount,
          info: `Downloaded: ${result.filename}`,
        });
      } catch (error) {
        errorCount++;

        this.reportProgress({
          current: index + 1,
          total,
          successCount,
          errorCount,
          info: `Failed: ${this.extractFilenameFromUrl(url)}`,
        });
      }
    }

    await this.finalizeDownload(total, successCount, errorCount);
  }

  private async finalizeDownload(
    total: number,
    successCount: number,
    errorCount: number
  ): Promise<void> {
    this.reportProgress({
      current: total,
      total,
      successCount,
      errorCount,
      info: 'Creating ZIP archive...',
    });

    const zipBlob = await this.zipBuilder.build();
    this.triggerBrowserDownload(zipBlob);

    this.messageBroker.sendCompletion({
      totalResources: total,
      successfulDownloads: successCount,
      failedDownloads: errorCount,
    });
  }

  private reportProgress(progress: DownloadProgress & { info: string }): void {
    this.messageBroker.sendProgress(
      {
        current: progress.current,
        total: progress.total,
        successCount: progress.successCount,
        errorCount: progress.errorCount,
      },
      progress.info
    );
  }

  private triggerBrowserDownload(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `whatsapp-resources-${this.getCurrentDate()}.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private extractFilenameFromUrl(url: string): string {
    try {
      const urlObject = new URL(url);
      const pathSegments = urlObject.pathname.split('/');
      return pathSegments[pathSegments.length - 1] || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private handleError(error: unknown): void {
    const errorMessage =
      error instanceof DownloadError
        ? error.message
        : error instanceof Error
        ? error.message
        : 'An unexpected error occurred during download';

    this.messageBroker.sendError(errorMessage);
  }
}
