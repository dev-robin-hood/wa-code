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

import { truncateFilename } from '../../core/utils/stringUtils.js';

export type FileStatus = 'downloading' | 'formatting' | 'done' | 'failed';

interface FileItem {
  url: string;
  filename: string;
  status: FileStatus;
  element: HTMLElement;
}

export class FileList {
  private readonly container: HTMLElement;
  private readonly fileItems = new Map<string, FileItem>();

  private readonly statusLabels: Record<FileStatus, string> = {
    downloading: 'Downloading',
    formatting: 'Formatting',
    done: 'Done',
    failed: 'Failed',
  };

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`File list container with id "${containerId}" not found`);
    }
    this.container = container;
  }

  show(): void {
    this.container.classList.add('active');
  }

  hide(): void {
    this.container.classList.remove('active');
  }

  clear(): void {
    this.container.innerHTML = '';
    this.fileItems.clear();
  }

  updateFileStatus(url: string, filename: string, status: FileStatus): void {
    let fileItem = this.fileItems.get(url);

    if (!fileItem) {
      const element = this.createFileElement(filename, status);
      this.container.appendChild(element);

      fileItem = { url, filename, status, element };
      this.fileItems.set(url, fileItem);
    } else {
      fileItem.status = status;
      this.updateFileElement(fileItem.element, status);
    }

    this.scrollToBottom();
  }

  private createFileElement(filename: string, status: FileStatus): HTMLElement {
    const item = document.createElement('div');
    item.className = 'file-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'file-name';
    nameSpan.textContent = truncateFilename(filename);
    nameSpan.title = filename;

    const statusSpan = document.createElement('span');
    statusSpan.className = `file-status ${status}`;
    statusSpan.textContent = this.statusLabels[status];

    item.appendChild(nameSpan);
    item.appendChild(statusSpan);

    return item;
  }

  private updateFileElement(element: HTMLElement, status: FileStatus): void {
    const statusSpan = element.querySelector('.file-status');
    if (statusSpan) {
      statusSpan.className = `file-status ${status}`;
      statusSpan.textContent = this.statusLabels[status];
    }
  }

  private scrollToBottom(): void {
    this.container.scrollTop = this.container.scrollHeight;
  }
}
