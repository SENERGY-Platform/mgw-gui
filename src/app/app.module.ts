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
    ModulesModule,
    MatSidenavModule,
    SecretsModule,
    HttpClientModule
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
      'provide': LOCALE_ID, 
      'useValue': 'de-DE' 
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {
    registerLocaleData(localeDe)
  }
 }
