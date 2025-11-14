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

import { WorkerPoolManager } from './workers/WorkerPoolManager.js';
import { MessageAction, ScanResourcesMessage } from './types/messages.js';
import { JSZipFactory } from './adapters/JSZipAdapter.js';
import { truncateFilename } from './utils/stringUtils.js';
import { WorkerCodeFormatter } from './services/WorkerCodeFormatter.js';
import { OptionsMessageBroker } from './services/OptionsMessageBroker.js';
import { PreferencesManager } from './services/PreferencesManager.js';
import { ResourceDownloader } from './services/ResourceDownloader.js';
import { ZipBuilder } from './services/ZipBuilder.js';
import { DownloadOrchestrator } from './orchestrators/DownloadOrchestrator.js';
import { IResourceScanner } from './interfaces/IResourceScanner.js';
import { DEFAULT_FORMATTING_OPTIONS } from './types/formatting.js';

interface FileItem {
  url: string;
  filename: string;
  status: 'downloading' | 'formatting' | 'done' | 'failed';
  element: HTMLElement;
}

class OptionsController {
  private readonly scanBtn: HTMLButtonElement;
  private readonly downloadBtn: HTMLButtonElement;
  private readonly formatCheckbox: HTMLInputElement;
  private readonly statusElement: HTMLElement;
  private readonly progressContainer: HTMLElement;
  private readonly progressFill: HTMLElement;
  private readonly totalCount: HTMLElement;
  private readonly successCount: HTMLElement;
  private readonly errorCount: HTMLElement;
  private readonly fileList: HTMLElement;

  private workerPool: WorkerPoolManager | null = null;
  private scannedUrls: string[] = [];
  private fileItems: Map<string, FileItem> = new Map();
  private readonly preferencesManager = new PreferencesManager();

  constructor() {
    this.scanBtn = this.getElement('scanBtn') as HTMLButtonElement;
    this.downloadBtn = this.getElement('downloadBtn') as HTMLButtonElement;
    this.formatCheckbox = this.getElement('formatCheckbox') as HTMLInputElement;
    this.statusElement = this.getElement('status');
    this.progressContainer = this.getElement('progressContainer');
    this.progressFill = this.getElement('progressFill');
    this.totalCount = this.getElement('totalCount');
    this.successCount = this.getElement('successCount');
    this.errorCount = this.getElement('errorCount');
    this.fileList = this.getElement('fileList');

    this.initialize();
  }

  private getElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Required element with id "${id}" not found`);
    }
    return element;
  }

  private async initialize(): Promise<void> {
    this.scanBtn.addEventListener('click', () => this.handleScan());
    this.downloadBtn.addEventListener('click', () => this.handleDownload());

    const preferences = await this.preferencesManager.getFormattingPreferences();
    this.formatCheckbox.checked = preferences.shouldFormat;

    this.formatCheckbox.addEventListener('change', async () => {
      await this.preferencesManager.setFormattingPreferences({
        shouldFormat: this.formatCheckbox.checked,
      });
    });

    this.initializeWorkerPool();
    await this.checkPendingUrls();
  }

  private async checkPendingUrls(): Promise<void> {
    const result = await chrome.storage.session.get('pendingUrls');

    if (result.pendingUrls && Array.isArray(result.pendingUrls)) {
      this.scannedUrls = result.pendingUrls;
      await chrome.storage.session.remove('pendingUrls');

      this.downloadBtn.disabled = false;
      this.showStatus(
        `Found ${this.scannedUrls.length} JavaScript resources from WhatsApp Web`,
        'success'
      );
    }
  }

  private initializeWorkerPool(): void {
    try {
      const workerCount = Math.min(30, navigator.hardwareConcurrency || 8);
      this.workerPool = new WorkerPoolManager(workerCount);
      console.log(`Worker pool initialized with ${workerCount} workers`);
    } catch (error) {
      console.error('Failed to initialize worker pool:', error);
      this.showStatus('Worker pool initialization failed', 'error');
    }
  }

  private async handleScan(): Promise<void> {
    this.scanBtn.disabled = true;
    this.showStatus('Scanning for JavaScript resources...', 'info');

    try {
      const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });

      if (tabs.length === 0) {
        this.showStatus(
          'Please open WhatsApp Web in a tab first',
          'error'
        );
        this.scanBtn.disabled = false;
        return;
      }

      const whatsappTab = tabs[0];

      if (!whatsappTab.id) {
        this.showStatus('Unable to identify WhatsApp tab', 'error');
        this.scanBtn.disabled = false;
        return;
      }

      const message: ScanResourcesMessage = {
        action: MessageAction.SCAN_RESOURCES,
      };

      try {
        const response = await chrome.tabs.sendMessage(whatsappTab.id, message);

        if (response && response.urls) {
          this.scannedUrls = response.urls;
          this.downloadBtn.disabled = false;
          this.showStatus(
            `Found ${this.scannedUrls.length} JavaScript resources`,
            'success'
          );
        } else {
          this.showStatus('No resources found', 'error');
        }
      } catch (messageError) {
        console.error('Message error:', messageError);
        this.showStatus(
          'Extension not loaded on WhatsApp Web. Please refresh the WhatsApp Web page and try again.',
          'error'
        );
      }
    } catch (error) {
      console.error('Scan failed:', error);
      this.showStatus(
        error instanceof Error ? error.message : 'Scan failed',
        'error'
      );
    } finally {
      this.scanBtn.disabled = false;
    }
  }

  private async handleDownload(): Promise<void> {
    if (this.scannedUrls.length === 0) {
      this.showStatus('No resources to download', 'error');
      return;
    }

    this.downloadBtn.disabled = true;
    this.scanBtn.disabled = true;
    this.progressContainer.classList.add('active');
    this.fileList.classList.add('active');
    this.fileItems.clear();
    this.fileList.innerHTML = '';

    if (!this.workerPool) {
      this.showStatus('Worker pool not initialized', 'error');
      this.downloadBtn.disabled = false;
      this.scanBtn.disabled = false;
      return;
    }

    const preferences = await this.preferencesManager.getFormattingPreferences();

    const codeFormatter = new WorkerCodeFormatter(this.workerPool);
    const zipFactory = new JSZipFactory();
    const zip = zipFactory.create();
    const zipBuilder = new ZipBuilder(zip);

    const messageBroker = new OptionsMessageBroker(
      this.updateFileStatus.bind(this),
      this.updateProgressFromOrchestrator.bind(this),
      this.showStatus.bind(this),
      (error) => this.showStatus(error, 'error')
    );

    const scanner: IResourceScanner = {
      scan: () => this.scannedUrls,
    };

    const downloader = new ResourceDownloader(codeFormatter);

    const formattingOptions = {
      ...DEFAULT_FORMATTING_OPTIONS,
      enabled: preferences.shouldFormat,
    };

    const orchestrator = new DownloadOrchestrator(
      scanner,
      downloader,
      zipBuilder,
      messageBroker,
      formattingOptions.enabled
    );

    try {
      await orchestrator.execute();
    } catch (error) {
      console.error('Download failed:', error);
      this.showStatus(
        error instanceof Error ? error.message : 'Download failed',
        'error'
      );
    } finally {
      this.downloadBtn.disabled = false;
      this.scanBtn.disabled = false;
    }
  }

  private updateProgressFromOrchestrator(
    current: number,
    total: number,
    success: number,
    errors: number,
    info: string
  ): void {
    this.updateProgress(current, total, success, errors);
    this.showStatus(info, 'info');
  }

  private updateFileStatus(
    url: string,
    filename: string,
    status: 'downloading' | 'formatting' | 'done' | 'failed'
  ): void {
    let fileItem = this.fileItems.get(url);

    if (!fileItem) {
      const element = this.createFileElement(filename, status);
      this.fileList.appendChild(element);

      fileItem = { url, filename, status, element };
      this.fileItems.set(url, fileItem);
    } else {
      fileItem.status = status;
      this.updateFileElement(fileItem.element, status);
    }

    this.scrollToBottom();
  }

  private createFileElement(
    filename: string,
    status: string
  ): HTMLElement {
    const item = document.createElement('div');
    item.className = 'file-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'file-name';
    nameSpan.textContent = truncateFilename(filename);
    nameSpan.title = filename;

    const statusSpan = document.createElement('span');
    statusSpan.className = `file-status ${status}`;
    statusSpan.textContent = this.getStatusLabel(status);

    item.appendChild(nameSpan);
    item.appendChild(statusSpan);

    return item;
  }

  private updateFileElement(element: HTMLElement, status: string): void {
    const statusSpan = element.querySelector('.file-status');
    if (statusSpan) {
      statusSpan.className = `file-status ${status}`;
      statusSpan.textContent = this.getStatusLabel(status);
    }
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      downloading: 'Downloading',
      formatting: 'Formatting',
      done: 'Done',
      failed: 'Failed',
    };
    return labels[status] || status;
  }

  private scrollToBottom(): void {
    this.fileList.scrollTop = this.fileList.scrollHeight;
  }

  private updateProgress(
    current: number,
    total: number,
    success: number,
    errors: number
  ): void {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    this.progressFill.style.width = `${percentage}%`;

    this.totalCount.textContent = String(total);
    this.successCount.textContent = String(success);
    this.errorCount.textContent = String(errors);
  }

  private showStatus(message: string, type: 'info' | 'success' | 'error'): void {
    this.statusElement.textContent = message;
    this.statusElement.className = `status ${type} active`;
  }
}

new OptionsController();
