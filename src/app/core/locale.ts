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

import {registerLocaleData} from '@angular/common';
import localeDe from '@angular/common/locales/de';

/**
 * Teaches Angular the locale the application runs under.
 *
 * Only en-US is compiled in; anything else has to be handed over before a
 * pipe asks for it, or the pipe throws `NG0701: Missing locale data` and
 * takes the whole view with it. LOCALE_ID is set to 'de' in main.ts, and
 * eight date pipes across the pages depend on this having happened.
 *
 * A function rather than a side effect of importing this file, so that a
 * bundler cannot decide the import does nothing and drop it.
 */
export function registerAppLocale(): void {
  registerLocaleData(localeDe);
}
