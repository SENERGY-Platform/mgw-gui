/// <reference types="@angular/localize" />

import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {AuthCheckInterceptor} from './app/core/services/auth/interceptor/auth.interceptor';
import {environment} from './environments/environment';
import {LOCALE_ID, importProvidersFrom} from '@angular/core';
import {HIGHLIGHT_OPTIONS} from 'ngx-highlightjs';
import {BrowserModule, bootstrapApplication} from '@angular/platform-browser';
import {MatIconModule} from '@angular/material/icon';
import {AppRoutingModule} from './app/app-routing.module';
import {provideAnimations} from '@angular/platform-browser/animations';
import {DeploymentsModule} from './app/deployments/deployments.module';
import {ContainerModule} from './app/container/container.module';
import {ModulesModule} from './app/modules/modules.module';
import {SecretsModule} from './app/secrets/secrets.module';
import {CoreServicesModule} from './app/mgw-core/core-services.module';
import {AuthModule} from './app/auth/auth.module';
import {AppComponent} from './app/app.component';


bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserModule, MatIconModule, AppRoutingModule, DeploymentsModule, ContainerModule, ModulesModule, SecretsModule, CoreServicesModule, AuthModule),
    {
      provide: HTTP_INTERCEPTORS, useClass: AuthCheckInterceptor, multi: true
    },
    {
      'provide': 'ModuleManagerService',
      'useClass': environment.moduleManagerService
    },
    {
      'provide': 'SecretManagerService',
      'useClass': environment.secretManagerService
    },
    {
      'provide': 'HostManagerService',
      'useClass': environment.hostManagerService
    },
    {
      'provide': 'CoreManagerService',
      'useClass': environment.coreManagerService
    },
    {
      'provide': 'ContainerEngineManagerService',
      'useClass': environment.containerEngineManagerService
    },
    {
      'provide': LOCALE_ID,
      'useValue': 'de'
    },
    {
      'provide': HIGHLIGHT_OPTIONS,
      'useValue': {
        coreLibraryLoader: () => import('highlight.js/lib/core'),
        lineNumbersLoader: () => import('ngx-highlightjs/line-numbers'),
        lineNumbers: true,
        languages: {
          //typescript: () => import('highlight.js/lib/languages/typescript'),
        },
        themePath: "assets/styles/code-themes/github-dark.css"
      }
    },
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations()
  ]
})
  .catch(err => console.error(err));
