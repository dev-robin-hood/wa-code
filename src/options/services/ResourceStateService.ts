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

export interface ResourceState {
  scannedUrls: string[];
  hasResources: boolean;
}

export type ResourceStateChangeListener = (state: ResourceState) => void;

export class ResourceStateService {
  private scannedUrls: string[] = [];
  private listeners: Set<ResourceStateChangeListener> = new Set();

  async initialize(): Promise<void> {
    await this.checkPendingUrls();
    await this.loadResourcesFromStorage();

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.scannedUrls) {
        this.loadResourcesFromStorage();
      }
    });
  }

  onStateChange(listener: ResourceStateChangeListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: ResourceStateChangeListener): void {
    this.listeners.delete(listener);
  }

  getScannedUrls(): string[] {
    return [...this.scannedUrls];
  }

  hasResources(): boolean {
    return this.scannedUrls.length > 0;
  }

  getResourceCount(): number {
    return this.scannedUrls.length;
  }

  private async loadResourcesFromStorage(): Promise<void> {
    const result = await chrome.storage.local.get('scannedUrls');

    if (result.scannedUrls && Array.isArray(result.scannedUrls) && result.scannedUrls.length > 0) {
      this.scannedUrls = result.scannedUrls;
    } else {
      this.scannedUrls = [];
    }

    this.notifyListeners();
  }

  private async checkPendingUrls(): Promise<void> {
    const result = await chrome.storage.session.get('pendingUrls');

    if (result.pendingUrls && Array.isArray(result.pendingUrls)) {
      await chrome.storage.local.set({ scannedUrls: result.pendingUrls });
      await chrome.storage.session.remove('pendingUrls');
    }
  }

  private notifyListeners(): void {
    const state: ResourceState = {
      scannedUrls: this.getScannedUrls(),
      hasResources: this.hasResources(),
    };

    this.listeners.forEach(listener => listener(state));
  }
}
