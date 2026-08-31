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
import {ListComponent} from './pages/list/list.component';
import {ManageComponent} from './pages/manage/manage.component';
import {GlobalConfigsComponent} from './pages/global-configs/global-configs.component';
import {RepositoriesComponent} from './pages/repositories/repositories.component';
import {InfoComponent} from './pages/info/info.component';
import {LogsComponent} from '../container/pages/logs/logs.component';

export const routes: Routes = [
  {
    path: 'resources/global-configs',
    component: GlobalConfigsComponent,
  },
  {
    path: 'modules',
    children: [
      {path: '', component: ListComponent},
      {path: 'catalog', component: ManageComponent},
      {path: 'repositories', component: RepositoriesComponent},
      // ahead of 'detail/:id' so the longer path wins; the logs page reads
      // the module id from here to find its way back
      {path: 'detail/:id/containers/:containerId/logs', component: LogsComponent},
      {path: 'detail/:id', component: InfoComponent},
      // the detail page used to live under /info
      {path: 'info/:id', redirectTo: 'detail/:id'},
    ],
  },
];
