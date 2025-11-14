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

export class InjectedButton {
  private button: HTMLButtonElement | null = null;
  private readonly onClick: () => void;

  constructor(onClick: () => void) {
    this.onClick = onClick;
  }

  inject(): void {
    if (this.button) {
      return;
    }

    this.button = this.createButton();
    this.attachToPage();
  }

  remove(): void {
    if (this.button && this.button.parentNode) {
      this.button.parentNode.removeChild(this.button);
      this.button = null;
    }
  }

  private createButton(): HTMLButtonElement {
    const button = document.createElement('button');

    button.textContent = 'wa-code';
    button.title = 'Open wa-code resource downloader';

    Object.assign(button.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: '999999',
      padding: '12px 18px',
      backgroundColor: '#4CAF79',
      color: '#ffffff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      letterSpacing: '0.3px',
    });

    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#3D8F61';
      button.style.transform = 'translateY(-2px)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = '#4CAF79';
      button.style.transform = 'translateY(0)';
    });

    button.addEventListener('click', () => {
      this.onClick();
    });

    return button;
  }

  private attachToPage(): void {
    if (!this.button) {
      return;
    }

    document.body.appendChild(this.button);
  }
}
