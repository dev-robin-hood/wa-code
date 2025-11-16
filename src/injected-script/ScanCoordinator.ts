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

import { PipelineFactory } from './pipelines/PipelineFactory.js';
import { Logger } from '../core/services/Logger.js';

export class ScanCoordinator {
  private readonly pipelineFactory = new PipelineFactory();
  private readonly logger = new Logger('ScanCoordinator');

  async scanAll(includeStatic: boolean): Promise<string[]> {
    const bootloaderUrls = await this.scanBootloader();
    this.logger.info(`Bootloader: ${bootloaderUrls.length} URLs`);

    if (!includeStatic) {
      this.logger.debug('Skipping static resources (re-scan)');
      return bootloaderUrls;
    }

    const staticUrls = await this.scanStaticResources();
    this.logger.info(`Static resources: ${staticUrls.length} URLs`);

    const allUrls = [...bootloaderUrls, ...staticUrls];
    const uniqueUrls = [...new Set(allUrls)];

    const duplicatesRemoved = allUrls.length - uniqueUrls.length;
    this.logger.info(
      `Total: ${uniqueUrls.length} unique (${duplicatesRemoved} duplicates removed)`
    );

    if (uniqueUrls.length === 0) {
      throw new Error('No JavaScript resources found matching the required pattern');
    }

    return uniqueUrls;
  }

  private async scanBootloader(): Promise<string[]> {
    const pipeline = this.pipelineFactory.createBootloaderPipeline();
    return await pipeline.execute();
  }

  private async scanStaticResources(): Promise<string[]> {
    const pipelines = [
      this.pipelineFactory.createServiceWorkerPipeline(),
      this.pipelineFactory.createInlineScriptPipeline(),
      this.pipelineFactory.createFixedResourcesPipeline(),
    ];

    const results = await Promise.all(pipelines.map((p) => p.execute()));

    return results.flat();
  }
}
