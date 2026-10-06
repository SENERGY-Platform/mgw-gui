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
import {KratosFlow} from './kratos-flow';
import {SKIP_AUTH_REDIRECT} from './interceptor/auth.interceptor';

interface WhoamiResponse {
  identity?: {traits?: {username?: string}};
  authentication_methods?: {method?: string}[];
}

export type SignInMethod = 'password' | 'oidc';

export interface Whoami {
  username: string;
  method: SignInMethod | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  basePath = environment.authApiUrl;
  loginPath = '/login';
  logoutPath = '/logout';
  registerPath = '/register';
  settingsPath = '/settings';

  // The gateway keeps its session check to itself: /validate-session is an
  // internal nginx location and /core/auth exposes only the login and logout
  // flows, so there is no whoami to ask. Every /core/api path sits behind the
  // same auth_request, which makes a health endpoint the cheapest honest
  // stand-in - it answers 200 with a session and 401 without one, and doing
  // so is its entire job.
  private readonly sessionProbePath = environment.coreApiUrl + '/module-manager/health/service';
  private sessionCheck?: Observable<boolean>;
  private whoamiCheck?: Observable<Whoami | null>;

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

  // Who is signed in and how, or null when that cannot be told. Cached like
  // the session probe and dropped on logout; a failure, 401 included, is
  // never a redirect because the callers only decorate the page with it.
  whoami(): Observable<Whoami | null> {
    if (!this.whoamiCheck) {
      const context = new HttpContext().set(SKIP_AUTH_REDIRECT, true);
      this.whoamiCheck = this.httpClient
        .get<WhoamiResponse>(this.basePath + '/whoami', {
          headers: this.jsonHeaders,
          withCredentials: true,
          context: context,
        })
        .pipe(
          map((res): Whoami | null => {
            const username = res?.identity?.traits?.username;
            if (typeof username !== 'string') return null;
            const last = res.authentication_methods?.at(-1)?.method;
            return {username, method: last === 'password' || last === 'oidc' ? last : null};
          }),
          catchError(() => of(null)),
          shareReplay(1),
        );
    }
    return this.whoamiCheck;
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

  // Every request below asks for JSON: without it Kratos answers a browser
  // flow with a redirect to its own UI instead of the flow. Flow ids go
  // through encodeURIComponent because one of them arrives in the page URL.
  private readonly jsonHeaders = new HttpHeaders().set('Accept', 'application/json');

  // No return_to: the identity service resolves even a relative one against
  // its internal base URL and refuses the whole flow, password login included.
  initFlow() {
    const url = this.basePath + this.loginPath + '/browser?refresh=true';
    return this.httpClient.get<KratosFlow>(url, {headers: this.jsonHeaders, withCredentials: true});
  }

  getLoginFlow(flowID: string) {
    const url = this.basePath + this.loginPath + '/flows?id=' + encodeURIComponent(flowID);
    return this.httpClient.get<KratosFlow>(url, {headers: this.jsonHeaders, withCredentials: true});
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

  // Kratos answers with 422 and the identity provider's address; the caller
  // follows it. The provider id is the one the flow offers.
  loginWithOidc(flowID: string, csrf: string, provider: string) {
    const payload = {method: 'oidc', provider: provider, csrf_token: csrf};
    const url = this.basePath + this.loginPath + '?flow=' + encodeURIComponent(flowID);
    return this.httpClient.post<KratosFlow>(url, payload, {headers: this.jsonHeaders, withCredentials: true});
  }

  initSettingsFlow() {
    const url = this.basePath + this.settingsPath + '/browser';
    return this.httpClient.get<KratosFlow>(url, {headers: this.jsonHeaders, withCredentials: true});
  }

  getSettingsFlow(flowID: string) {
    const url = this.basePath + this.settingsPath + '/flows?id=' + encodeURIComponent(flowID);
    return this.httpClient.get<KratosFlow>(url, {headers: this.jsonHeaders, withCredentials: true});
  }

  // Like the OIDC login, linking ends in a 422 pointing at the provider.
  linkOidc(flowID: string, csrf: string, provider: string) {
    return this.submitSettings(flowID, {method: 'oidc', link: provider, csrf_token: csrf});
  }

  // Answered with the updated flow.
  unlinkOidc(flowID: string, csrf: string, provider: string) {
    return this.submitSettings(flowID, {method: 'oidc', unlink: provider, csrf_token: csrf});
  }

  private submitSettings(flowID: string, payload: object) {
    const url = this.basePath + this.settingsPath + '?flow=' + encodeURIComponent(flowID);
    return this.httpClient.post<KratosFlow>(url, payload, {headers: this.jsonHeaders, withCredentials: true});
  }

  initLogout() {
    const url = this.basePath + this.logoutPath + '/browser';
    const headers = new HttpHeaders().set('Accept', 'application/json');
    return this.httpClient.get<InitLogoutResponse>(url, {headers: headers, withCredentials: true});
  }

  logout(logoutToken: string) {
    this.whoamiCheck = undefined;
    const url = this.basePath + this.logoutPath + '?token=' + logoutToken;
    const headers = new HttpHeaders().set('Accept', 'application/json');
    return this.httpClient.get(url, {headers: headers, withCredentials: true});
  }
}
