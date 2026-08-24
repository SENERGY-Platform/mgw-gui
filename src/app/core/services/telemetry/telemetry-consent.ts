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

import {Signal, computed, signal} from '@angular/core';

/**
 * How much may leave the browser. Every step includes the ones below it, so a
 * numeric comparison is all a caller ever needs.
 */
export type TelemetryLevel = 0 | 1 | 2;

export interface TelemetryLevelOption {
  readonly level: TelemetryLevel;
  /** Stable name for the level, used in the dialog markup and in tests. */
  readonly id: 'none' | 'errors' | 'errors-replay';
  readonly label: string;
  readonly description: string;
}

export const TELEMETRY_LEVEL_OPTIONS: readonly TelemetryLevelOption[] = [
  {
    level: 0,
    id: 'none',
    label: 'Off',
    description: 'Nothing is collected.',
  },
  {
    level: 1,
    id: 'errors',
    label: 'Error reports',
    description: 'Error reports and logs are collected.',
  },
  {
    level: 2,
    id: 'errors-replay',
    label: 'Error reports with session replay',
    description: 'Additionally a recording of the session when an error occurs.',
  },
];

const STORAGE_KEY = 'mgw-telemetry-consent';

interface ConsentState {
  readonly level: TelemetryLevel;
  /** False until the question has been answered; the answer may well be 0. */
  readonly answered: boolean;
}

const UNANSWERED: ConsentState = {level: 0, answered: false};

/**
 * The consent level, kept in localStorage.
 *
 * Whether the question has been answered is not a second key: a stored, valid
 * level *is* the answer. Recording the two separately is what strands a client
 * that dismissed the dialog - the "asked" flag is set, no level is, and from
 * then on the level reads as 0 and the dialog is never shown again. Deriving
 * one from the other makes that state unreachable rather than something to
 * repair afterwards.
 *
 * Anything else under the key - a value from an older format, a hand-edited
 * one - counts as unanswered rather than as consent, so the level is 0 and the
 * question is asked again.
 */
export class TelemetryConsent {
  private readonly state = signal<ConsentState>(read());
  private readonly listeners = new Set<(level: TelemetryLevel) => void>();

  readonly level: Signal<TelemetryLevel> = computed(() => this.state().level);
  readonly answered: Signal<boolean> = computed(() => this.state().answered);

  set(level: TelemetryLevel) {
    this.state.set({level, answered: true});
    try {
      localStorage.setItem(STORAGE_KEY, String(level));
    } catch {
      // private mode or storage disabled: the choice just does not survive a reload
    }
    for (const listener of this.listeners) {
      listener(level);
    }
  }

  /**
   * Puts the store back into the state a browser that was never asked is in:
   * nothing stored, level 0, and the question still open.
   *
   * Exists for the test suite. The instance below is shared by every spec in
   * the run and Jasmine orders them randomly, so a spec that answers the
   * question has to be able to unanswer it - otherwise it decides for whatever
   * spec happens to follow whether the consent dialog is still due.
   */
  reset() {
    this.state.set(UNANSWERED);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // nothing was stored either way
    }
    for (const listener of this.listeners) {
      listener(UNANSWERED.level);
    }
  }

  /**
   * Runs `listener` after every change. Returns the function that undoes it.
   *
   * A signal effect would need an injection context, and the one caller that
   * has to react - the Sentry setup - runs before the application injector
   * exists.
   */
  onChange(listener: (level: TelemetryLevel) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

function read(): ConsentState {
  let stored: string | null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    // private mode or storage disabled: nothing was ever answered here
    return UNANSWERED;
  }

  // Matched exactly rather than parsed. parseInt('1 and a half') is 1, and a
  // value nobody wrote must never read as consent.
  switch (stored) {
    case '0':
      return {level: 0, answered: true};
    case '1':
      return {level: 1, answered: true};
    case '2':
      return {level: 2, answered: true};
    default:
      return UNANSWERED;
  }
}

/**
 * The instance everything shares.
 *
 * Not an Angular service, because the Sentry setup reads the level before
 * bootstrapApplication has built an injector, and reads it again on every
 * event afterwards. TelemetryConsentService is the injectable face of this
 * same object for components.
 *
 * localStorage is synchronous, so the level is known from the first line of
 * main.ts. An asynchronous store would force the SDK either to wait for it -
 * leaving startup errors unmonitored - or to buffer the first event until the
 * answer arrives; neither is needed here.
 */
export const telemetryConsent = new TelemetryConsent();
