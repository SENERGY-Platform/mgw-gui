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

import {Injectable, inject} from '@angular/core';
import {
  HttpContextToken,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import {Router} from '@angular/router';
import {catchError, Observable, throwError} from 'rxjs';
import {currentPath} from '../return-to';

// Set on a request that expects a 401 as an answer rather than as a failure -
// the session probe behind the auth guard. Without it the probe would trigger
// the very redirect the guard is about to decide on.
export const SKIP_AUTH_REDIRECT = new HttpContextToken<boolean>(() => false);

const LOGIN_PATH = '/login';

// Sends the user to the login page once the gateway reports the session gone.
// The guard covers the cold start; this covers a session that expires while
// the application is already open, which no guard sees.
@Injectable()
export class AuthCheckInterceptor implements HttpInterceptor {
  private readonly router = inject(Router);
  // Parallel requests fail together, and each one would ask for the same
  // navigation. The first one wins and the rest are ignored.
  private redirecting = false;

  intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(httpRequest).pipe(
      catchError((err) => {
        if (err instanceof HttpErrorResponse && err.status === 401 && !httpRequest.context.get(SKIP_AUTH_REDIRECT)) {
          this.redirectToLogin();
        }
        return throwError(() => err);
      }),
    );
  }

  private redirectToLogin() {
    // A request already in flight can still fail after the redirect has
    // happened. Navigating again would replace the return_to captured the
    // first time with the login page itself, and the user would be sent back
    // to the login form after signing in.
    if (this.redirecting || this.router.url.split('?')[0] === LOGIN_PATH) {
      return;
    }
    this.redirecting = true;
    // Routed rather than assigned to location: a document reload would throw
    // away everything the user has typed into the page they were on, and the
    // login page reloads on its own once the session is back.
    this.router
      .navigate([LOGIN_PATH], {queryParams: {return_to: currentPath()}})
      .finally(() => (this.redirecting = false));
  }
}
