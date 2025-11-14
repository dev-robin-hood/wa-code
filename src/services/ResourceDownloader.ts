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

import { DownloadResult, DownloadError } from '../types/download.js';
import { IResourceDownloader } from '../interfaces/IResourceDownloader.js';

export class ResourceDownloader implements IResourceDownloader {
  private readonly filenameRegistry = new Map<string, number>();

  async download(url: string): Promise<DownloadResult> {
    this.validateUrl(url);

    const response = await this.fetchResource(url);
    const blob = await response.blob();
    const filename = this.generateUniqueFilename(url);

    return { blob, filename };
  }

  private validateUrl(url: string): void {
    try {
      new URL(url);
    } catch {
      throw new DownloadError(`Invalid URL format: ${url}`, url);
    }
  }

  private async fetchResource(url: string): Promise<Response> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new DownloadError(
        `HTTP ${response.status}: ${response.statusText}`,
        url,
        response.status
      );
    }

    return response;
  }

  private generateUniqueFilename(url: string): string {
    const urlObject = new URL(url);
    const pathSegments = urlObject.pathname.split('/');
    const baseFilename = pathSegments[pathSegments.length - 1] || 'resource.js';

    const queryHash = this.createQueryHash(urlObject.searchParams);
    const filenameWithHash = queryHash
      ? `${this.removeExtension(baseFilename)}-${queryHash}.js`
      : baseFilename;

    return this.ensureUniqueness(filenameWithHash);
  }

  private createQueryHash(searchParams: URLSearchParams): string {
    const queryString = searchParams.toString();
    return queryString ? queryString.substring(0, 16) : '';
  }

  private removeExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.js');
    return lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
  }

  private ensureUniqueness(filename: string): string {
    const count = this.filenameRegistry.get(filename) ?? 0;
    this.filenameRegistry.set(filename, count + 1);

    if (count === 0) {
      return filename;
    }

    const extension = '.js';
    const baseName = this.removeExtension(filename);
    return `${baseName}_${count + 1}${extension}`;
  }
}
