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

import {inject} from '@angular/core';
import {TranslocoService} from '@jsverse/transloco';

/**
 * `inject(TranslocoService)`, but tolerant of an injector that never called
 * `provideTransloco()` - returns undefined there instead of throwing.
 *
 * TranslocoService is `providedIn: 'root'`, so it always has a provider, but
 * its own dependencies (TRANSLOCO_TRANSPILER and friends) do not have a
 * default and are only registered by provideTransloco(). A plain
 * `inject(TranslocoService)` therefore throws NG0201 the moment anything
 * constructs it inside an injector that never configured Transloco - which,
 * for a `providedIn: 'root'` service reached from many unrelated feature
 * areas (ErrorService, ListEndpointsComponent), is any spec elsewhere in the
 * application that renders one of them incidentally and has no reason to
 * know about Transloco at all. `{ optional: true }` does not help: the
 * token *has* a provider, so Angular still runs its factory and that factory
 * is what throws.
 *
 * Use this instead of injecting TranslocoService directly for any message
 * that is resolved outside of a template (no `transloco` pipe to fall back
 * on) in a service or component that is not itself scoped to a single
 * feature area. Callers translate through it with a fallback to the bare
 * key - see ErrorService.translate() for the pattern.
 */
export function safeInjectTransloco(): TranslocoService | undefined {
  try {
    return inject(TranslocoService);
  } catch {
    return undefined;
  }
}
