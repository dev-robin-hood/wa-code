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

export interface ControlPanelCallbacks {
  onDownload: () => void;
  onFormatToggle: (enabled: boolean) => void;
}

export class ControlPanel {
  private readonly downloadBtn: HTMLButtonElement;
  private readonly formatCheckbox: HTMLInputElement;
  private readonly noResourcesWarning: HTMLElement;
  private readonly resourcesInfo: HTMLElement;

  constructor(callbacks: ControlPanelCallbacks) {
    this.downloadBtn = this.getRequiredElement('downloadBtn') as HTMLButtonElement;
    this.formatCheckbox = this.getRequiredElement('formatCheckbox') as HTMLInputElement;
    this.noResourcesWarning = this.getRequiredElement('noResourcesWarning');
    this.resourcesInfo = this.getRequiredElement('resourcesInfo');

    this.downloadBtn.addEventListener('click', callbacks.onDownload);
    this.formatCheckbox.addEventListener('change', () => {
      callbacks.onFormatToggle(this.formatCheckbox.checked);
    });
  }

  private getRequiredElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Required element with id "${id}" not found`);
    }
    return element;
  }

  setDownloadEnabled(enabled: boolean): void {
    this.downloadBtn.disabled = !enabled;
  }

  setFormatEnabled(enabled: boolean): void {
    this.formatCheckbox.checked = enabled;
  }

  getFormatEnabled(): boolean {
    return this.formatCheckbox.checked;
  }

  showResourcesInfo(count: number): void {
    this.noResourcesWarning.style.display = 'none';
    this.resourcesInfo.style.display = 'block';
    this.resourcesInfo.textContent = `${count} JavaScript resources ready to download`;
  }

  showNoResourcesWarning(): void {
    this.noResourcesWarning.style.display = 'block';
    this.resourcesInfo.style.display = 'none';
  }
}
