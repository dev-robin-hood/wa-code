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

import { ScanCoordinator } from './ScanCoordinator.js';
import { Logger } from '../core/services/Logger.js';

interface ScanRequest {
  type: 'WA_CODE_SCAN_REQUEST';
  includeStatic?: boolean;
}

interface ScanResponseSuccess {
  type: 'WA_CODE_SCAN_RESPONSE';
  success: true;
  urls: string[];
}

interface ScanResponseError {
  type: 'WA_CODE_SCAN_RESPONSE';
  success: false;
  error: string;
}

const coordinator = new ScanCoordinator();
const logger = new Logger('InjectedScript');

window.addEventListener('message', async (event: MessageEvent<ScanRequest>) => {
  if (event.source !== window || event.data.type !== 'WA_CODE_SCAN_REQUEST') {
    return;
  }

  const includeStatic = event.data.includeStatic ?? true;

  logger.debug(`Received scan request (includeStatic: ${includeStatic})`);

  try {
    const urls = await coordinator.scanAll(includeStatic);
    const response: ScanResponseSuccess = {
      type: 'WA_CODE_SCAN_RESPONSE',
      success: true,
      urls,
    };
    window.postMessage(response, '*');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ScanResponseError = {
      type: 'WA_CODE_SCAN_RESPONSE',
      success: false,
      error: errorMessage,
    };
    window.postMessage(response, '*');
  }
});

logger.info('Page script loaded and ready');

window.postMessage({ type: 'WA_CODE_INJECTED_READY' }, '*');
