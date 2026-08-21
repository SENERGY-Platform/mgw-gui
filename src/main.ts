/// <reference types="@angular/localize" />

import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {AuthCheckInterceptor} from './app/core/services/auth/interceptor/auth.interceptor';
import {environment} from './environments/environment';
import {LOCALE_ID, importProvidersFrom, provideZoneChangeDetection} from '@angular/core';
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

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
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
