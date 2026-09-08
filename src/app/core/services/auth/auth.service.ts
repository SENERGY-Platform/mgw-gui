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

import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'src/environments/environment';
import {InitLogoutResponse} from './auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  basePath = environment.authApiUrl;
  loginPath = '/login';
  logoutPath = '/logout';
  registerPath = '/register';

  constructor(private httpClient: HttpClient) {}

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
