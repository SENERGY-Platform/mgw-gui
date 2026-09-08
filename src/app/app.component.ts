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

import {Component} from '@angular/core';

import {ShellComponent} from './core/components/shell/shell.component';
import {RouterOutlet} from '@angular/router';

// Pages that render without the app shell: no navigation before sign-in.
const AUTH_PATHS = ['/login', '/register'];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [ShellComponent, RouterOutlet],
})
export class AppComponent {
  title = 'Gateway';
  authPageIsActive = false;

  constructor() {
    // Matching on the trailing segment rather than on uiBaseUrl keeps the
    // auth pages frameless wherever the app is mounted - under /core/web-ui
    // in a real install, at the root when served by `ng serve`.
    const path = location.pathname.replace(/\/+$/, '');
    this.authPageIsActive = AUTH_PATHS.some((authPath) => path === authPath || path.endsWith(authPath));
  }
}
