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

const TARGET_HOST = 'https://static.whatsapp.net/rsrc.php';
const JS_EXTENSION = '.js';

export class ValidationStage implements IScanStage {
  async execute(context: ScanContext): Promise<ScanContext> {
    const blacklistedUrls = this.getBlacklistedUrls(context);
    const blacklistSet = new Set(blacklistedUrls);

    const validUrls = context.urls.filter(
      (url) => this.isValidJavaScriptResource(url) && !blacklistSet.has(url)
    );

    return context.withUrls(validUrls);
  }

  private isValidJavaScriptResource(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    return url.startsWith(TARGET_HOST) && url.includes(JS_EXTENSION);
  }

  private getBlacklistedUrls(context: ScanContext): string[] {
    const blacklisted = context.metadata['blacklistedUrls'];

    if (!blacklisted || !Array.isArray(blacklisted)) {
      return [];
    }

    return blacklisted as string[];
  }
}
