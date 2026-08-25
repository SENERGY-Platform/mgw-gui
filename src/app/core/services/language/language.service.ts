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

import {Injectable, inject, signal} from '@angular/core';
import {TranslocoService} from '@jsverse/transloco';

const STORAGE_KEY = 'mgw-language';

/**
 * Every language the interface can currently be switched to. English stays
 * first and is what a fresh install and every unrecognised stored value
 * fall back to.
 *
 * A second entry here is the one change that makes a language switcher make
 * sense: components that offer one (see LanguageSwitchComponent) show it only
 * once this array holds more than one language, so nothing has to be flipped
 * on by hand once real translations exist.
 */
export const AVAILABLE_LANGS: readonly string[] = ['en'];

/**
 * Drives the interface language, the same way ThemeService drives the
 * colour scheme: a signal for components to read, a choice persisted to
 * localStorage under an `mgw-` key, applied once at construction and again
 * on every explicit change.
 *
 * The actual translating is Transloco's job; this only decides which
 * language is active and keeps `<html lang>` in agreement with it, which
 * Transloco itself has no opinion on.
 */
@Injectable({providedIn: 'root'})
export class LanguageService {
  readonly availableLangs = AVAILABLE_LANGS;
  readonly lang = signal<string>(AVAILABLE_LANGS[0]);

  private readonly transloco = inject(TranslocoService);

  constructor() {
    this.apply(this.read());
  }

  set(lang: string) {
    // Silently ignored rather than throwing: a stray call with a language
    // that has since been removed should not be able to crash a caller.
    if (!this.availableLangs.includes(lang)) return;
    this.apply(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // private mode or storage disabled: the choice just does not survive a reload
    }
  }

  private read(): string {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && this.availableLangs.includes(stored)) {
        return stored;
      }
    } catch {
      // private mode or storage disabled: nothing was ever chosen here
    }
    return AVAILABLE_LANGS[0];
  }

  private apply(lang: string) {
    this.lang.set(lang);
    this.transloco.setActiveLang(lang);
    document.documentElement.lang = lang;
  }
}
