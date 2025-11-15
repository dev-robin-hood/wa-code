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

export class SuccessNotification {
  private notification: HTMLDivElement | null = null;
  private style: HTMLStyleElement | null = null;

  show(resourceCount: number, onDownloadClick: () => void): void {
    this.create(resourceCount, onDownloadClick);
  }

  private create(count: number, onDownloadClick: () => void): void {
    this.notification = document.createElement('div');
    this.notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2D4438;
      color: #B3E6CC;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #3D5848;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 999999;
      animation: slideIn 0.3s ease-out;
      line-height: 1.5;
      min-width: 280px;
    `;

    const header = this.createHeader(count);
    const downloadButton = this.createDownloadButton(onDownloadClick);

    this.notification.appendChild(header);
    this.notification.appendChild(downloadButton);

    this.style = this.createStyle();

    document.head.appendChild(this.style);
    document.body.appendChild(this.notification);
  }

  private createHeader(count: number): HTMLDivElement {
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-weight: 600;';
    title.textContent = `✓ ${count} resources detected`;

    const closeButton = this.createCloseButton();

    header.appendChild(title);
    header.appendChild(closeButton);

    return header;
  }

  private createCloseButton(): HTMLButtonElement {
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      background: transparent;
      border: none;
      color: #B3E6CC;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.7;
      transition: opacity 0.2s;
    `;
    closeButton.innerHTML = '×';
    closeButton.onmouseover = () => (closeButton.style.opacity = '1');
    closeButton.onmouseout = () => (closeButton.style.opacity = '0.7');

    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    return closeButton;
  }

  private createDownloadButton(onDownloadClick: () => void): HTMLButtonElement {
    const downloadButton = document.createElement('button');
    downloadButton.style.cssText = `
      width: 100%;
      background: #3D5848;
      color: #B3E6CC;
      border: 1px solid #4D6858;
      border-radius: 6px;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
      font-family: inherit;
    `;
    downloadButton.textContent = 'Go to Download Page';
    downloadButton.onmouseover = () => {
      downloadButton.style.background = '#4D6858';
      downloadButton.style.borderColor = '#5D7868';
    };
    downloadButton.onmouseout = () => {
      downloadButton.style.background = '#3D5848';
      downloadButton.style.borderColor = '#4D6858';
    };

    downloadButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
      setTimeout(() => {
        onDownloadClick();
      }, 300);
    });

    return downloadButton;
  }

  private createStyle(): HTMLStyleElement {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    return style;
  }

  private close(): void {
    if (!this.notification) return;

    this.notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      this.notification?.remove();
      this.style?.remove();
      this.notification = null;
      this.style = null;
    }, 300);
  }
}
