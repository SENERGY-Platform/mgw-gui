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

import {ModuleWithProviders} from '@angular/core';
import {TranslocoTestingModule} from '@jsverse/transloco';
import coreEn from 'src/assets/i18n/core/en.json';
import modulesEn from 'src/assets/i18n/modules/en.json';
import containerEn from 'src/assets/i18n/container/en.json';
import developerEn from 'src/assets/i18n/developer/en.json';
import deploymentsEn from 'src/assets/i18n/deployments/en.json';
import secretsEn from 'src/assets/i18n/secrets/en.json';
import authEn from 'src/assets/i18n/auth/en.json';
import overviewEn from 'src/assets/i18n/overview/en.json';
import systemEn from 'src/assets/i18n/system/en.json';

/**
 * The real translation file for every scope a spec can ask for, keyed the
 * same way Transloco itself keys a loaded scope: "<scope>/en". Importing the
 * actual asset rather than hand-writing fixture text means a spec exercises
 * the same strings production renders, and a renamed or removed key breaks
 * the spec instead of silently drifting from it.
 *
 * Add one entry here per scope as it gains its own translation file - see
 * the "Mehrsprachigkeit" section of the project README for the convention.
 */
const SCOPED_TRANSLATIONS: Readonly<Record<string, object>> = {
  'auth/en': authEn,
  'core/en': coreEn,
  'container/en': containerEn,
  'deployments/en': deploymentsEn,
  'developer/en': developerEn,
  'modules/en': modulesEn,
  'overview/en': overviewEn,
  'secrets/en': secretsEn,
  'system/en': systemEn,
};

/**
 * Configures Transloco for a spec that renders a component carrying
 * `provideTranslocoScope(...)` for one or more of the scopes named here.
 * Translations resolve synchronously (TranslocoTestingModule's loader is a
 * plain `of(...)`), so a single `fixture.detectChanges()` is enough - no
 * `whenStable()` or extra tick needed for the translated text to appear.
 */
export function provideTranslocoTesting(...scopes: string[]): ModuleWithProviders<TranslocoTestingModule> {
  const langs: Record<string, object> = {};
  for (const scope of scopes) {
    const key = `${scope}/en`;
    const translation = SCOPED_TRANSLATIONS[key];
    if (!translation) {
      throw new Error(`provideTranslocoTesting: no translations registered for scope "${scope}"`);
    }
    langs[key] = translation;
  }
  return TranslocoTestingModule.forRoot({
    langs,
    translocoConfig: {availableLangs: ['en'], defaultLang: 'en'},
  });
}
