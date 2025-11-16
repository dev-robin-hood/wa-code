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

import { ScanPipeline } from './ScanPipeline.js';
import { BootloaderExtraction } from '../stages/extraction/BootloaderExtraction.js';
import { ServiceWorkerExtraction } from '../stages/extraction/ServiceWorkerExtraction.js';
import { InlineScriptExtraction } from '../stages/extraction/InlineScriptExtraction.js';
import { FixedResourcesExtraction } from '../stages/extraction/FixedResourcesExtraction.js';
import { StabilizationStage } from '../stages/processing/StabilizationStage.js';
import { DeduplicationStage } from '../stages/processing/DeduplicationStage.js';
import { ValidationStage } from '../stages/processing/ValidationStage.js';

export class PipelineFactory {
  createBootloaderPipeline(): ScanPipeline {
    const extraction = new BootloaderExtraction();
    const stabilization = new StabilizationStage(extraction, { delayMs: 3000, maxRetries: 10 });

    return new ScanPipeline([stabilization, new DeduplicationStage()]);
  }

  createServiceWorkerPipeline(): ScanPipeline {
    return new ScanPipeline([new ServiceWorkerExtraction(), new DeduplicationStage()]);
  }

  createInlineScriptPipeline(): ScanPipeline {
    const extraction = new InlineScriptExtraction();
    const stabilization = new StabilizationStage(extraction, { delayMs: 3000, maxRetries: 10 });

    return new ScanPipeline([stabilization, new DeduplicationStage(), new ValidationStage()]);
  }

  createFixedResourcesPipeline(): ScanPipeline {
    return new ScanPipeline([new FixedResourcesExtraction()]);
  }
}
