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

export interface FormattingOptions {
  readonly enabled: boolean;
  readonly indentSize: number;
  readonly useTabs: boolean;
}

export const DEFAULT_FORMATTING_OPTIONS: FormattingOptions = {
  enabled: false,
  indentSize: 2,
  useTabs: false,
} as const;

export interface FormattingPreferences {
  readonly shouldFormat: boolean;
}

export const STORAGE_KEY_FORMATTING = 'formattingPreferences' as const;
