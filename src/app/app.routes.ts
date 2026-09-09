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
import {authGuard} from './core/services/auth/auth.guard';

// Routes moved when the navigation was reorganised around what the user
// manages. The redirects keep older bookmarks and in-module links working;
// prefix matching carries the remaining segments along.
const legacyRedirects: Routes = [
  {path: 'secrets', redirectTo: 'resources/secrets'},
  {path: 'modules/manage', redirectTo: 'modules/catalog'},
  {path: 'modules/global-configs', redirectTo: 'resources/global-configs'},
  {path: 'deployments/endpoints', redirectTo: 'resources/endpoints'},
];

// Every feature keeps its routes in its own file and is loaded only once one
// of its paths is visited. The empty path on each entry is a pass-through:
// it adds no segment of its own, so the feature's routes end up mounted
// exactly where they used to be, just fetched lazily instead of bundled into
// the start-up chunk.
//
// All of them sit under one guarded pass-through; the login page stays
// outside it, being the one page a visitor without a session has to reach.
// Guarding here rather than in each feature's own file means a new feature is
// guarded by being added to this list, not by remembering to guard it.
export const routes: Routes = [
  {path: '', redirectTo: '/overview', pathMatch: 'full'},
  ...legacyRedirects,
  {path: '', loadChildren: () => import('./auth/auth.routes').then((m) => m.routes)},
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {path: '', loadChildren: () => import('./overview/overview.routes').then((m) => m.routes)},
      {path: '', loadChildren: () => import('./developer/developer.routes').then((m) => m.routes)},
      {path: '', loadChildren: () => import('./deployments/deployments.routes').then((m) => m.routes)},
      {path: '', loadChildren: () => import('./modules/modules.routes').then((m) => m.routes)},
      {path: '', loadChildren: () => import('./secrets/secrets.routes').then((m) => m.routes)},
      {path: '', loadChildren: () => import('./system/system.routes').then((m) => m.routes)},
    ],
  },
];
