/// <reference types="@angular/localize" />

import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {registerAppLocale} from './app/core/locale';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {AuthCheckInterceptor} from './app/core/services/auth/interceptor/auth.interceptor';
import {environment} from './environments/environment';
import {ErrorHandler, LOCALE_ID, importProvidersFrom, provideZoneChangeDetection} from '@angular/core';
import {createErrorHandler} from '@sentry/angular';
import {initTelemetry} from './app/core/services/telemetry/telemetry';
import {MAT_ICON_DEFAULT_OPTIONS} from '@angular/material/icon';
import {BrowserModule, bootstrapApplication} from '@angular/platform-browser';
import {MatIconModule} from '@angular/material/icon';
import {AppRoutingModule} from './app/app-routing.module';
import {provideAnimations} from '@angular/platform-browser/animations';
import {DeploymentsModule} from './app/deployments/deployments.module';
import {ContainerModule} from './app/container/container.module';
import {ModulesModule} from './app/modules/modules.module';
import {SecretsModule} from './app/secrets/secrets.module';
import {CoreServicesModule} from './app/system/core-services.module';
import {AuthModule} from './app/auth/auth.module';
import {AppComponent} from './app/app.component';

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
    importProvidersFrom(
      BrowserModule,
      MatIconModule,
      AppRoutingModule,
      DeploymentsModule,
      ContainerModule,
      ModulesModule,
      SecretsModule,
      CoreServicesModule,
      AuthModule,
    ),
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
  ],
}).catch((err) => console.error(err));
