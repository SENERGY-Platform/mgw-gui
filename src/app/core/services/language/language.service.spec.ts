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

import {TestBed} from '@angular/core/testing';
import {TranslocoService} from '@jsverse/transloco';
import {provideTranslocoTesting} from 'src/testing/transloco-testing';
import {AVAILABLE_LANGS, LanguageService} from './language.service';

const STORAGE_KEY = 'mgw-language';

describe('LanguageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [provideTranslocoTesting()],
    });
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    // Storage.prototype is a shared global that outlives the spec that
    // patched it - unlike a Jasmine spy, vi.spyOn does not undo itself.
    vi.restoreAllMocks();
  });

  it('defaults to English when nothing is stored', () => {
    const service = TestBed.inject(LanguageService);

    expect(service.lang()).toBe('en');
    expect(TestBed.inject(TranslocoService).getActiveLang()).toBe('en');
  });

  it('sets <html lang> on construction', () => {
    document.documentElement.lang = 'zz';

    TestBed.inject(LanguageService);

    expect(document.documentElement.lang).toBe('en');
  });

  it('persists a chosen language and applies it again on the next instance', () => {
    const service = TestBed.inject(LanguageService);
    service.set('en');

    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');

    // A fresh TestBed rather than a second `new`: LanguageService reads the
    // storage key from its constructor, and TestBed only runs that once per
    // configured module.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({imports: [provideTranslocoTesting()]});
    document.documentElement.lang = 'zz';

    TestBed.inject(LanguageService);

    expect(document.documentElement.lang).toBe('en');
  });

  it('ignores a language that is not in the available list', () => {
    const service = TestBed.inject(LanguageService);

    service.set('xx');

    expect(service.lang()).toBe('en');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('falls back to the default when the stored value is not a known language', () => {
    localStorage.setItem(STORAGE_KEY, 'not-a-real-language');

    const service = TestBed.inject(LanguageService);

    expect(service.lang()).toBe(AVAILABLE_LANGS[0]);
  });

  it('does not crash when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(() => TestBed.inject(LanguageService)).not.toThrow();
    expect(TestBed.inject(LanguageService).lang()).toBe('en');
  });

  it('does not crash when localStorage.setItem throws', () => {
    const service = TestBed.inject(LanguageService);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => service.set('en')).not.toThrow();
    expect(service.lang()).toBe('en');
  });

  it('only ever lists English today', () => {
    // The point of this list existing at all: LanguageSwitchComponent hides
    // itself while it holds just one entry, and starts offering a choice the
    // day a second language is added here - see its spec.
    expect(AVAILABLE_LANGS).toEqual(['en']);
  });
});
