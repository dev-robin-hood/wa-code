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

export function truncateFilename(filename: string, maxLength: number = 40): string {
  if (filename.length <= maxLength) {
    return filename;
  }

  const extension = filename.lastIndexOf('.') !== -1
    ? filename.substring(filename.lastIndexOf('.'))
    : '';

  const nameWithoutExt = extension
    ? filename.substring(0, filename.lastIndexOf('.'))
    : filename;

  const availableLength = maxLength - extension.length - 3;

  if (availableLength <= 0) {
    return `...${extension}`;
  }

  const halfLength = Math.floor(availableLength / 2);
  const start = nameWithoutExt.substring(0, halfLength);
  const end = nameWithoutExt.substring(nameWithoutExt.length - halfLength);

  return `${start}...${end}${extension}`;
}
