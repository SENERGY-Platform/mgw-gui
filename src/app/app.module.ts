import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DeploymentsModule } from './deployments/deployments.module';
import {MatSidenavModule} from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { ModulesModule } from './modules/modules.module';
import { environment } from '../environments/environment';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { JobsModule } from './jobs/jobs.module';
import { SecretsModule } from './secrets/secrets.module';
import { ContainerModule } from './container/container.module';
import { HIGHLIGHT_OPTIONS } from 'ngx-highlightjs';
import { CoreModule } from './core/core.module';
import { InfoModule } from './info/info.module';
import { CoreServicesModule } from './mgw-core/core-services.module';

@NgModule({
  declarations: [
    AppComponent 
  ],
  imports: [
    BrowserModule,
    MatIconModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    DeploymentsModule,
    JobsModule,
    ContainerModule,
    ModulesModule,
    CoreModule,
    SecretsModule,
    HttpClientModule,
    InfoModule,
    CoreServicesModule
  ],
  exports: [
  ],
  providers: [
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
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {
    registerLocaleData(localeDe)
  }
 }
