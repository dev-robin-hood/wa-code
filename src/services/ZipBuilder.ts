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

import { DownloadResult } from '../types/download.js';
import { IZipBuilder } from '../interfaces/IZipBuilder.js';
import { IZipLibrary } from '../interfaces/IZipLibrary.js';

export class ZipBuilder implements IZipBuilder {
  private static readonly COMPRESSION_LEVEL = 9 as const;

  constructor(private readonly zipLibrary: IZipLibrary) {}

  addFile(result: DownloadResult): void {
    this.zipLibrary.file(result.filename, result.blob);
  }

  async build(): Promise<Blob> {
    return await this.zipLibrary.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: ZipBuilder.COMPRESSION_LEVEL,
      },
    });
  }

  static generateFilename(): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `whatsapp-resources-${timestamp}.zip`;
  }
}
