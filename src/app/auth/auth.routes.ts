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
import {LoginComponent} from './login/login.component';

// Loaded lazily like every other feature here. Safe for auth specifically
// because nothing that gets you to /login is a client-side router
// navigation: the 401 interceptor and the shell both send the browser there
// with a hard `window.location.href`, which reboots the app and resolves
// this route the same way any first navigation would.
export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
];
