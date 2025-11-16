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

export type StatusType = 'info' | 'success' | 'error';

export class StatusDisplay {
  private readonly element: HTMLElement;

  constructor(elementId: string) {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Status element with id "${elementId}" not found`);
    }
    this.element = element;
  }

  show(message: string, type: StatusType): void {
    this.element.textContent = message;
    this.element.className = `status ${type} active`;
  }

  hide(): void {
    this.element.classList.remove('active');
  }

  clear(): void {
    this.element.textContent = '';
    this.hide();
  }
}
