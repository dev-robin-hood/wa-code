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

import { IResourceScanner } from '../interfaces/IResourceScanner.js';

export class ResourceScanner implements IResourceScanner {
  private static readonly URL_PATTERN = 'static.whatsapp.net/rsrc.php/v4' as const;
  private static readonly JS_EXTENSION = '.js' as const;

  constructor(private readonly document: Document) {}

  scan(): ReadonlyArray<string> {
    const scriptElements = this.document.querySelectorAll<HTMLScriptElement>('script[src]');
    const scripts = Array.from(scriptElements);

    const jsResources = scripts
      .map((script) => script.src)
      .filter((url) => this.isValidJavaScriptResource(url));

    const uniqueResources = [...new Set(jsResources)];

    if (uniqueResources.length === 0) {
      throw new Error('No JavaScript resources found matching the required pattern');
    }

    return Object.freeze(uniqueResources);
  }

  private isValidJavaScriptResource(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    return (
      url.includes(ResourceScanner.URL_PATTERN) &&
      url.includes(ResourceScanner.JS_EXTENSION)
    );
  }
}
