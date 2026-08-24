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

import {TELEMETRY_LEVEL_OPTIONS, TelemetryConsent} from './telemetry-consent';

const STORAGE_KEY = 'mgw-telemetry-consent';

describe('TelemetryConsent', () => {
  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    // Storage.prototype is a shared global that outlives the spec that
    // patched it - unlike a Jasmine spy, vi.spyOn does not undo itself.
    vi.restoreAllMocks();
  });

  it('starts at level 0 and unanswered when nothing is stored', () => {
    const consent = new TelemetryConsent();

    expect(consent.level()).toBe(0);
    expect(consent.answered()).toBe(false);
  });

  it('reads back every level that was stored', () => {
    for (const level of [0, 1, 2] as const) {
      localStorage.setItem(STORAGE_KEY, String(level));

      const consent = new TelemetryConsent();
      expect(consent.level()).toBe(level);
      expect(consent.answered()).toBe(true);
    }
  });

  it('counts a stored level of 0 as an answer, not as an unasked question', () => {
    // The whole point of the second flag in other implementations. Deciding
    // "off" must retire the dialog just as deciding "on" does.
    const consent = new TelemetryConsent();
    consent.set(0);

    expect(new TelemetryConsent().answered()).toBe(true);
    expect(new TelemetryConsent().level()).toBe(0);
  });

  it('persists a chosen level', () => {
    const consent = new TelemetryConsent();
    consent.set(2);

    expect(consent.level()).toBe(2);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('2');
    expect(new TelemetryConsent().level()).toBe(2);
  });

  it('treats a value it did not write as unanswered rather than as consent', () => {
    for (const stored of ['', ' ', '3', '-1', '1.0', '1 and a half', 'true', 'null', '{"level":2}', '02']) {
      localStorage.setItem(STORAGE_KEY, stored);

      const consent = new TelemetryConsent();
      expect(consent.level(), `stored ${JSON.stringify(stored)}`).toBe(0);
      expect(consent.answered(), `stored ${JSON.stringify(stored)}`).toBe(false);
    }
  });

  it('falls back to level 0 when reading storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    const consent = new TelemetryConsent();

    expect(consent.level()).toBe(0);
    expect(consent.answered()).toBe(false);
  });

  it('keeps the chosen level for this session when writing storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const consent = new TelemetryConsent();

    expect(() => consent.set(1)).not.toThrow();
    expect(consent.level()).toBe(1);
    expect(consent.answered()).toBe(true);
  });

  it('notifies listeners of a change and stops after they unsubscribe', () => {
    const consent = new TelemetryConsent();
    const seen: number[] = [];
    const unsubscribe = consent.onChange((level) => seen.push(level));

    consent.set(2);
    consent.set(0);
    unsubscribe();
    consent.set(1);

    expect(seen).toEqual([2, 0]);
  });

  it('still notifies listeners when the write failed', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const consent = new TelemetryConsent();
    const seen: number[] = [];
    consent.onChange((level) => seen.push(level));

    consent.set(2);

    expect(seen).toEqual([2]);
  });

  it('describes every level the type allows', () => {
    expect(TELEMETRY_LEVEL_OPTIONS.map((option) => option.level)).toEqual([0, 1, 2]);
    for (const option of TELEMETRY_LEVEL_OPTIONS) {
      expect(option.label.length).toBeGreaterThan(0);
      expect(option.description.length).toBeGreaterThan(0);
    }
  });
});
