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

const EVAL_WORKER_PATTERN = /"evalWorkerURL"\s*:\s*"([^"]+)"/gi;

export class DynamicScriptDetector {
  private blacklistedUrls: Set<string> = new Set();

  extractBlacklistedUrls(jsonContent: string): void {
    const matches = jsonContent.matchAll(EVAL_WORKER_PATTERN);

    for (const match of matches) {
      const rawUrl = match[1];

      if (!rawUrl || rawUrl.length < 5) {
        continue;
      }

      const normalizedUrl = this.normalizeUrl(rawUrl);
      this.blacklistedUrls.add(normalizedUrl);
    }
  }

  isBlacklisted(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const normalizedUrl = this.normalizeUrl(url);
    return this.blacklistedUrls.has(normalizedUrl);
  }

  getBlacklistedUrls(): string[] {
    return Array.from(this.blacklistedUrls);
  }

  clear(): void {
    this.blacklistedUrls.clear();
  }

  private normalizeUrl(url: string): string {
    const unescaped = url.replace(/\\\//g, '/');

    if (unescaped.startsWith('http')) {
      return unescaped;
    }

    if (unescaped.startsWith('/')) {
      return 'https://web.whatsapp.com' + unescaped;
    }

    return 'https://web.whatsapp.com/' + unescaped;
  }
}
