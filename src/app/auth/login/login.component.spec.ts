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

import {HttpErrorResponse} from '@angular/common/http';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {ActivatedRoute} from '@angular/router';
import {defer, Observable, of, Subject, throwError} from 'rxjs';
import type {Mock} from 'vitest';
import {AuthService} from 'src/app/core/services/auth/auth.service';
import {KratosFlow} from 'src/app/core/services/auth/kratos-flow';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {environment} from 'src/environments/environment';
import {provideTranslocoTesting} from 'src/testing/transloco-testing';
import {LoginComponent} from './login.component';

// returnTo ends up in window.location.href once the login succeeds, so what
// the query parameter is allowed to carry decides where a signed-in user can
// be sent. The component is built directly; nothing here touches the template.
function componentFor(returnTo: string | null): LoginComponent {
  const route = {
    snapshot: {queryParamMap: {get: (key: string) => (key === 'return_to' ? returnTo : null)}},
  } as unknown as ActivatedRoute;
  return new LoginComponent({} as AuthService, route, {} as ErrorService);
}

describe('LoginComponent return target', () => {
  it('keeps a path on this origin', () => {
    expect(componentFor('/modules').returnTo).toBe('/modules');
    expect(componentFor('/resources/secrets?q=1').returnTo).toBe('/resources/secrets?q=1');
  });

  it('reads the parameter url-encoded', () => {
    expect(componentFor('%2Fmodules%2Fcatalog').returnTo).toBe('/modules/catalog');
  });

  it('rejects a target on another origin', () => {
    const fallback = environment.uiBaseUrl || '/';
    // A browser reads each of these as a foreign host rather than a local path.
    expect(componentFor('//example.com').returnTo).toBe(fallback);
    expect(componentFor('%2F%2Fexample.com').returnTo).toBe(fallback);
    expect(componentFor('/\\example.com').returnTo).toBe(fallback);
    expect(componentFor('https://example.com').returnTo).toBe(fallback);
    // URL parsing drops tabs and newlines, which would leave '//example.com'.
    expect(componentFor('/\t/example.com').returnTo).toBe(fallback);
    expect(componentFor('%2F%0A%2Fexample.com').returnTo).toBe(fallback);
  });

  it('falls back to where the app is mounted', () => {
    const fallback = environment.uiBaseUrl || '/';
    expect(componentFor(null).returnTo).toBe(fallback);
    expect(componentFor('modules').returnTo).toBe(fallback);
  });
});

const FLOW_ID = '7f3e2a10-0c1d-4c3b-9a55-2d6f2f4b9e01';
const OTHER_FLOW_ID = '0b9d6c11-5e2f-4a7d-8c3b-1f0e9d8c7b6a';
const PROVIDER = 'sso-0123456789ab';
const CALLBACK_PATH = '/core/auth/self-service/methods/oidc/callback/' + PROVIDER;

function loginFlow(
  opts: {sso?: boolean; messages?: string[]; id?: string; expiresAt?: string; providers?: string[]} = {},
): KratosFlow {
  const id = opts.id ?? FLOW_ID;
  const nodes: KratosFlow['ui']['nodes'] = [];
  for (const provider of opts.providers ?? (opts.sso ? [PROVIDER] : [])) {
    nodes.push({type: 'input', group: 'oidc', attributes: {name: 'provider', value: provider}});
  }
  // Deliberately not first: the token used to be read from nodes[0].
  nodes.push({type: 'input', group: 'default', attributes: {name: 'csrf_token', value: 'token-' + id}});
  return {
    id,
    expires_at: opts.expiresAt ?? new Date(Date.now() + 3_600_000).toISOString(),
    ui: {nodes, messages: (opts.messages ?? []).map((text, i) => ({id: 4000000 + i, text, type: 'error'}))},
  };
}

function providerRedirect(callbackOrigin: string): HttpErrorResponse {
  const target =
    'https://idp.example.com/authorize?client_id=gw&redirect_uri=' + encodeURIComponent(callbackOrigin + CALLBACK_PATH);
  return new HttpErrorResponse({
    status: 422,
    error: {error: {id: 'browser_location_change_required'}, redirect_browser_to: target},
  });
}

describe('LoginComponent with the identity service', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let auth: {initFlow: Mock; getLoginFlow: Mock; login: Mock; loginWithOidc: Mock};
  let errorService: {handleError: Mock};
  let leaveTo: Mock;
  // Flows actually requested: like HttpClient, every subscription is a request.
  let flowRequests: number;

  function render(
    params: Record<string, string>,
    initFlow: () => Observable<KratosFlow>,
    returningFlow = loginFlow({sso: true, messages: ['An account with the same identifier exists']}),
  ) {
    flowRequests = 0;
    auth = {
      initFlow: vi.fn(() =>
        defer(() => {
          flowRequests++;
          return initFlow();
        }),
      ),
      getLoginFlow: vi.fn(() => of(returningFlow)),
      login: vi.fn(() => of({})),
      loginWithOidc: vi.fn(() => throwError(() => providerRedirect(window.location.origin))),
    };
    errorService = {handleError: vi.fn()};
    TestBed.configureTestingModule({
      imports: [LoginComponent, provideTranslocoTesting('auth')],
      providers: [
        provideNoopAnimations(),
        {provide: AuthService, useValue: auth},
        {provide: ErrorService, useValue: errorService},
        {provide: ActivatedRoute, useValue: {snapshot: {queryParamMap: {get: (key: string) => params[key] ?? null}}}},
      ],
    });
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    leaveTo = vi.fn();
    component.leaveTo = leaveTo;
    fixture.detectChanges();
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function ssoButton(): HTMLButtonElement | null {
    return el().querySelector('button.sso');
  }

  function signIn() {
    component.form.setValue({username: 'admin', password: 'secret'});
    component.login();
  }

  it('offers single sign-on when the flow carries the provider node', () => {
    render({}, () => of(loginFlow({sso: true})));

    expect(ssoButton()?.textContent).toContain('Sign in with single sign-on');
  });

  it('offers no single sign-on without the provider node', () => {
    render({}, () => of(loginFlow()));

    expect(auth.initFlow).toHaveBeenCalled();
    expect(ssoButton()).toBeNull();
  });

  it('submits the password login to the flow loaded with the page, with the csrf token found by name', () => {
    render({}, () => of(loginFlow({sso: true})));

    signIn();

    expect(auth.login).toHaveBeenCalledWith(FLOW_ID, 'admin', 'secret', 'token-' + FLOW_ID);
    expect(flowRequests).toBe(1);
    expect(leaveTo).toHaveBeenCalledWith(component.returnTo);
  });

  it('keeps the password login working when the identity service is unreachable on load', () => {
    let calls = 0;
    render({}, () =>
      ++calls === 1 ? throwError(() => new HttpErrorResponse({status: 502})) : of(loginFlow({sso: true})),
    );
    expect(ssoButton()).toBeNull();
    expect(errorService.handleError).not.toHaveBeenCalled();

    signIn();

    expect(auth.login).toHaveBeenCalledWith(FLOW_ID, 'admin', 'secret', 'token-' + FLOW_ID);
    expect(flowRequests).toBe(2);
  });

  // Two concurrent cookie-less flow requests leave a CSRF cookie that matches
  // only one of the two tokens.
  it('waits for the flow still loading instead of starting a second one', () => {
    const pending = new Subject<KratosFlow>();
    render({}, () => pending);

    signIn();
    expect(auth.login).not.toHaveBeenCalled();

    pending.next(loginFlow({sso: true}));
    pending.complete();

    expect(auth.login).toHaveBeenCalledWith(FLOW_ID, 'admin', 'secret', 'token-' + FLOW_ID);
    expect(flowRequests).toBe(1);
  });

  it('waits for the flow still loading for single sign-on too', () => {
    const pending = new Subject<KratosFlow>();
    render({}, () => pending);

    component.loginWithSso();
    expect(auth.loginWithOidc).not.toHaveBeenCalled();

    pending.next(loginFlow({sso: true}));
    pending.complete();

    expect(auth.loginWithOidc).toHaveBeenCalledWith(FLOW_ID, 'token-' + FLOW_ID, PROVIDER);
    expect(flowRequests).toBe(1);
  });

  it('starts a new flow when the one loaded with the page has expired', () => {
    let calls = 0;
    render({}, () =>
      ++calls === 1
        ? of(loginFlow({sso: true, expiresAt: new Date(Date.now() - 1000).toISOString()}))
        : of(loginFlow({sso: true, id: OTHER_FLOW_ID})),
    );

    signIn();

    expect(flowRequests).toBe(2);
    expect(auth.login).toHaveBeenCalledWith(OTHER_FLOW_ID, 'admin', 'secret', 'token-' + OTHER_FLOW_ID);
  });

  it('reuses the updated flow of a refused submit and replaces one that failed otherwise', () => {
    let calls = 0;
    render({}, () => of(loginFlow({sso: true, id: ++calls === 1 ? FLOW_ID : OTHER_FLOW_ID})));
    auth.login.mockReturnValueOnce(throwError(() => new HttpErrorResponse({status: 400, error: loginFlow()})));

    signIn();
    signIn();

    expect(flowRequests).toBe(1);
    expect(auth.login).toHaveBeenLastCalledWith(FLOW_ID, 'admin', 'secret', 'token-' + FLOW_ID);

    auth.login.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({status: 403, error: {error: {id: 'security_csrf_violation'}}})),
    );
    signIn();
    signIn();

    expect(flowRequests).toBe(2);
    expect(auth.login).toHaveBeenLastCalledWith(OTHER_FLOW_ID, 'admin', 'secret', 'token-' + OTHER_FLOW_ID);
  });

  it('submits to a returning flow without starting another', () => {
    render({flow: FLOW_ID}, () => of(loginFlow({sso: true, id: OTHER_FLOW_ID})));

    signIn();

    expect(auth.initFlow).not.toHaveBeenCalled();
    expect(auth.login).toHaveBeenCalledWith(FLOW_ID, 'admin', 'secret', 'token-' + FLOW_ID);
  });

  it('follows the redirect to the provider, reusing the page flow and its provider id', () => {
    render({}, () => of(loginFlow({sso: true})));

    ssoButton()!.click();

    expect(auth.loginWithOidc).toHaveBeenCalledWith(FLOW_ID, 'token-' + FLOW_ID, PROVIDER);
    expect(flowRequests).toBe(1);
    expect(leaveTo).toHaveBeenCalledWith(expect.stringContaining('https://idp.example.com/authorize'));
  });

  it('signs in with the first sso provider when the flow offers several', () => {
    render({}, () => of(loginFlow({providers: ['github', 'sso-aaaaaaaaaaaa', 'sso-bbbbbbbbbbbb']})));

    ssoButton()!.click();

    expect(auth.loginWithOidc).toHaveBeenCalledWith(FLOW_ID, 'token-' + FLOW_ID, 'sso-aaaaaaaaaaaa');
  });

  it('offers no single sign-on when no provider is the gateway one', () => {
    render({}, () => of(loginFlow({providers: ['github']})));

    expect(ssoButton()).toBeNull();
  });

  it('keeps return_to away from the identity service, also on a forced sign-in', () => {
    let calls = 0;
    render({refresh: 'true', return_to: '%2Fcore%2Fweb-ui%2Faccount'}, () =>
      ++calls === 1 ? throwError(() => new HttpErrorResponse({status: 502})) : of(loginFlow({sso: true})),
    );

    component.loginWithSso();

    expect(flowRequests).toBe(2);
    expect(auth.initFlow).toHaveBeenNthCalledWith(1);
    expect(auth.initFlow).toHaveBeenNthCalledWith(2);
    expect(component.returnTo).toBe('/core/web-ui/account');
  });

  it('does not follow a redirect whose callback is on another origin and links there instead', () => {
    render({}, () => of(loginFlow({sso: true})));
    auth.loginWithOidc.mockImplementation(() => throwError(() => providerRedirect('https://gw.example.net')));

    ssoButton()!.click();
    fixture.detectChanges();

    expect(leaveTo).not.toHaveBeenCalled();
    const link = el().querySelector<HTMLAnchorElement>('.other-origin a');
    const target = new URL(link!.href);
    expect(target.origin).toBe('https://gw.example.net');
    expect(target.pathname).toBe(window.location.pathname);
    expect(errorService.handleError).not.toHaveBeenCalled();
  });

  it('shows the messages of a returning flow', () => {
    render({flow: FLOW_ID}, () => of(loginFlow()));

    expect(auth.getLoginFlow).toHaveBeenCalledWith(FLOW_ID);
    expect(auth.initFlow).not.toHaveBeenCalled();
    const notice = el().querySelector('.flow-message');
    expect(notice?.textContent).toContain('An account with the same identifier exists');
    expect(notice?.classList).toContain('danger');
  });

  it('explains a provider account that is not linked instead of the registration error', () => {
    const reason = 'Registration is not allowed because it was disabled.';
    const flow = loginFlow();
    flow.ui.messages = [{id: 4000001, text: reason, type: 'error', context: {reason}}];
    render({flow: FLOW_ID}, () => of(loginFlow()), flow);

    const notice = el().querySelector('.flow-message');
    expect(notice?.textContent).toContain('not linked to a gateway account');
    expect(notice?.textContent).not.toContain('Registration');
  });

  it('ignores a flow parameter that is not a flow id', () => {
    render({flow: '../logout'}, () => of(loginFlow()));

    expect(auth.getLoginFlow).not.toHaveBeenCalled();
    expect(auth.initFlow).toHaveBeenCalled();
  });

  it('explains a forced sign-in', () => {
    render({refresh: 'true'}, () => of(loginFlow()));

    expect(el().textContent).toContain('This change needs a recent sign-in');
  });
});
