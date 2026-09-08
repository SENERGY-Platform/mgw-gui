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

import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {registerAppLocale} from './app/core/locale';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {AuthCheckInterceptor} from './app/core/services/auth/interceptor/auth.interceptor';
import {environment} from './environments/environment';
import {
  ErrorHandler,
  LOCALE_ID,
  importProvidersFrom,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import {createErrorHandler} from '@sentry/angular';
import {initTelemetry} from './app/core/services/telemetry/telemetry';
import {MAT_ICON_DEFAULT_OPTIONS} from '@angular/material/icon';
import {BrowserModule, bootstrapApplication} from '@angular/platform-browser';
import {MatIconModule} from '@angular/material/icon';
import {provideRouter} from '@angular/router';
import {routes} from './app/app.routes';
import {provideAnimations} from '@angular/platform-browser/animations';
import {AppComponent} from './app/app.component';
import {provideTransloco} from '@jsverse/transloco';
import {AVAILABLE_LANGS, LanguageService} from './app/core/services/language/language.service';
import {TranslocoHttpLoader} from './app/core/services/language/transloco-http.loader';

// Before bootstrap, so an error thrown while the application starts is still
// seen. Does nothing at all when the environment carries no DSN, and sends
// nothing until the consent level allows it.
// Before anything renders: LOCALE_ID below is 'de', and only en-US is
// compiled in. A date pipe reached without this throws NG0701.
registerAppLocale();

initTelemetry();

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    {
      // Displaces nothing: the application's ErrorService is not an
      // ErrorHandler but a service the pages call themselves for failed
      // requests, and it keeps running unchanged. What this replaces is
      // Angular's stock handler for uncaught errors, whose console output it
      // reproduces (logErrors defaults to true) before reporting them.
      provide: ErrorHandler,
      useValue: createErrorHandler(),
    },
    importProvidersFrom(BrowserModule, MatIconModule),
    provideRouter(routes),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthCheckInterceptor,
      multi: true,
    },
    {
      provide: 'ModuleManagerService',
      useClass: environment.moduleManagerService,
    },
    {
      provide: 'SecretManagerService',
      useClass: environment.secretManagerService,
    },
    {
      provide: 'HostManagerService',
      useClass: environment.hostManagerService,
    },
    {
      provide: 'CoreManagerService',
      useClass: environment.coreManagerService,
    },
    {
      provide: 'ContainerEngineManagerService',
      useClass: environment.containerEngineManagerService,
    },
    {
      provide: LOCALE_ID,
      useValue: 'de',
    },
    {
      // Material Symbols carries the same ligature names as the legacy
      // Material Icons font, so every existing <mat-icon> keeps working.
      provide: MAT_ICON_DEFAULT_OPTIONS,
      useValue: {fontSet: 'material-symbols-rounded'},
    },
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    provideTransloco({
      config: {
        availableLangs: [...AVAILABLE_LANGS],
        defaultLang: AVAILABLE_LANGS[0],
        fallbackLang: AVAILABLE_LANGS[0],
        // Each area loads its own scope on demand (see the per-scope files
        // under src/assets/i18n); nothing is translated outside of a scope,
        // so re-rendering on a language change only has scopes already in
        // use to redo.
        reRenderOnLangChange: true,
        prodMode: environment.production,
      },
      loader: TranslocoHttpLoader,
    }),
    // Constructs LanguageService before the first frame: it applies the
    // stored (or default) language to <html lang> and to Transloco's active
    // language itself, so nothing renders in the wrong language for a tick
    // and then flips.
    provideAppInitializer(() => {
      inject(LanguageService);
    }),
  ],
}).catch((err) => console.error(err));
