/*
 * Copyright (c) 2026 InfAI (CC SES)
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

import {Injectable, signal} from '@angular/core';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'mgw-theme';

/**
 * Drives the colour scheme by writing to <html>: the color-scheme property is
 * what Material's light-dark() tokens resolve against, the data attribute
 * carries the same choice to the app's own status colours.
 */
@Injectable({providedIn: 'root'})
export class ThemeService {
  readonly mode = signal<ThemeMode>('system');

  constructor() {
    this.apply(this.read());
  }

  set(mode: ThemeMode) {
    this.apply(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (_) {
      // private mode or storage disabled: the choice just does not survive a reload
    }
  }

  // Cycles through the three modes so a single toolbar button is enough.
  next() {
    const order: ThemeMode[] = ['system', 'light', 'dark'];
    this.set(order[(order.indexOf(this.mode()) + 1) % order.length]);
  }

  icon(): string {
    switch (this.mode()) {
      case 'light':
        return 'light_mode';
      case 'dark':
        return 'dark_mode';
      default:
        return 'contrast';
    }
  }

  label(): string {
    switch (this.mode()) {
      case 'light':
        return 'Light theme';
      case 'dark':
        return 'Dark theme';
      default:
        return 'Follows the system setting';
    }
  }

  private read(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch (_) {
    }
    return 'system';
  }

  private apply(mode: ThemeMode) {
    this.mode.set(mode);
    const root = document.documentElement;
    if (mode === 'system') {
      root.style.colorScheme = 'light dark';
      root.removeAttribute('data-mgw-theme');
    } else {
      root.style.colorScheme = mode;
      root.setAttribute('data-mgw-theme', mode);
    }
  }
}
