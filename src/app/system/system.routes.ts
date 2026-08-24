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

import {Routes} from '@angular/router';
import {ListUsersComponent} from './pages/list-users/list-users.component';
import {RegisterComponent} from './pages/add-account/register.component';
import {EditAccountComponent} from './pages/edit-account/edit-account.component';
import {ListAppsComponent} from './pages/list-apps/list-apps.component';
import {ServicesComponent} from './pages/services/services.component';
import {NativeLogComponent} from './pages/services/native-log/native-log.component';
import {LogsComponent} from '../container/pages/logs/logs.component';
import {JobsComponent} from './pages/jobs/jobs.component';
import {ConfigurationComponent} from './pages/configuration/configuration.component';

export const routes: Routes = [
  {
    path: 'system',
    children: [
      {
        path: 'status',
        children: [
          {path: '', component: ServicesComponent},
          {path: 'container-logs/:containerId', component: LogsComponent},
          {path: 'native-logs/:log_id', component: NativeLogComponent},
        ],
      },
      {path: 'jobs', component: JobsComponent},
      {path: 'configuration', component: ConfigurationComponent},
      {
        path: 'accounts',
        children: [
          {path: 'add', component: RegisterComponent},
          {
            path: 'users',
            children: [
              {path: '', component: ListUsersComponent},
              {path: ':id/edit', component: EditAccountComponent},
            ],
          },
          {path: 'apps', component: ListAppsComponent},
        ],
      },
      {path: '', redirectTo: 'status', pathMatch: 'full'},
    ],
  },
];
