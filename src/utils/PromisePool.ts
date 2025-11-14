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

export interface PromisePoolTask<T> {
  execute: () => Promise<T>;
  onStart?: () => void;
  onComplete?: (result: T) => void;
  onError?: (error: unknown) => void;
}

export interface PromisePoolResult<T> {
  success: T[];
  errors: Array<{ error: unknown; taskIndex: number }>;
}

export class PromisePool<T> {
  private readonly concurrencyLimit: number;
  private runningCount = 0;
  private taskQueue: Array<PromisePoolTask<T> & { index: number }> = [];
  private results: T[] = [];
  private errors: Array<{ error: unknown; taskIndex: number }> = [];
  private resolveAll?: (result: PromisePoolResult<T>) => void;

  constructor(concurrencyLimit: number = 5) {
    this.concurrencyLimit = Math.max(1, concurrencyLimit);
  }

  async execute(tasks: PromisePoolTask<T>[]): Promise<PromisePoolResult<T>> {
    this.taskQueue = tasks.map((task, index) => ({ ...task, index }));
    this.results = [];
    this.errors = [];
    this.runningCount = 0;

    return new Promise((resolve) => {
      this.resolveAll = resolve;

      this.processNextBatch();
    });
  }

  private processNextBatch(): void {
    while (this.runningCount < this.concurrencyLimit && this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (task) {
        this.runTask(task);
      }
    }

    if (this.runningCount === 0 && this.taskQueue.length === 0) {
      this.resolveAll?.({
        success: this.results,
        errors: this.errors,
      });
    }
  }

  private async runTask(task: PromisePoolTask<T> & { index: number }): Promise<void> {
    this.runningCount++;

    try {
      task.onStart?.();
      const result = await task.execute();
      this.results.push(result);
      task.onComplete?.(result);
    } catch (error) {
      this.errors.push({ error, taskIndex: task.index });
      task.onError?.(error);
    } finally {
      this.runningCount--;
      this.processNextBatch();
    }
  }
}
