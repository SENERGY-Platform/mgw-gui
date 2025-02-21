import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatTableModule} from '@angular/material/table';
import {MatCheckboxModule} from '@angular/material/checkbox';

import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatCardModule} from '@angular/material/card';
import {ListUsersComponent} from './pages/list-users/list-users.component';
import {RegisterComponent} from './pages/add-account/register.component';
import {EditAccountComponent} from './pages/edit-account/edit-account.component';
import {ListAppsComponent} from './pages/list-apps/list-apps.component';
import {ServicesComponent} from "./pages/services/services.component";
import {NativeLogComponent} from "./pages/services/native-log/native-log.component";
import {LogsComponent} from "../container/pages/logs/logs.component";
import {JobsComponent} from "./pages/jobs/jobs.component";
import {ConfigurationComponent} from "./pages/configuration/configuration.component";
import {DeveloperComponent} from "./pages/developer/developer.component";

const routes: Routes = [
  {
    path: 'system',
    children: [
      {path: 'status', children: [
          {path: '', component: ServicesComponent},
          {path: 'container-logs/:containerId', component: LogsComponent},
          {path: 'native-logs/:log_id', component: NativeLogComponent},
        ]
      },
      {path: 'jobs', component: JobsComponent},
      {path: 'configuration', component: ConfigurationComponent},
      {
        path: 'accounts',
        children: [
          {path: 'add', component: RegisterComponent},
          {
            path: 'users', children: [
              {path: '', component: ListUsersComponent},
              {path: ':id/edit', component: EditAccountComponent}
            ]
          },
          {path: 'apps', component: ListAppsComponent}
        ]
      },
      {path: 'developer', component: DeveloperComponent},
      {path: '', redirectTo: 'status', pathMatch: 'full'}
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTableModule,
    RouterModule.forChild(routes),
    ListUsersComponent,
    RegisterComponent,
    EditAccountComponent,
    ListAppsComponent,
    JobsComponent,
    ConfigurationComponent,
    DeveloperComponent,
  ]
})
export class CoreServicesModule {
}
