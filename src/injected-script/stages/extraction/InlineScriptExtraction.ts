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
import { DynamicScriptDetector } from '../../parsers/DynamicScriptDetector.js';

export class InlineScriptExtraction implements IScanStage {
  private readonly urlExtractor = new UrlExtractor();
  private readonly dynamicScriptDetector = new DynamicScriptDetector();

  async execute(context: ScanContext): Promise<ScanContext> {
    const scriptElements = document.querySelectorAll<HTMLScriptElement>(
      'script[type="application/json"]'
    );

    const urls: string[] = [];

    scriptElements.forEach((script) => {
      const content = script.textContent || script.innerText;

      if (!content || content.length === 0) {
        return;
      }

      this.dynamicScriptDetector.extractBlacklistedUrls(content);

      const extractedUrls = this.urlExtractor.extractFromText(content);
      urls.push(...extractedUrls);
    });

    const blacklistedUrls = this.dynamicScriptDetector.getBlacklistedUrls();

    return context.mergeUrls(urls).withMetadata('blacklistedUrls', blacklistedUrls);
  }
}
