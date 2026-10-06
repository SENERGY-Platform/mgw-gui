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

import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {environment} from 'src/environments/environment';
import {SKIP_AUTH_REDIRECT} from './interceptor/auth.interceptor';
import {AuthService, Whoami} from './auth.service';

const FLOW = '7f3e2a10-0c1d-4c3b-9a55-2d6f2f4b9e01';
const PROVIDER = 'sso-0123456789ab';

// The payloads are the contract with the identity service: the method, the
// provider id and the field that selects link or unlink are all it reads.
describe('AuthService identity flows', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('submits the OIDC login for the provider the flow offers', () => {
    service.loginWithOidc(FLOW, 'csrf', PROVIDER).subscribe();

    const req = http.expectOne(environment.authApiUrl + '/login?flow=' + FLOW);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({method: 'oidc', provider: PROVIDER, csrf_token: 'csrf'});
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.get('Accept')).toBe('application/json');
    req.flush({});
  });

  it('links the account through the settings flow', () => {
    service.linkOidc(FLOW, 'csrf', PROVIDER).subscribe();

    const req = http.expectOne(environment.authApiUrl + '/settings?flow=' + FLOW);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({method: 'oidc', link: PROVIDER, csrf_token: 'csrf'});
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('unlinks the account through the settings flow', () => {
    service.unlinkOidc(FLOW, 'csrf', PROVIDER).subscribe();

    const req = http.expectOne(environment.authApiUrl + '/settings?flow=' + FLOW);
    expect(req.request.body).toEqual({method: 'oidc', unlink: PROVIDER, csrf_token: 'csrf'});
    req.flush({});
  });

  // A return_to makes the identity service refuse the whole flow, because it
  // resolves even a relative one against its internal base URL.
  it('starts a login flow with refresh and without a return target', () => {
    service.initFlow().subscribe();

    const req = http.expectOne(environment.authApiUrl + '/login/browser?refresh=true');
    expect(req.request.headers.get('Accept')).toBe('application/json');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('fetches flows by id as JSON, with the id encoded', () => {
    service.getLoginFlow('a&b').subscribe();
    service.getSettingsFlow(FLOW).subscribe();
    service.initSettingsFlow().subscribe();

    const login = http.expectOne(environment.authApiUrl + '/login/flows?id=a%26b');
    expect(login.request.headers.get('Accept')).toBe('application/json');
    login.flush({});
    http.expectOne(environment.authApiUrl + '/settings/flows?id=' + FLOW).flush({});
    http.expectOne(environment.authApiUrl + '/settings/browser').flush({});
  });
});

describe('AuthService whoami', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const url = environment.authApiUrl + '/whoami';

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function session(methods: object[]) {
    return {identity: {traits: {username: 'alice', meta: {}}}, authentication_methods: methods};
  }

  function resolve(body: object): Whoami | null | undefined {
    let result: Whoami | null | undefined;
    service.whoami().subscribe((who) => (result = who));
    const req = http.expectOne(url);
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.get('Accept')).toBe('application/json');
    expect(req.request.context.get(SKIP_AUTH_REDIRECT)).toBe(true);
    req.flush(body);
    return result;
  }

  it('reports a password sign-in', () => {
    expect(resolve(session([{method: 'password'}]))).toEqual({username: 'alice', method: 'password'});
  });

  it('takes the last method of the session, so a linked sign-in reads as single sign-on', () => {
    const methods = [{method: 'password'}, {method: 'oidc', provider: 'sso-0123456789ab'}];
    expect(resolve(session(methods))).toEqual({username: 'alice', method: 'oidc'});
  });

  it('keeps the name when the session lists no methods', () => {
    expect(resolve(session([]))).toEqual({username: 'alice', method: null});
  });

  it('answers null on a 401 without any redirect being requested', () => {
    let result: Whoami | null | undefined;
    service.whoami().subscribe((who) => (result = who));

    const req = http.expectOne(url);
    expect(req.request.context.get(SKIP_AUTH_REDIRECT)).toBe(true);
    req.flush({}, {status: 401, statusText: 'Unauthorized'});

    expect(result).toBeNull();
  });

  it('asks once and asks again after logout', () => {
    service.whoami().subscribe();
    service.whoami().subscribe();
    http.expectOne(url).flush(session([{method: 'password'}]));

    service.logout('token').subscribe();
    http.expectOne(environment.authApiUrl + '/logout?token=token').flush({});
    service.whoami().subscribe();
    http.expectOne(url).flush(session([{method: 'password'}]));
  });
});
