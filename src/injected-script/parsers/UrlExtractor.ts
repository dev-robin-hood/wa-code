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

const JS_EXTENSION = '.js';

const URL_PATTERNS = [
  /https?:\\?\/\\?\/[^\s"')<]+\.js(?:\?[^\s"')<]*)?/gi,
  /"(\\?\/[^\s"]+\.js(?:\?[^\s"]*)?)"/g,
  /'(\\?\/[^\s']+\.js(?:\?[^\s']*)?)'/g,
];

export class UrlExtractor {
  extractFromText(content: string): string[] {
    const extractedUrls = new Set<string>();

    URL_PATTERNS.forEach((pattern) => {
      const matches = content.matchAll(pattern);

      for (const match of matches) {
        let rawUrl = match[1] || match[0];

        if (!rawUrl || rawUrl.length < 5) {
          continue;
        }

        rawUrl = this.unescapeUrl(rawUrl);
        const fullUrl = this.buildFullUrl(rawUrl);

        if (fullUrl.endsWith(JS_EXTENSION)) {
          extractedUrls.add(fullUrl);
        }
      }
    });

    return Array.from(extractedUrls);
  }

  private unescapeUrl(url: string): string {
    return url.replace(/\\\//g, '/');
  }

  private buildFullUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }

    if (url.startsWith('/')) {
      return 'https://web.whatsapp.com' + url;
    }

    return 'https://web.whatsapp.com/' + url;
  }
}
