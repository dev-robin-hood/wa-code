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

type NotificationState = 'loading' | 'success' | 'error';

interface StateConfig {
  background: string;
  borderColor: string;
  textColor: string;
  closable: boolean;
}

const STATE_CONFIGS: Record<NotificationState, StateConfig> = {
  loading: {
    background: '#2D3B44',
    borderColor: '#3D4B54',
    textColor: '#B3C9E6',
    closable: false,
  },
  success: {
    background: '#2D4438',
    borderColor: '#3D5848',
    textColor: '#B3E6CC',
    closable: true,
  },
  error: {
    background: '#442D2D',
    borderColor: '#543D3D',
    textColor: '#E6B3B3',
    closable: true,
  },
};

export class ScanNotification {
  private notification: HTMLDivElement | null = null;
  private contentContainer: HTMLDivElement | null = null;
  private style: HTMLStyleElement | null = null;

  showLoading(): void {
    this.createOrTransition('loading', 'Scanning resources...');
  }

  showSuccess(resourceCount: number, onDownloadClick: () => void): void {
    this.createOrTransition(
      'success',
      `${resourceCount} resources detected`,
      onDownloadClick,
    );
  }

  showError(message: string): void {
    this.createOrTransition('error', message);
  }

  private createOrTransition(
    state: NotificationState,
    message: string,
    onDownloadClick?: () => void,
  ): void {
    if (this.notification && this.contentContainer) {
      this.transitionToState(state, message, onDownloadClick);
    } else {
      this.create(state, message, onDownloadClick);
    }
  }

  private create(
    state: NotificationState,
    message: string,
    onDownloadClick?: () => void,
  ): void {
    const config = STATE_CONFIGS[state];

    this.notification = document.createElement('div');
    this.notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${config.background};
      color: ${config.textColor};
      padding: 16px;
      border-radius: 8px;
      border: 1px solid ${config.borderColor};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 999999;
      animation: slideIn 0.3s ease-out;
      line-height: 1.5;
      min-width: 280px;
      transition: background 0.3s ease, border-color 0.3s ease, color 0.3s ease;
    `;

    this.contentContainer = document.createElement('div');
    this.notification.appendChild(this.contentContainer);

    this.updateContent(state, message, onDownloadClick);

    if (!this.style) {
      this.style = this.createStyle();
      document.head.appendChild(this.style);
    }

    document.body.appendChild(this.notification);
  }

  private transitionToState(
    state: NotificationState,
    message: string,
    onDownloadClick?: () => void,
  ): void {
    if (!this.notification || !this.contentContainer) return;

    const config = STATE_CONFIGS[state];

    this.contentContainer.style.opacity = '0';
    this.contentContainer.style.transform = 'scale(0.95)';

    setTimeout(() => {
      this.notification!.style.background = config.background;
      this.notification!.style.borderColor = config.borderColor;
      this.notification!.style.color = config.textColor;

      this.updateContent(state, message, onDownloadClick);

      requestAnimationFrame(() => {
        if (this.contentContainer) {
          this.contentContainer.style.opacity = '1';
          this.contentContainer.style.transform = 'scale(1)';
        }
      });
    }, 200);
  }

  private updateContent(
    state: NotificationState,
    message: string,
    onDownloadClick?: () => void,
  ): void {
    if (!this.contentContainer) return;

    this.contentContainer.innerHTML = '';
    this.contentContainer.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

    const header = this.createHeader(state, message);
    this.contentContainer.appendChild(header);

    if (state === 'success' && onDownloadClick) {
      const downloadButton = this.createDownloadButton(onDownloadClick);
      this.contentContainer.appendChild(downloadButton);
    }
  }

  private createHeader(state: NotificationState, message: string): HTMLDivElement {
    const config = STATE_CONFIGS[state];
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      ${state === 'success' ? 'margin-bottom: 12px;' : ''}
    `;

    const titleContainer = document.createElement('div');
    titleContainer.style.cssText = 'display: flex; align-items: center; gap: 10px;';

    if (state === 'loading') {
      const spinner = this.createSpinner();
      titleContainer.appendChild(spinner);
    }

    const title = document.createElement('div');
    title.style.cssText = 'font-weight: 600;';
    title.textContent = message;
    titleContainer.appendChild(title);

    header.appendChild(titleContainer);

    if (config.closable) {
      const closeButton = this.createCloseButton();
      header.appendChild(closeButton);
    }

    return header;
  }

  private createSpinner(): HTMLDivElement {
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 16px;
      height: 16px;
      border: 2px solid rgba(179, 201, 230, 0.3);
      border-top-color: #B3C9E6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      flex-shrink: 0;
    `;
    return spinner;
  }

  private createCloseButton(): HTMLButtonElement {
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      background: transparent;
      border: none;
      color: inherit;
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
      @keyframes spin {
        to {
          transform: rotate(360deg);
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
      this.contentContainer = null;
      this.style = null;
    }, 300);
  }
}
