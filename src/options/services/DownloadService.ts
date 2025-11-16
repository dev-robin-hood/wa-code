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

import { WorkerPoolManager } from '../../core/workers/WorkerPoolManager.js';
import { JSZipFactory } from '../../core/adapters/JSZipAdapter.js';
import { WorkerCodeFormatter } from '../../core/services/WorkerCodeFormatter.js';
import { OptionsMessageBroker } from '../../core/services/OptionsMessageBroker.js';
import { ResourceDownloader } from '../../core/services/ResourceDownloader.js';
import { ZipBuilder } from '../../core/services/ZipBuilder.js';
import { DownloadOrchestrator } from '../../core/orchestrators/DownloadOrchestrator.js';
import { IResourceScanner } from '../../core/interfaces/IResourceScanner.js';
import { DEFAULT_FORMATTING_OPTIONS } from '../../core/types/formatting.js';
import type { FileStatus } from '../components/FileList.js';
import type { StatusType } from '../components/StatusDisplay.js';

export interface DownloadCallbacks {
  onFileStatusUpdate: (url: string, filename: string, status: FileStatus) => void;
  onProgressUpdate: (current: number, total: number, success: number, errors: number, info: string) => void;
  onStatusMessage: (message: string, type: StatusType) => void;
  onError: (error: string) => void;
}

export class DownloadService {
  private workerPool: WorkerPoolManager | null = null;

  constructor() {
    this.initializeWorkerPool();
  }

  async execute(scannedUrls: string[], shouldFormat: boolean, callbacks: DownloadCallbacks): Promise<void> {
    if (scannedUrls.length === 0) {
      callbacks.onError('No resources to download');
      return;
    }

    if (!this.workerPool) {
      callbacks.onError('Worker pool not initialized');
      return;
    }

    const codeFormatter = new WorkerCodeFormatter(this.workerPool);
    const zipFactory = new JSZipFactory();
    const zip = zipFactory.create();
    const zipBuilder = new ZipBuilder(zip);

    const messageBroker = new OptionsMessageBroker(
      callbacks.onFileStatusUpdate,
      callbacks.onProgressUpdate,
      callbacks.onStatusMessage,
      callbacks.onError
    );

    const scanner: IResourceScanner = {
      scan: () => scannedUrls,
    };

    const downloader = new ResourceDownloader(codeFormatter);

    const formattingOptions = {
      ...DEFAULT_FORMATTING_OPTIONS,
      enabled: shouldFormat,
    };

    const orchestrator = new DownloadOrchestrator(
      scanner,
      downloader,
      zipBuilder,
      messageBroker,
      formattingOptions.enabled
    );

    await orchestrator.execute();
  }

  dispose(): void {
    if (this.workerPool) {
      this.workerPool = null;
    }
  }

  private initializeWorkerPool(): void {
    try {
      const workerCount = Math.min(30, navigator.hardwareConcurrency || 8);
      this.workerPool = new WorkerPoolManager(workerCount);
      console.log(`Worker pool initialized with ${workerCount} workers`);
    } catch (error) {
      console.error('Failed to initialize worker pool:', error);
      throw error;
    }
  }
}
