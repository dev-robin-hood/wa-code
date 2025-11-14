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

import { ICodeFormatter } from '../interfaces/ICodeFormatter.js';
import { FormattingOptions } from '../types/formatting.js';
import { WorkerPoolManager } from '../workers/WorkerPoolManager.js';
import { PrettierOptions } from '../types/worker.js';

export class WorkerCodeFormatter implements ICodeFormatter {
  constructor(private readonly workerPool: WorkerPoolManager) {}

  async format(code: string, options: FormattingOptions): Promise<string> {
    if (!options.enabled) {
      return code;
    }

    const prettierOptions: PrettierOptions = {
      parser: 'babel',
      printWidth: 100,
      tabWidth: options.indentSize,
      useTabs: options.useTabs,
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      bracketSpacing: true,
      arrowParens: 'always',
    };

    return await this.workerPool.format(code, prettierOptions);
  }

  dispose(): void {
    this.workerPool.terminate();
  }
}
