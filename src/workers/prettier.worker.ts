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

import { format } from 'prettier/standalone';
import babelParser from 'prettier/plugins/babel';
import estreePlugin from 'prettier/plugins/estree';
import type {
  WorkerRequest,
  FormatSuccessResponse,
  FormatErrorResponse,
} from '../types/worker.js';

const plugins = [babelParser, estreePlugin];

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { type, taskId, code, options } = event.data;

  if (type !== 'format') {
    const errorResponse: FormatErrorResponse = {
      type: 'error',
      taskId,
      error: 'Invalid request type',
    };
    self.postMessage(errorResponse);
    return;
  }

  try {
    const result = await format(code, {
      ...options,
      plugins,
    });

    const successResponse: FormatSuccessResponse = {
      type: 'success',
      taskId,
      result,
    };

    self.postMessage(successResponse);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown formatting error';

    const errorResponse: FormatErrorResponse = {
      type: 'error',
      taskId,
      error: errorMessage,
    };

    self.postMessage(errorResponse);
  }
};

export {};
