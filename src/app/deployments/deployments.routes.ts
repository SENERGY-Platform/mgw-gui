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
import {ModulesComponent} from './pages/add/modules.component';
import {ShowModuleComponentComponent} from './pages/edit/show-module-component.component';
import {ListEndpointsComponent} from './pages/list-endpoints/list-endpoints.component';
import {AddEndpointComponent} from './pages/add-endpoint/add-endpoint.component';

export const routes: Routes = [
  {
    path: 'deployments',
    children: [
      {path: 'add/:id', component: ModulesComponent},
      {path: 'edit/:ids', component: ShowModuleComponentComponent},
    ],
  },
  {
    path: 'resources/endpoints',
    children: [
      {path: '', component: ListEndpointsComponent},
      {path: 'add/:id', component: AddEndpointComponent},
    ],
  },
];
