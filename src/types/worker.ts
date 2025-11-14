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

export interface PrettierOptions {
  readonly parser: 'babel';
  readonly printWidth: number;
  readonly tabWidth: number;
  readonly useTabs: boolean;
  readonly semi: boolean;
  readonly singleQuote: boolean;
  readonly trailingComma: 'none' | 'es5' | 'all';
  readonly bracketSpacing: boolean;
  readonly arrowParens: 'always' | 'avoid';
}

export interface FormatRequest {
  readonly type: 'format';
  readonly taskId: string;
  readonly code: string;
  readonly options: PrettierOptions;
}

export interface FormatSuccessResponse {
  readonly type: 'success';
  readonly taskId: string;
  readonly result: string;
}

export interface FormatErrorResponse {
  readonly type: 'error';
  readonly taskId: string;
  readonly error: string;
}

export type WorkerRequest = FormatRequest;
export type WorkerResponse = FormatSuccessResponse | FormatErrorResponse;

export interface WorkerTask {
  readonly taskId: string;
  readonly code: string;
  readonly options: PrettierOptions;
  readonly resolve: (result: string) => void;
  readonly reject: (error: Error) => void;
  readonly timeoutId: number;
}

export const WORKER_TIMEOUT_MS = 30000;
export const DEFAULT_WORKER_POOL_SIZE = 3;
export const MAX_WORKER_POOL_SIZE = 30;
