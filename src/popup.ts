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

import { MessageAction, PopupMessage, StartDownloadMessage } from './types/messages.js';

class PopupController {
  private readonly statusElement: HTMLElement;
  private readonly statusTextElement: HTMLElement;
  private readonly downloadButton: HTMLButtonElement;
  private readonly progressElement: HTMLElement;
  private readonly progressFillElement: HTMLElement;
  private readonly totalCountElement: HTMLElement;
  private readonly successCountElement: HTMLElement;
  private readonly errorCountElement: HTMLElement;
  private readonly infoElement: HTMLElement;

  constructor() {
    this.statusElement = this.getElement('status');
    this.statusTextElement = this.getElement('statusText');
    this.downloadButton = this.getElement('downloadBtn') as HTMLButtonElement;
    this.progressElement = this.getElement('progress');
    this.progressFillElement = this.getElement('progressFill');
    this.totalCountElement = this.getElement('totalCount');
    this.successCountElement = this.getElement('successCount');
    this.errorCountElement = this.getElement('errorCount');
    this.infoElement = this.getElement('info');

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
    await this.checkWhatsAppTab();
    this.setupEventListeners();
  }

  private async checkWhatsAppTab(): Promise<void> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url?.includes('web.whatsapp.com')) {
      this.setErrorState('Please open WhatsApp Web first');
      this.downloadButton.disabled = true;
      return;
    }

    this.setReadyState('Ready to download resources');
    this.downloadButton.disabled = false;
  }

  private setupEventListeners(): void {
    this.downloadButton.addEventListener('click', () => this.handleDownloadClick());
    chrome.runtime.onMessage.addListener((message: PopupMessage) => this.handleMessage(message));
  }

  private async handleDownloadClick(): Promise<void> {
    this.downloadButton.disabled = true;
    this.progressElement.classList.add('active');
    this.infoElement.textContent = 'Initializing download...';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      this.setErrorState('Unable to identify active tab');
      this.resetUI();
      return;
    }

    const message: StartDownloadMessage = {
      action: MessageAction.START_DOWNLOAD,
    };

    chrome.tabs.sendMessage(tab.id, message, () => {
      if (chrome.runtime.lastError) {
        this.setErrorState(chrome.runtime.lastError.message || 'Connection error');
        this.resetUI();
      }
    });
  }

  private handleMessage(message: PopupMessage): void {
    switch (message.action) {
      case MessageAction.UPDATE_PROGRESS:
        this.updateProgress(message.current, message.total);
        this.updateStats(message.total, message.success, message.errors);
        this.infoElement.textContent = message.info;
        break;

      case MessageAction.DOWNLOAD_COMPLETE:
        this.setReadyState('Download complete');
        this.infoElement.textContent = `${message.success} files downloaded, ${message.errors} errors`;
        this.downloadButton.disabled = false;
        setTimeout(() => this.progressElement.classList.remove('active'), 3000);
        break;

      case MessageAction.DOWNLOAD_ERROR:
        this.setErrorState(message.error);
        this.resetUI();
        break;
    }
  }

  private updateProgress(current: number, total: number): void {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    this.progressFillElement.style.width = `${percentage}%`;
    this.progressFillElement.textContent = `${percentage}%`;
  }

  private updateStats(total: number, success: number, errors: number): void {
    this.totalCountElement.textContent = String(total);
    this.successCountElement.textContent = String(success);
    this.errorCountElement.textContent = String(errors);
  }

  private setReadyState(message: string): void {
    this.statusElement.className = 'status ready';
    this.statusTextElement.textContent = message;
  }

  private setErrorState(message: string): void {
    this.statusElement.className = 'status error';
    this.statusTextElement.textContent = `Error: ${message}`;
  }

  private resetUI(): void {
    this.downloadButton.disabled = false;
    this.progressElement.classList.remove('active');
  }
}

new PopupController();
