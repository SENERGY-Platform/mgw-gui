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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import type {Mock} from 'vitest';
import {CoreManagerService} from 'src/app/core/services/core-manager/core-manager.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {NotificationService} from 'src/app/core/services/util/notifications.service';
import {UtilService} from 'src/app/core/services/util/util.service';
import {OidcSettings} from 'src/app/system/models/oidc';
import {provideTranslocoTesting} from 'src/testing/transloco-testing';
import {
  callbackState,
  OidcFormValue,
  parseScope,
  secretRequirement,
  SingleSignOnComponent,
  StoredOidc,
  toOidcRequest,
} from './single-sign-on.component';

const VALUE: OidcFormValue = {
  enabled: true,
  issuerUrl: ' https://idp.example.com/realms/gw/ ',
  clientId: ' gateway ',
  clientSecret: '',
  scope: 'openid email, profile openid',
  externalUrl: 'https://Gateway.example.org/',
};

describe('toOidcRequest', () => {
  it('leaves the secret out when the field is empty, so the stored one is kept', () => {
    expect('client_secret' in toOidcRequest(VALUE)).toBe(false);
    expect('client_secret' in toOidcRequest({...VALUE, clientSecret: '  \n'})).toBe(false);
  });

  it('sends a secret that was entered', () => {
    expect(toOidcRequest({...VALUE, clientSecret: ' s3cret\n'}).client_secret).toBe('s3cret');
  });

  it('keeps the issuer as entered apart from surrounding whitespace', () => {
    expect(toOidcRequest(VALUE).issuer_url).toBe('https://idp.example.com/realms/gw/');
  });

  it('reduces the external URL to its origin', () => {
    expect(toOidcRequest(VALUE).external_url).toBe('https://gateway.example.org');
  });

  it('splits the scope on spaces and commas without repeats', () => {
    expect(parseScope('openid email, profile openid')).toEqual(['openid', 'email', 'profile']);
    expect(parseScope('  ')).toEqual([]);
  });
});

const PROVIDER = 'sso-0123456789ab';
const CALLBACK = 'https://gateway.example.org/core/auth/self-service/methods/oidc/callback/' + PROVIDER;
const STORED: StoredOidc = {
  issuerUrl: 'https://idp.example.com/realms/gw',
  clientId: 'gateway',
  providerId: PROVIDER,
  hasSecret: true,
};

describe('callbackState', () => {
  it('appends the callback path and the stored provider id to the external origin', () => {
    expect(callbackState('https://gateway.example.org/', STORED.issuerUrl, STORED)).toEqual({
      kind: 'known',
      url: CALLBACK,
    });
  });

  it('leaves the URL to the save while the issuer differs from the stored one or nothing is stored', () => {
    expect(callbackState('https://gateway.example.org', STORED.issuerUrl + '/', STORED)).toEqual({kind: 'after-save'});
    expect(callbackState('https://gateway.example.org', STORED.issuerUrl, {...STORED, providerId: ''})).toEqual({
      kind: 'after-save',
    });
  });

  it('compares the issuer as it would be sent', () => {
    expect(callbackState('https://gateway.example.org', ' ' + STORED.issuerUrl + ' ', STORED)?.kind).toBe('known');
  });

  it('shows nothing without a bare origin or an issuer', () => {
    expect(callbackState('https://gateway.example.org/core', STORED.issuerUrl, STORED)).toBeNull();
    expect(callbackState('gateway.example.org', STORED.issuerUrl, STORED)).toBeNull();
    expect(callbackState('ftp://gateway.example.org', STORED.issuerUrl, STORED)).toBeNull();
    expect(callbackState('https://gateway.example.org', ' ', STORED)).toBeNull();
  });
});

describe('secretRequirement', () => {
  const same = {enabled: true, issuerUrl: STORED.issuerUrl, clientId: STORED.clientId};

  it('asks for the secret of a new provider when issuer or client ID change, enabled or not', () => {
    expect(secretRequirement({...same, issuerUrl: 'https://other.example.com'}, STORED)).toBe('new-provider');
    expect(secretRequirement({...same, clientId: 'other'}, STORED)).toBe('new-provider');
    expect(secretRequirement({...same, enabled: false, clientId: 'other'}, STORED)).toBe('new-provider');
  });

  it('asks for a secret while enabled and none is stored', () => {
    expect(secretRequirement(same, {...STORED, hasSecret: false})).toBe('missing');
    expect(secretRequirement({...same, enabled: false}, {...STORED, hasSecret: false})).toBeNull();
  });

  it('keeps the stored secret when the provider stays', () => {
    expect(secretRequirement({...same, clientId: ' gateway '}, STORED)).toBeNull();
  });
});

describe('SingleSignOnComponent', () => {
  let fixture: ComponentFixture<SingleSignOnComponent>;
  let component: SingleSignOnComponent;
  let core: {getOidcSettings: Mock; updateOidcSettings: Mock};
  let util: {checkJobStatus: Mock};

  function render(settings: OidcSettings) {
    core = {getOidcSettings: vi.fn(() => of(settings)), updateOidcSettings: vi.fn(() => of('job-1'))};
    util = {checkJobStatus: vi.fn(() => of({success: true}))};
    TestBed.configureTestingModule({
      imports: [SingleSignOnComponent, provideTranslocoTesting('system')],
      providers: [
        provideNoopAnimations(),
        {provide: CoreManagerService, useValue: core},
        {provide: UtilService, useValue: util},
        {provide: ErrorService, useValue: {handleError: vi.fn()}},
        {provide: NotificationService, useValue: {showSuccess: vi.fn()}},
      ],
    });
    fixture = TestBed.createComponent(SingleSignOnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  const stored: OidcSettings = {
    enabled: true,
    issuer_url: 'https://idp.example.com/realms/gw',
    client_id: 'gateway',
    scope: ['openid', 'email'],
    external_url: 'https://gateway.example.org',
    has_secret: true,
    provider_id: PROVIDER,
  };

  it('starts the secret empty and says that one is stored', () => {
    render(stored);

    expect(el().querySelector<HTMLInputElement>('#sso-client-secret')!.value).toBe('');
    expect(el().textContent).toContain('A secret is stored');
    expect(el().querySelector('.callback-url')?.textContent).toBe(CALLBACK);
  });

  it('defers the callback URL to the save when the issuer changes and shows it after reloading', () => {
    render({...stored, issuer_url: '', client_id: '', provider_id: '', has_secret: false, enabled: false});
    expect(el().querySelector('.callback-url')).toBeNull();

    component.form.patchValue({
      enabled: true,
      issuerUrl: stored.issuer_url,
      clientId: stored.client_id,
      clientSecret: 's3cret',
    });
    component.form.markAsDirty();
    fixture.detectChanges();
    expect(el().querySelector('.callback-after-save')?.textContent).toContain('shown here once the settings are saved');
    expect(el().querySelector('.callback-url')).toBeNull();

    core.getOidcSettings.mockReturnValue(of(stored));
    component.save();
    fixture.detectChanges();

    expect(core.getOidcSettings).toHaveBeenCalledTimes(2);
    expect(el().querySelector('.callback-url')?.textContent).toBe(CALLBACK);
    expect(el().querySelector('.callback-after-save')).toBeNull();
  });

  it('requires the secret when issuer or client ID change and says why', () => {
    render(stored);
    expect(component.form.controls.clientSecret.valid).toBe(true);

    component.form.controls.issuerUrl.setValue('https://other.example.com/realms/gw');
    component.form.controls.clientSecret.markAsTouched();
    fixture.detectChanges();

    expect(component.form.controls.clientSecret.hasError('required')).toBe(true);
    expect(component.form.valid).toBe(false);
    expect(el().querySelector('.secret-hint')?.textContent).toContain(
      'A new identity provider needs its client secret.',
    );
    expect(el().querySelector('.callback-after-save')).not.toBeNull();

    component.form.controls.issuerUrl.setValue(stored.issuer_url);
    expect(component.form.controls.clientSecret.valid).toBe(true);

    component.form.controls.clientId.setValue('other');
    expect(component.form.controls.clientSecret.hasError('required')).toBe(true);

    component.form.controls.clientSecret.setValue('s3cret');
    expect(component.form.valid).toBe(true);
  });

  it('requires a secret while enabled and none is stored', () => {
    render({...stored, enabled: false, has_secret: false});
    expect(component.form.controls.clientSecret.valid).toBe(true);
    expect(el().querySelector('.secret-hint')?.textContent).toContain('No secret is stored yet.');

    component.form.controls.enabled.setValue(true);

    expect(component.form.controls.clientSecret.hasError('required')).toBe(true);
  });

  it('prefills the external URL with the current origin and the scope with openid when unset', () => {
    render({...stored, enabled: false, external_url: '', scope: [], has_secret: false});

    expect(component.form.controls.externalUrl.value).toBe(window.location.origin);
    expect(component.form.controls.scope.value).toBe('openid');
  });

  it('requires openid in the scope only while enabled', () => {
    render({...stored, enabled: false, scope: ['email']});
    expect(component.form.controls.scope.valid).toBe(true);

    component.form.controls.enabled.setValue(true);

    expect(component.form.controls.scope.hasError('openid')).toBe(true);
  });

  it('saves without a secret when the field stays empty and follows the job', () => {
    render(stored);
    component.form.controls.scope.setValue('openid email profile');
    component.form.markAsDirty();

    component.save();

    const request = core.updateOidcSettings.mock.calls[0][0];
    expect(request).toEqual({
      enabled: true,
      issuer_url: 'https://idp.example.com/realms/gw',
      client_id: 'gateway',
      scope: ['openid', 'email', 'profile'],
      external_url: 'https://gateway.example.org',
    });
    expect(util.checkJobStatus).toHaveBeenCalledWith('job-1', expect.any(String), 'core-manager');
  });

  it('requires issuer, client and external URL only while enabled', () => {
    render({...stored, enabled: false, issuer_url: '', client_id: '', has_secret: false});
    expect(component.form.valid).toBe(true);

    component.form.controls.enabled.setValue(true);

    expect(component.form.controls.issuerUrl.hasError('required')).toBe(true);
    expect(component.form.controls.clientId.hasError('required')).toBe(true);
    expect(component.form.valid).toBe(false);
  });
});
