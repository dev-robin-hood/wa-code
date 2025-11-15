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

import { IScanContextData } from '../../core/types/scanning.js';

export class ScanContext implements IScanContextData {
  constructor(
    public readonly urls: string[] = [],
    public readonly metadata: Record<string, unknown> = {}
  ) {}

  withUrls(urls: string[]): ScanContext {
    return new ScanContext(urls, this.metadata);
  }

  withMetadata(key: string, value: unknown): ScanContext {
    return new ScanContext(this.urls, { ...this.metadata, [key]: value });
  }

  mergeUrls(newUrls: string[]): ScanContext {
    return new ScanContext([...this.urls, ...newUrls], this.metadata);
  }
}
