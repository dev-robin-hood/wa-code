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

import { IScanStage } from '../IScanStage.js';
import { ScanContext } from '../ScanContext.js';
import { UrlExtractor } from '../../parsers/UrlExtractor.js';

const SW_URL = 'https://web.whatsapp.com/sw.js';

export class ServiceWorkerExtraction implements IScanStage {
  private readonly urlExtractor = new UrlExtractor();

  async execute(context: ScanContext): Promise<ScanContext> {
    try {
      const response = await fetch(SW_URL);

      if (!response.ok) {
        throw new Error(`Failed to fetch sw.js: HTTP ${response.status}`);
      }

      const content = await response.text();
      const urls = this.urlExtractor.extractFromText(content);

      return context.mergeUrls(urls);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[ServiceWorkerExtraction] Failed: ${message}`);
      throw new Error(`Service Worker extraction failed: ${message}`);
    }
  }
}
