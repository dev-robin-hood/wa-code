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

import { IScanStage } from '../stages/IScanStage.js';
import { ScanContext } from '../stages/ScanContext.js';

export class ScanPipeline {
  constructor(private readonly stages: IScanStage[]) {}

  async execute(): Promise<string[]> {
    let context = new ScanContext();

    for (const stage of this.stages) {
      context = await stage.execute(context);
    }

    return context.urls;
  }
}
