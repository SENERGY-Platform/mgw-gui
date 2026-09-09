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

import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {map} from 'rxjs';
import {AuthService} from './auth.service';
import {currentPath} from './return-to';

// Keeps a page from loading before it is known whether anyone is logged in.
// The gateway already refuses to serve the application without a session, so
// in a deployed core this only ever confirms what nginx decided. Under
// `ng serve` the application is served by the dev server and reaches the
// browser unauthenticated, and without this every page would start its data
// loading, collect a 401 per request and only then be sent to the login page.
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth
    .hasSession()
    .pipe(
      map((hasSession) => hasSession || router.createUrlTree(['/login'], {queryParams: {return_to: currentPath()}})),
    );
};
