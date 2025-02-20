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
import {ListJobsComponent} from './pages/list-jobs/list-jobs.component';
import {MatCardModule} from '@angular/material/card';
import {ListModuleManagerJobsComponent} from './pages/list-module-manager-jobs/list.component';
import {ListUsersComponent} from './pages/list-users/list-users.component';
import {RegisterComponent} from './pages/add-account/register.component';
import {EditAccountComponent} from './pages/edit-account/edit-account.component';
import {ListAppsComponent} from './pages/list-apps/list-apps.component';
import {ServicesComponent} from "./pages/services/services.component";
import {NativeLogComponent} from "./pages/services/native-log/native-log.component";
import {LogsComponent} from "../container/pages/logs/logs.component";

const routes: Routes = [
  {
    path: 'core',
    children: [
      {path: 'services', children: [
          {path: '', component: ServicesComponent},
          {path: 'container-logs/:containerId', component: LogsComponent},
          {path: 'native-logs/:log_id', component: NativeLogComponent},
        ]
      },
      {
        path: 'jobs', children: [
          {path: 'core-manager', component: ListJobsComponent},
          {path: 'module-manager', component: ListModuleManagerJobsComponent},
        ]
      },
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
      {path: '', redirectTo: 'services', pathMatch: 'full'}
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
    ListJobsComponent,
    ListModuleManagerJobsComponent,
    ListUsersComponent,
    RegisterComponent,
    EditAccountComponent,
    ListAppsComponent,
  ]
})
export class CoreServicesModule {
}
