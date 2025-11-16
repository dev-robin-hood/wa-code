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

export interface ProgressStats {
  current: number;
  total: number;
  success: number;
  errors: number;
}

export class ProgressBar {
  private readonly container: HTMLElement;
  private readonly progressFill: HTMLElement;
  private readonly totalCount: HTMLElement;
  private readonly successCount: HTMLElement;
  private readonly errorCount: HTMLElement;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Progress container with id "${containerId}" not found`);
    }
    this.container = container;

    this.progressFill = this.getRequiredElement('progressFill');
    this.totalCount = this.getRequiredElement('totalCount');
    this.successCount = this.getRequiredElement('successCount');
    this.errorCount = this.getRequiredElement('errorCount');
  }

  private getRequiredElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Required element with id "${id}" not found`);
    }
    return element;
  }

  show(): void {
    this.container.classList.add('active');
  }

  hide(): void {
    this.container.classList.remove('active');
  }

  update(stats: ProgressStats): void {
    const percentage = stats.total > 0 ? Math.round((stats.current / stats.total) * 100) : 0;
    this.progressFill.style.width = `${percentage}%`;

    this.totalCount.textContent = String(stats.total);
    this.successCount.textContent = String(stats.success);
    this.errorCount.textContent = String(stats.errors);
  }

  reset(): void {
    this.update({ current: 0, total: 0, success: 0, errors: 0 });
  }
}
