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
import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors} from '@angular/forms';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatFormField} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';
import {MatInput} from '@angular/material/input';
import {MatTooltip} from '@angular/material/tooltip';
import {TranslocoPipe, TranslocoService, provideTranslocoScope} from '@jsverse/transloco';
import {concatMap, merge, of, throwError} from 'rxjs';
import {CoreManagerService} from 'src/app/core/services/core-manager/core-manager.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {NotificationService} from 'src/app/core/services/util/notifications.service';
import {UtilService} from 'src/app/core/services/util/util.service';
import {OidcSettings, OidcSettingsRequest} from 'src/app/system/models/oidc';

// Where the identity service receives the provider's answer, below the
// gateway's external URL; the provider id follows.
const CALLBACK_PATH = '/core/auth/self-service/methods/oidc/callback/';

export interface OidcFormValue {
  enabled: boolean;
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  externalUrl: string;
}

function parseHttpUrl(v: string): URL | null {
  try {
    const url = new URL(v.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

// The external URL is an origin: the callback path is appended to it, so a
// path, query or credentials in it would end up in the wrong place.
function parseOrigin(v: string): URL | null {
  const url = parseHttpUrl(v);
  if (!url || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    return null;
  }
  return url;
}

function requiredWhenEnabled(control: AbstractControl): ValidationErrors | null {
  const enabled = control.parent?.get('enabled')?.value === true;
  return enabled && String(control.value ?? '').trim() === '' ? {required: true} : null;
}

function httpUrlValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  return value.trim() === '' || parseHttpUrl(value) ? null : {url: true};
}

function originValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  return value.trim() === '' || parseOrigin(value) ? null : {origin: true};
}

// The core manager rejects an enabled setting whose scope lacks 'openid'.
function openidWhenEnabled(control: AbstractControl): ValidationErrors | null {
  const enabled = control.parent?.get('enabled')?.value === true;
  return enabled && !parseScope(String(control.value ?? '')).includes('openid') ? {openid: true} : null;
}

export function parseScope(text: string): string[] {
  return [...new Set(text.split(/[\s,]+/).filter((s) => s !== ''))];
}

// What the core manager has stored, as far as the form depends on it.
export interface StoredOidc {
  issuerUrl: string;
  clientId: string;
  providerId: string;
  hasSecret: boolean;
}

export function storedOidc(settings: OidcSettings): StoredOidc {
  return {
    issuerUrl: settings.issuer_url ?? '',
    clientId: settings.client_id ?? '',
    providerId: settings.provider_id ?? '',
    hasSecret: settings.has_secret === true,
  };
}

export type CallbackState = {kind: 'known'; url: string} | {kind: 'after-save'} | null;

// The provider id is derived from the issuer, so the stored one only names the
// callback while the issuer field still holds the stored issuer.
export function callbackState(externalUrl: string, issuerUrl: string, stored: StoredOidc): CallbackState {
  const origin = parseOrigin(externalUrl);
  const issuer = issuerUrl.trim();
  if (!origin || issuer === '') {
    return null;
  }
  if (stored.providerId === '' || issuer !== stored.issuerUrl) {
    return {kind: 'after-save'};
  }
  return {kind: 'known', url: origin.origin + CALLBACK_PATH + encodeURIComponent(stored.providerId)};
}

export type SecretRequirement = 'new-provider' | 'missing' | null;

// The core manager refuses a changed issuer or client ID without a new secret
// (compared as they would be sent), and an enabled setting needs a secret.
export function secretRequirement(
  value: Pick<OidcFormValue, 'enabled' | 'issuerUrl' | 'clientId'>,
  stored: StoredOidc,
): SecretRequirement {
  if (value.issuerUrl.trim() !== stored.issuerUrl || value.clientId.trim() !== stored.clientId) {
    return 'new-provider';
  }
  return value.enabled && !stored.hasSecret ? 'missing' : null;
}

export function toOidcRequest(value: OidcFormValue): OidcSettingsRequest {
  const request: OidcSettingsRequest = {
    enabled: value.enabled,
    // Not normalised beyond trimming: the provider's iss claim has to match it
    // character for character, trailing slash included.
    issuer_url: value.issuerUrl.trim(),
    client_id: value.clientId.trim(),
    scope: parseScope(value.scope),
    external_url: parseOrigin(value.externalUrl)?.origin ?? value.externalUrl.trim(),
  };
  // An empty field keeps the stored secret; whitespace pasted around a secret
  // is never part of it.
  const secret = value.clientSecret.trim();
  if (secret !== '') {
    request.client_secret = secret;
  }
  return request;
}

@Component({
  selector: 'app-single-sign-on',
  imports: [
    ReactiveFormsModule,
    MatButton,
    MatCheckbox,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatTooltip,
    TranslocoPipe,
  ],
  templateUrl: './single-sign-on.component.html',
  styleUrl: './single-sign-on.component.css',
  providers: [provideTranslocoScope('system')],
})
export class SingleSignOnComponent implements OnInit {
  private readonly coreService = inject(CoreManagerService);
  private readonly errorService = inject(ErrorService);
  private readonly utilService = inject(UtilService);
  private readonly notifications = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  // Null until loaded. Declared before the form, whose validator reads it.
  private stored: StoredOidc | null = null;

  private readonly secretValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.parent?.getRawValue() as OidcFormValue | undefined;
    if (!this.stored || !value || String(control.value ?? '').trim() !== '') {
      return null;
    }
    return secretRequirement(value, this.stored) ? {required: true} : null;
  };

  form = new FormGroup({
    enabled: new FormControl(false, {nonNullable: true}),
    issuerUrl: new FormControl('', {nonNullable: true, validators: [requiredWhenEnabled, httpUrlValidator]}),
    clientId: new FormControl('', {nonNullable: true, validators: [requiredWhenEnabled]}),
    clientSecret: new FormControl('', {nonNullable: true, validators: [this.secretValidator]}),
    scope: new FormControl('', {nonNullable: true, validators: [openidWhenEnabled]}),
    externalUrl: new FormControl('', {nonNullable: true, validators: [requiredWhenEnabled, originValidator]}),
  });
  hasSecret = false;
  loaded = false;
  loadFailed = false;
  saving = false;

  ngOnInit() {
    // The required checks read the checkbox, which is another control; they
    // are re-run whenever it changes.
    this.form.controls.enabled.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      for (const name of ['issuerUrl', 'clientId', 'scope', 'externalUrl'] as const) {
        this.form.controls[name].updateValueAndValidity();
      }
    });
    const c = this.form.controls;
    merge(c.enabled.valueChanges, c.issuerUrl.valueChanges, c.clientId.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => c.clientSecret.updateValueAndValidity());
    this.load();
  }

  get callback(): CallbackState {
    const c = this.form.controls;
    return this.stored ? callbackState(c.externalUrl.value, c.issuerUrl.value, this.stored) : null;
  }

  get secretRequirement(): SecretRequirement {
    return this.stored ? secretRequirement(this.form.getRawValue(), this.stored) : null;
  }

  load() {
    this.coreService.getOidcSettings().subscribe({
      next: (settings) => this.show(settings),
      error: (err) => {
        this.loadFailed = true;
        this.errorService.handleError(SingleSignOnComponent.name, 'load', err);
      },
    });
  }

  private show(settings: OidcSettings) {
    this.stored = storedOidc(settings);
    this.hasSecret = this.stored.hasSecret;
    this.form.reset({
      enabled: settings.enabled,
      issuerUrl: settings.issuer_url ?? '',
      clientId: settings.client_id ?? '',
      clientSecret: '',
      scope: settings.scope?.length ? settings.scope.join(' ') : 'openid',
      // Most gateways are set up from the address they are reached under.
      externalUrl: settings.external_url || window.location.origin,
    });
    this.loaded = true;
    this.loadFailed = false;
  }

  save() {
    if (this.form.invalid || this.saving) {
      return;
    }
    this.saving = true;
    this.coreService
      .updateOidcSettings(toOidcRequest(this.form.getRawValue()))
      .pipe(
        concatMap((jobID) =>
          this.utilService.checkJobStatus(
            jobID,
            this.transloco.translate<string>('system.singleSignOn.saveJob'),
            'core-manager',
          ),
        ),
        concatMap((result) => {
          if (!result?.success) {
            const cause = result?.error;
            return throwError(() =>
              cause instanceof HttpErrorResponse || cause instanceof Error ? cause : new Error(String(cause ?? '')),
            );
          }
          return of(true);
        }),
      )
      .subscribe({
        next: () => {
          this.saving = false;
          this.notifications.showSuccess(this.transloco.translate<string>('system.singleSignOn.saved'));
          this.load();
        },
        error: (err) => {
          this.saving = false;
          this.errorService.handleError(SingleSignOnComponent.name, 'save', err);
        },
      });
  }

  copyCallback() {
    const callback = this.callback;
    if (callback?.kind !== 'known') {
      return;
    }
    navigator.clipboard?.writeText(callback.url).catch(() => {
      // clipboard access can be denied; the URL is visible on screen anyway
    });
  }
}
