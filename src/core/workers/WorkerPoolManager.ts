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

import {
  WorkerTask,
  WorkerRequest,
  WorkerResponse,
  PrettierOptions,
  WORKER_TIMEOUT_MS,
  DEFAULT_WORKER_POOL_SIZE,
  MAX_WORKER_POOL_SIZE,
} from '../types/worker.js';

export class WorkerPoolManager {
  private readonly workers: Worker[] = [];
  private readonly availableWorkers: Set<Worker> = new Set();
  private readonly taskQueue: Omit<WorkerTask, 'taskId' | 'timeoutId'>[] = [];
  private readonly activeTasks: Map<string, WorkerTask> = new Map();
  private taskIdCounter = 0;
  private isTerminated = false;

  constructor(poolSize: number = DEFAULT_WORKER_POOL_SIZE) {
    const validatedSize = this.validatePoolSize(poolSize);
    this.initializeWorkers(validatedSize);
  }

  async format(code: string, options: PrettierOptions): Promise<string> {
    if (this.isTerminated) {
      throw new Error('WorkerPoolManager has been terminated');
    }

    return new Promise<string>((resolve, reject) => {
      const task = { code, options, resolve, reject };

      if (this.availableWorkers.size > 0) {
        this.executeTask(task);
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  terminate(): void {
    if (this.isTerminated) {
      return;
    }

    this.isTerminated = true;

    this.activeTasks.forEach((task) => {
      clearTimeout(task.timeoutId);
      task.reject(new Error('Worker pool terminated'));
    });
    this.activeTasks.clear();

    this.taskQueue.forEach((task) => {
      task.reject(new Error('Worker pool terminated'));
    });
    this.taskQueue.length = 0;

    this.workers.forEach((worker) => worker.terminate());
    this.workers.length = 0;
    this.availableWorkers.clear();
  }

  private validatePoolSize(poolSize: number): number {
    const cores = navigator.hardwareConcurrency || 8;
    const requested = Math.max(1, Math.min(MAX_WORKER_POOL_SIZE, poolSize));

    return Math.min(requested, cores);
  }

  private initializeWorkers(poolSize: number): void {
    for (let i = 0; i < poolSize; i++) {
      const worker = this.createWorker();
      this.workers.push(worker);
      this.availableWorkers.add(worker);
    }
  }

  private createWorker(): Worker {
    const worker = new Worker(
      new URL('./prettier.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      this.handleWorkerMessage(worker, event.data);
    };

    worker.onerror = (error: ErrorEvent) => {
      this.handleWorkerError(worker, error);
    };

    return worker;
  }

  private executeTask(
    task: Omit<WorkerTask, 'taskId' | 'timeoutId'>
  ): void {
    const worker = this.getAvailableWorker();
    if (!worker) {
      this.taskQueue.push(task);
      return;
    }

    const taskId = this.generateTaskId();
    const timeoutId = window.setTimeout(
      () => this.handleTimeout(taskId),
      WORKER_TIMEOUT_MS
    );

    const fullTask: WorkerTask = {
      taskId,
      code: task.code,
      options: task.options,
      resolve: task.resolve,
      reject: task.reject,
      timeoutId,
    };

    this.activeTasks.set(taskId, fullTask);

    const request: WorkerRequest = {
      type: 'format',
      taskId,
      code: task.code,
      options: task.options,
    };

    worker.postMessage(request);
  }

  private getAvailableWorker(): Worker | undefined {
    const worker = this.availableWorkers.values().next().value;
    if (worker) {
      this.availableWorkers.delete(worker);
    }
    return worker;
  }

  private generateTaskId(): string {
    return `task_${++this.taskIdCounter}_${Date.now()}`;
  }

  private handleWorkerMessage(worker: Worker, response: WorkerResponse): void {
    const task = this.activeTasks.get(response.taskId);
    if (!task) {
      return;
    }

    clearTimeout(task.timeoutId);
    this.activeTasks.delete(response.taskId);

    if (response.type === 'success') {
      task.resolve(response.result);
    } else {
      task.reject(new Error(response.error));
    }

    this.releaseWorker(worker);
  }

  private handleWorkerError(worker: Worker, error: ErrorEvent): void {
    const failedTasks = this.getTasksForWorker(worker);

    failedTasks.forEach((task) => {
      clearTimeout(task.timeoutId);
      this.activeTasks.delete(task.taskId);
      task.reject(new Error(`Worker error: ${error.message}`));
    });

    this.restartWorker(worker);
  }

  private handleTimeout(taskId: string): void {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      return;
    }

    this.activeTasks.delete(taskId);
    task.reject(new Error('Format operation timed out'));

    const worker = this.findWorkerForTask(taskId);
    if (worker) {
      this.restartWorker(worker);
    }
  }

  private getTasksForWorker(_worker: Worker): WorkerTask[] {
    return Array.from(this.activeTasks.values());
  }

  private findWorkerForTask(_taskId: string): Worker | undefined {
    return this.workers.find((w) => !this.availableWorkers.has(w));
  }

  private restartWorker(oldWorker: Worker): void {
    const index = this.workers.indexOf(oldWorker);
    if (index === -1) {
      return;
    }

    this.availableWorkers.delete(oldWorker);
    oldWorker.terminate();

    const newWorker = this.createWorker();
    this.workers[index] = newWorker;
    this.availableWorkers.add(newWorker);

    this.processNextTask();
  }

  private releaseWorker(worker: Worker): void {
    this.availableWorkers.add(worker);
    this.processNextTask();
  }

  private processNextTask(): void {
    if (this.taskQueue.length === 0 || this.availableWorkers.size === 0) {
      return;
    }

    const nextTask = this.taskQueue.shift();
    if (nextTask) {
      this.executeTask(nextTask);
    }
  }
}
