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

import {HttpClient} from '@angular/common/http';
import {Injectable, inject} from '@angular/core';
import {Translation, TranslocoLoader} from '@jsverse/transloco';

/**
 * Fetches one area's translation file as a static asset.
 *
 * Transloco hands this the full path it already resolved - "core/en" for a
 * scoped area, plain "en" for an unscoped one - so appending ".json" is
 * enough to reach `assets/i18n/core/en.json`. That is also why every area
 * gets its own file under its own scope name (see the naming convention in
 * the project README): the path Transloco builds already assumes one
 * directory per scope.
 */
@Injectable({providedIn: 'root'})
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<Translation>(`assets/i18n/${lang}.json`);
  }
}
