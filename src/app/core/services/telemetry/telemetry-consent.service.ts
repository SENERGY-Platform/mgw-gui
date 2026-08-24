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

import {Injectable, Signal} from '@angular/core';
import {TELEMETRY_LEVEL_OPTIONS, TelemetryLevel, TelemetryLevelOption, telemetryConsent} from './telemetry-consent';

/**
 * Components' way to the consent level.
 *
 * Holds no state of its own: the same level has to be readable from main.ts,
 * before an injector exists, so it lives in the module singleton this
 * delegates to.
 */
@Injectable({providedIn: 'root'})
export class TelemetryConsentService {
  readonly options: readonly TelemetryLevelOption[] = TELEMETRY_LEVEL_OPTIONS;
  readonly level: Signal<TelemetryLevel> = telemetryConsent.level;
  readonly answered: Signal<boolean> = telemetryConsent.answered;

  set(level: TelemetryLevel) {
    telemetryConsent.set(level);
  }

  option(level: TelemetryLevel): TelemetryLevelOption {
    // The list covers every value the type allows, so this cannot miss.
    return this.options.find((option) => option.level === level) as TelemetryLevelOption;
  }
}
