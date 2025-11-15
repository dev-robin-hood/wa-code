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
import { StabilizationConfig, DEFAULT_STABILIZATION_CONFIG } from '../../../core/types/scanning.js';

export class StabilizationStage implements IScanStage {
  private readonly previousStage: IScanStage;
  private readonly config: StabilizationConfig;

  constructor(previousStage: IScanStage, config?: Partial<StabilizationConfig>) {
    this.previousStage = previousStage;
    this.config = { ...DEFAULT_STABILIZATION_CONFIG, ...config };
  }

  async execute(context: ScanContext): Promise<ScanContext> {
    let previousCount = -1;
    let retryCount = 0;

    while (retryCount < this.config.maxRetries) {
      const result = await this.previousStage.execute(context);
      const currentCount = result.urls.length;

      if (currentCount === previousCount) {
        return result;
      }

      previousCount = currentCount;
      retryCount++;

      if (retryCount < this.config.maxRetries) {
        await this.sleep(this.config.delayMs);
      }
    }

    throw new Error(`Stabilization failed after ${this.config.maxRetries} retries`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
