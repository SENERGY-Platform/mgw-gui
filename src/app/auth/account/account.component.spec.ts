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
import {Observable, of, throwError} from 'rxjs';
import type {Mock} from 'vitest';
import {AuthService} from 'src/app/core/services/auth/auth.service';
import {CoreManagerService} from 'src/app/core/services/core-manager/core-manager.service';
import {KratosFlow} from 'src/app/core/services/auth/kratos-flow';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {environment} from 'src/environments/environment';
import {provideTranslocoTesting} from 'src/testing/transloco-testing';
import {AccountComponent, reauthUrl} from './account.component';

const FLOW_ID = '7f3e2a10-0c1d-4c3b-9a55-2d6f2f4b9e01';
const PROVIDER = 'sso-0123456789ab';

function settingsFlow(oidc: 'link' | 'unlink' | null, message?: string): KratosFlow {
  const nodes: KratosFlow['ui']['nodes'] = [
    {type: 'input', group: 'default', attributes: {name: 'csrf_token', value: 'csrf'}},
  ];
  if (oidc) {
    nodes.push({type: 'input', group: 'oidc', attributes: {name: oidc, value: PROVIDER}});
  }
  return {id: FLOW_ID, ui: {nodes, messages: message ? [{id: 1050001, text: message, type: 'success'}] : []}};
}

describe('AccountComponent', () => {
  let fixture: ComponentFixture<AccountComponent>;
  let component: AccountComponent;
  let auth: {initSettingsFlow: Mock; getSettingsFlow: Mock; linkOidc: Mock; unlinkOidc: Mock; whoami: Mock};
  let coreManager: {getOidcSettings: Mock};
  let errorService: {handleError: Mock};
  let leaveTo: Mock;

  function render(initial: KratosFlow, params: Record<string, string> = {}, oidc: Observable<unknown> = of({})) {
    coreManager = {getOidcSettings: vi.fn(() => oidc)};
    auth = {
      whoami: vi.fn(() => of({username: 'alice', method: 'password'})),
      initSettingsFlow: vi.fn(() => of(initial)),
      getSettingsFlow: vi.fn(() => of(settingsFlow('unlink', 'Your changes have been saved!'))),
      linkOidc: vi.fn(),
      unlinkOidc: vi.fn(),
    };
    errorService = {handleError: vi.fn()};
    TestBed.configureTestingModule({
      imports: [AccountComponent, provideTranslocoTesting('auth')],
      providers: [
        provideNoopAnimations(),
        {provide: AuthService, useValue: auth},
        {provide: ErrorService, useValue: errorService},
        {provide: CoreManagerService, useValue: coreManager},
        {provide: ActivatedRoute, useValue: {snapshot: {queryParamMap: {get: (key: string) => params[key] ?? null}}}},
      ],
    });
    fixture = TestBed.createComponent(AccountComponent);
    component = fixture.componentInstance;
    leaveTo = vi.fn();
    component.leaveTo = leaveTo;
    fixture.detectChanges();
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('shows an unlinked account with a link action', () => {
    render(settingsFlow('link'));

    expect(el().textContent).toContain('Not linked');
    expect(el().querySelector('button.link')).not.toBeNull();
    expect(el().querySelector('button.unlink')).toBeNull();
  });

  it('shows a linked account with an unlink action', () => {
    render(settingsFlow('unlink'));

    expect(el().textContent).toContain('Linked');
    expect(el().querySelector('button.unlink')).not.toBeNull();
    expect(el().querySelector('button.link')).toBeNull();
  });

  it('shows who is signed in and how', () => {
    render(settingsFlow('link'));

    expect(el().querySelector('.identity-name')?.textContent).toContain('alice');
    expect(el().querySelector('.identity')?.textContent).toContain('Signed in with password');
  });

  it('shows the host of the identity provider when linked', () => {
    render(settingsFlow('unlink'), {}, of({enabled: true, issuer_url: 'https://idp.example.com/realms/main'}));

    expect(el().querySelector('.linked-with')?.textContent).toContain('Linked with idp.example.com');
  });

  it('shows plain Linked when the provider setting cannot be read', () => {
    render(
      settingsFlow('unlink'),
      {},
      throwError(() => new HttpErrorResponse({status: 500})),
    );

    expect(el().querySelector('.linked-with')).toBeNull();
    expect(el().textContent).toContain('Linked');
  });

  it('unlinks the gateway provider named by the flow, not another one', () => {
    const flow = settingsFlow(null);
    flow.ui.nodes.push(
      {type: 'input', group: 'oidc', attributes: {name: 'unlink', value: 'github'}},
      {type: 'input', group: 'oidc', attributes: {name: 'unlink', value: 'sso-fedcba987654'}},
    );
    render(flow);
    auth.unlinkOidc.mockReturnValue(of(settingsFlow('link')));

    el().querySelector<HTMLButtonElement>('button.unlink')!.click();

    expect(auth.unlinkOidc).toHaveBeenCalledWith(FLOW_ID, 'csrf', 'sso-fedcba987654');
  });

  it('says so when single sign-on is not set up', () => {
    render(settingsFlow(null));

    expect(el().textContent).toContain('Single sign-on is not set up on this gateway.');
  });

  it('links with the flow and its csrf token and follows the redirect to the provider', () => {
    render(settingsFlow('link'));
    const target =
      'https://idp.example.com/authorize?redirect_uri=' +
      encodeURIComponent(window.location.origin + '/core/auth/self-service/methods/oidc/callback/sso');
    auth.linkOidc.mockReturnValue(
      throwError(() => new HttpErrorResponse({status: 422, error: {redirect_browser_to: target}})),
    );

    el().querySelector<HTMLButtonElement>('button.link')!.click();

    expect(auth.linkOidc).toHaveBeenCalledWith(FLOW_ID, 'csrf', PROVIDER);
    expect(leaveTo).toHaveBeenCalledWith(target);
  });

  it('does not follow a link redirect whose callback is on another origin', () => {
    render(settingsFlow('link'));
    const target =
      'https://idp.example.com/authorize?redirect_uri=' +
      encodeURIComponent('https://gw.example.net/core/auth/self-service/methods/oidc/callback/sso');
    auth.linkOidc.mockReturnValue(
      throwError(() => new HttpErrorResponse({status: 422, error: {redirect_browser_to: target}})),
    );

    el().querySelector<HTMLButtonElement>('button.link')!.click();
    fixture.detectChanges();

    expect(leaveTo).not.toHaveBeenCalled();
    expect(new URL(el().querySelector<HTMLAnchorElement>('.other-origin a')!.href).origin).toBe(
      'https://gw.example.net',
    );
  });

  it('unlinks and shows the updated flow', () => {
    render(settingsFlow('unlink'));
    auth.unlinkOidc.mockReturnValue(of(settingsFlow('link', 'Your changes have been saved!')));

    el().querySelector<HTMLButtonElement>('button.unlink')!.click();
    fixture.detectChanges();

    expect(auth.unlinkOidc).toHaveBeenCalledWith(FLOW_ID, 'csrf', PROVIDER);
    expect(el().querySelector('button.link')).not.toBeNull();
    expect(el().querySelector('.flow-message')?.textContent).toContain('Your changes have been saved!');
  });

  it('sends a session that is too old to sign in again and back here', () => {
    render(settingsFlow('unlink'));
    auth.unlinkOidc.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 403,
            error: {error: {id: 'session_refresh_required'}, redirect_browser_to: 'http://kratos:4433/internal'},
          }),
      ),
    );

    el().querySelector<HTMLButtonElement>('button.unlink')!.click();

    expect(leaveTo).toHaveBeenCalledWith(reauthUrl(window.location));
    expect(leaveTo).not.toHaveBeenCalledWith(expect.stringContaining('kratos:4433'));
    expect(errorService.handleError).not.toHaveBeenCalled();
  });

  it('shows the outcome of a returning flow', () => {
    render(settingsFlow('link'), {flow: FLOW_ID});

    expect(auth.getSettingsFlow).toHaveBeenCalledWith(FLOW_ID);
    expect(auth.initSettingsFlow).not.toHaveBeenCalled();
    expect(el().querySelector('.flow-message')?.textContent).toContain('Your changes have been saved!');
    expect(el().textContent).toContain('Linked');
  });
});

describe('reauthUrl', () => {
  it('points at the sign-in page with refresh and a return here, without the flow', () => {
    const url = reauthUrl({pathname: '/core/web-ui/account', search: '?flow=' + FLOW_ID});

    expect(url).toBe(
      environment.uiBaseUrl + '/login?refresh=true&return_to=' + encodeURIComponent('/core/web-ui/account'),
    );
  });
});
