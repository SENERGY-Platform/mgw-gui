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

import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {catchError, Observable, of, shareReplay, switchMap, take, tap, throwError} from 'rxjs';
import {AuthService} from 'src/app/core/services/auth/auth.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {SpinnerComponent} from '../../core/components/spinner/spinner.component';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';
import {environment} from 'src/environments/environment';
import {
  browserRedirect,
  csrfToken,
  flowFromError,
  flowMessages,
  isFlowId,
  isFlowUsable,
  isUnlinkedAccount,
  KratosFlow,
  KratosText,
  oidcProvider,
  samePageUnder,
} from 'src/app/core/services/auth/kratos-flow';
import {safeReturnPath} from 'src/app/core/services/auth/return-to';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [
    SpinnerComponent,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatButton,
    MatIcon,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('auth')],
})
export class LoginComponent implements OnInit {
  waitingForLogin = false;
  returnTo = '';
  // Set by the account page when Kratos asks for a recent sign-in.
  refresh = false;
  ssoAvailable = false;
  messages: KratosText[] = [];
  readonly isUnlinkedAccount = isUnlinkedAccount;
  // The sign-in page under the origin the identity provider calls back to.
  otherOriginUrl = '';

  form = new FormGroup({
    username: new FormControl('', {nonNullable: true, validators: Validators.required}),
    password: new FormControl('', {nonNullable: true, validators: Validators.required}),
  });

  // The return_to this page was given, if it is safe.
  private readonly flowReturnTo: string | null;

  // The flow submits go to, null when none is usable. Replayed, so a submit
  // made while the page's flow still loads waits for it: two concurrent
  // cookie-less flow requests leave a CSRF cookie that matches only one.
  private flow$: Observable<KratosFlow | null> = of(null);

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private errorService: ErrorService,
  ) {
    this.flowReturnTo = safeReturnPath(this.route.snapshot.queryParamMap.get('return_to'));
    // Where the app is mounted, not a fixed path: '/core/web-ui' in an install,
    // the root under `ng serve`. Hard-coding it sent local development to the
    // installed UI after every login.
    this.returnTo = this.flowReturnTo ?? (environment.uiBaseUrl || '/');
    this.refresh = this.route.snapshot.queryParamMap.get('refresh') === 'true';
  }

  // Shows whether single sign-on is offered and what a returning flow
  // reports. A failure here leaves the password form as it was: its submit
  // starts a flow of its own.
  ngOnInit() {
    const flowID = this.route.snapshot.queryParamMap.get('flow');
    const initial = isFlowId(flowID)
      ? this.authService.getLoginFlow(flowID).pipe(
          tap((flow) => (this.messages = flowMessages(flow))),
          catchError(() => this.authService.initFlow()),
        )
      : this.authService.initFlow();
    this.flow$ = initial.pipe(
      catchError((err) => {
        console.error('LoginComponent: login flow unavailable', err);
        return of(null);
      }),
      shareReplay(1),
    );
    this.flow$.subscribe((flow) => this.showFlow(flow));
  }

  private showFlow(flow: KratosFlow | null) {
    this.ssoAvailable = oidcProvider(flow, 'provider') !== null;
  }

  // The page's flow while it is usable; a new one only when it failed to load
  // or is about to expire.
  private submitFlow(): Observable<KratosFlow> {
    return this.flow$.pipe(
      take(1),
      switchMap((flow) => {
        if (flow && isFlowUsable(flow, Date.now())) {
          return of(flow);
        }
        const fresh = this.authService.initFlow().pipe(
          tap((f) => this.showFlow(f)),
          shareReplay(1),
        );
        this.flow$ = fresh.pipe(catchError(() => of(null)));
        return fresh;
      }),
    );
  }

  // A refused submit comes back with the updated flow, which stays usable.
  // After any other failure the flow is in doubt and the next submit starts
  // a new one.
  private keepFlowFrom(err: unknown) {
    this.flow$ = of(flowFromError(err));
  }

  login() {
    if (!this.form.valid || this.waitingForLogin) {
      return;
    }

    this.waitingForLogin = true;
    const {username, password} = this.form.getRawValue();
    this.submitFlow()
      .pipe(switchMap((flow) => this.authService.login(flow.id, username, password, csrfToken(flow))))
      .subscribe({
        next: () => {
          this.waitingForLogin = false;
          this.leaveTo(this.returnTo);
        },
        error: (err) => {
          this.waitingForLogin = false;
          this.keepFlowFrom(err);
          this.errorService.handleError('LoginComponent', 'login', err);
        },
      });
  }

  loginWithSso() {
    if (this.waitingForLogin) {
      return;
    }
    this.waitingForLogin = true;
    this.messages = [];
    this.otherOriginUrl = '';
    this.submitFlow()
      .pipe(
        switchMap((flow) => {
          const provider = oidcProvider(flow, 'provider');
          return provider
            ? this.authService.loginWithOidc(flow.id, csrfToken(flow), provider)
            : throwError(() => new Error('the identity service offers no single sign-on'));
        }),
      )
      .subscribe({
        next: () => {
          this.waitingForLogin = false;
          this.leaveTo(this.returnTo);
        },
        error: (err) => this.handleSsoError(err),
      });
  }

  private handleSsoError(err: unknown) {
    const redirect = browserRedirect(err, window.location.origin);
    if (redirect?.kind === 'follow') {
      // The spinner stays up: the page is about to be replaced.
      this.leaveTo(redirect.url);
      return;
    }
    this.waitingForLogin = false;
    this.keepFlowFrom(err);
    if (redirect?.kind === 'other-origin') {
      this.otherOriginUrl = samePageUnder(redirect.origin, window.location);
      return;
    }
    const flow = flowFromError(err);
    if (flow && flowMessages(flow).length > 0) {
      this.messages = flowMessages(flow);
      return;
    }
    this.errorService.handleError('LoginComponent', 'loginWithSso', err);
  }

  // The one place this page leaves the application; specs replace it.
  leaveTo(url: string) {
    window.location.href = url;
  }
}
