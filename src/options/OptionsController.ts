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

import { ControlPanel } from './components/ControlPanel.js';
import { ProgressBar } from './components/ProgressBar.js';
import { FileList } from './components/FileList.js';
import { StatusDisplay } from './components/StatusDisplay.js';
import { ResourceStateService } from './services/ResourceStateService.js';
import { DownloadService } from './services/DownloadService.js';
import { PreferencesManager } from '../core/services/PreferencesManager.js';

export class OptionsController {
  private isDownloading = false;

  constructor(
    private readonly controlPanel: ControlPanel,
    private readonly progressBar: ProgressBar,
    private readonly fileList: FileList,
    private readonly statusDisplay: StatusDisplay,
    private readonly resourceStateService: ResourceStateService,
    private readonly downloadService: DownloadService,
    private readonly preferencesManager: PreferencesManager
  ) {}

  async initialize(): Promise<void> {
    await this.loadPreferences();
    this.setupResourceStateListener();
    await this.resourceStateService.initialize();
  }

  private async loadPreferences(): Promise<void> {
    const preferences = await this.preferencesManager.getFormattingPreferences();
    this.controlPanel.setFormatEnabled(preferences.shouldFormat);
  }

  private setupResourceStateListener(): void {
    this.resourceStateService.onStateChange(state => {
      if (state.hasResources) {
        this.controlPanel.setDownloadEnabled(true);
        this.controlPanel.showResourcesInfo(state.scannedUrls.length);
      } else {
        this.controlPanel.setDownloadEnabled(false);
        this.controlPanel.showNoResourcesWarning();
      }
    });
  }

  async handleDownload(): Promise<void> {
    if (this.isDownloading) {
      return;
    }

    const scannedUrls = this.resourceStateService.getScannedUrls();
    if (scannedUrls.length === 0) {
      this.statusDisplay.show('No resources to download', 'error');
      return;
    }

    this.isDownloading = true;
    this.controlPanel.setDownloadEnabled(false);
    this.progressBar.show();
    this.fileList.show();
    this.fileList.clear();
    this.progressBar.reset();

    const shouldFormat = this.controlPanel.getFormatEnabled();

    try {
      await this.downloadService.execute(scannedUrls, shouldFormat, {
        onFileStatusUpdate: (url, filename, status) => {
          this.fileList.updateFileStatus(url, filename, status);
        },
        onProgressUpdate: (current, total, success, errors, info) => {
          this.progressBar.update({ current, total, success, errors });
          this.statusDisplay.show(info, 'info');
        },
        onStatusMessage: (message, type) => {
          this.statusDisplay.show(message, type);
        },
        onError: (error) => {
          this.statusDisplay.show(error, 'error');
        },
      });
    } catch (error) {
      console.error('Download failed:', error);
      this.statusDisplay.show(
        error instanceof Error ? error.message : 'Download failed',
        'error'
      );
    } finally {
      this.isDownloading = false;
      this.controlPanel.setDownloadEnabled(true);
    }
  }

  async handleFormatToggle(enabled: boolean): Promise<void> {
    await this.preferencesManager.setFormattingPreferences({
      shouldFormat: enabled,
    });
  }
}
