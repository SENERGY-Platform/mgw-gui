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

import {HttpClient, HttpContext, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {catchError, map, Observable, of, shareReplay} from 'rxjs';
import {environment} from 'src/environments/environment';
import {InitLogoutResponse} from './auth.models';
import {SKIP_AUTH_REDIRECT} from './interceptor/auth.interceptor';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  basePath = environment.authApiUrl;
  loginPath = '/login';
  logoutPath = '/logout';
  registerPath = '/register';

  // The gateway keeps its session check to itself: /validate-session is an
  // internal nginx location and /core/auth exposes only the login and logout
  // flows, so there is no whoami to ask. Every /core/api path sits behind the
  // same auth_request, which makes a health endpoint the cheapest honest
  // stand-in - it answers 200 with a session and 401 without one, and doing
  // so is its entire job.
  private readonly sessionProbePath = environment.coreApiUrl + '/module-manager/health/service';
  private sessionCheck?: Observable<boolean>;

  constructor(private httpClient: HttpClient) {}

  // Cached for the lifetime of the loaded application: the answer only ever
  // goes from true to false, and that transition is the interceptor's to
  // catch. Re-probing on every routed navigation would buy nothing.
  hasSession(): Observable<boolean> {
    if (!this.sessionCheck) {
      this.sessionCheck = this.probeSession().pipe(shareReplay(1));
    }
    return this.sessionCheck;
  }

  private probeSession(): Observable<boolean> {
    const context = new HttpContext().set(SKIP_AUTH_REDIRECT, true);
    return this.httpClient.get(this.sessionProbePath, {withCredentials: true, context: context}).pipe(
      map(() => true),
      // Only a 401 means there is no session. A gateway or service that is
      // down must not read as logged out - that would trade an error page the
      // user can act on for a login screen that will not help them.
      catchError((err) => of(!(err instanceof HttpErrorResponse && err.status === 401))),
    );
  }

  initFlow() {
    const url = this.basePath + this.loginPath + '/browser?refresh=true';
    return this.httpClient.get(url, {withCredentials: true});
  }

  login(flowID: string, username: string, password: string, csrf: string) {
    const payload = {
      identifier: username,
      method: 'password',
      password: password,
      csrf_token: csrf,
    };
    const url = this.basePath + this.loginPath + '?flow=' + flowID;
    const headers = new HttpHeaders().set('Accept', 'application/json');
    // .set("X-CSRF-Token", csrf) dont use -> or set allowed headers in kratos cors setting to this
    return this.httpClient.post(url, payload, {headers: headers, withCredentials: true});
  }

  initLogout() {
    const url = this.basePath + this.logoutPath + '/browser';
    const headers = new HttpHeaders().set('Accept', 'application/json');
    return this.httpClient.get<InitLogoutResponse>(url, {headers: headers, withCredentials: true});
  }

  logout(logoutToken: string) {
    const url = this.basePath + this.logoutPath + '?token=' + logoutToken;
    const headers = new HttpHeaders().set('Accept', 'application/json');
    return this.httpClient.get(url, {headers: headers, withCredentials: true});
  }
}
