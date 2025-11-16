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

import { OptionsController } from './OptionsController.js';
import { ControlPanel } from './components/ControlPanel.js';
import { ProgressBar } from './components/ProgressBar.js';
import { FileList } from './components/FileList.js';
import { StatusDisplay } from './components/StatusDisplay.js';
import { ResourceStateService } from './services/ResourceStateService.js';
import { DownloadService } from './services/DownloadService.js';
import { PreferencesManager } from '../core/services/PreferencesManager.js';

async function main(): Promise<void> {
  try {
    const resourceStateService = new ResourceStateService();
    const downloadService = new DownloadService();
    const preferencesManager = new PreferencesManager();
    const progressBar = new ProgressBar('progressContainer');
    const fileList = new FileList('fileList');
    const statusDisplay = new StatusDisplay('status');

    const controller = new OptionsController(
      null as any,
      progressBar,
      fileList,
      statusDisplay,
      resourceStateService,
      downloadService,
      preferencesManager
    );

    const controlPanel = new ControlPanel({
      onDownload: () => controller.handleDownload(),
      onFormatToggle: (enabled) => controller.handleFormatToggle(enabled),
    });

    (controller as any).controlPanel = controlPanel;

    await controller.initialize();
  } catch (error) {
    console.error('Failed to initialize options page:', error);
  }
}

main();
