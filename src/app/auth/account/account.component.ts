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

import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';
import {Observable} from 'rxjs';
import {AuthService} from 'src/app/core/services/auth/auth.service';
import {
  browserRedirect,
  csrfToken,
  flowFromError,
  flowMessages,
  isFlowId,
  KratosFlow,
  KratosText,
  needsPrivilegedSession,
  oidcProvider,
  samePageUnder,
} from 'src/app/core/services/auth/kratos-flow';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {PageHeaderComponent} from 'src/app/core/components/page-header/page-header.component';
import {SpinnerComponent} from 'src/app/core/components/spinner/spinner.component';
import {StatusPillComponent} from 'src/app/core/components/status-pill/status-pill.component';
import {environment} from 'src/environments/environment';

// Settings of the signed-in account, kept in the identity service's settings
// flow. The identity service sends the browser back here after linking, with
// ?flow= carrying the outcome.
@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css'],
  imports: [MatButton, MatIcon, PageHeaderComponent, SpinnerComponent, StatusPillComponent, TranslocoPipe],
  providers: [provideTranslocoScope('auth')],
})
export class AccountComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly errorService = inject(ErrorService);

  flow: KratosFlow | null = null;
  ready = false;
  busy = false;
  messages: KratosText[] = [];
  otherOriginUrl = '';

  get linked(): boolean {
    return oidcProvider(this.flow, 'unlink') !== null;
  }

  get linkable(): boolean {
    return oidcProvider(this.flow, 'link') !== null;
  }

  ngOnInit() {
    const flowID = this.route.snapshot.queryParamMap.get('flow');
    if (isFlowId(flowID)) {
      this.authService.getSettingsFlow(flowID).subscribe({
        next: (flow) => {
          this.showFlow(flow);
          this.messages = flowMessages(flow);
        },
        error: () => this.loadFreshFlow(),
      });
    } else {
      this.loadFreshFlow();
    }
  }

  link() {
    const provider = oidcProvider(this.flow, 'link');
    if (this.flow && provider) {
      this.submit(this.authService.linkOidc(this.flow.id, csrfToken(this.flow), provider), 'link');
    }
  }

  unlink() {
    const provider = oidcProvider(this.flow, 'unlink');
    if (this.flow && provider) {
      this.submit(this.authService.unlinkOidc(this.flow.id, csrfToken(this.flow), provider), 'unlink');
    }
  }

  // The one place this page leaves the application; specs replace it.
  leaveTo(url: string) {
    window.location.href = url;
  }

  private loadFreshFlow() {
    this.authService.initSettingsFlow().subscribe({
      next: (flow) => this.showFlow(flow),
      error: (err) => {
        this.ready = true;
        this.errorService.handleError(AccountComponent.name, 'loadFreshFlow', err);
      },
    });
  }

  private showFlow(flow: KratosFlow) {
    this.flow = flow;
    this.ready = true;
  }

  private submit(request: Observable<KratosFlow>, method: string) {
    this.busy = true;
    this.messages = [];
    this.otherOriginUrl = '';
    request.subscribe({
      next: (flow) => {
        this.busy = false;
        this.showFlow(flow);
        this.messages = flowMessages(flow);
      },
      error: (err) => this.handleSubmitError(err, method),
    });
  }

  private handleSubmitError(err: unknown, method: string) {
    if (needsPrivilegedSession(err)) {
      // Kratos' own redirect target carries its internal address, so the
      // sign-in page is built here; it explains why it is shown.
      this.leaveTo(reauthUrl(window.location));
      return;
    }
    const redirect = browserRedirect(err, window.location.origin);
    if (redirect?.kind === 'follow') {
      this.leaveTo(redirect.url);
      return;
    }
    this.busy = false;
    if (redirect?.kind === 'other-origin') {
      this.otherOriginUrl = samePageUnder(redirect.origin, window.location);
      return;
    }
    const flow = flowFromError(err);
    if (flow) {
      this.showFlow(flow);
      this.messages = flowMessages(flow);
      if (this.messages.length > 0) {
        return;
      }
    }
    this.errorService.handleError(AccountComponent.name, method, err);
    // An expired or rejected flow cannot be submitted again.
    this.loadFreshFlow();
  }
}

// The sign-in page with a forced re-authentication, returning here. The flow
// parameter is dropped: it describes the attempt that was just refused.
export function reauthUrl(location: Pick<Location, 'pathname' | 'search'>): string {
  const params = new URLSearchParams(location.search);
  params.delete('flow');
  const query = params.toString();
  const back = location.pathname + (query ? '?' + query : '');
  return environment.uiBaseUrl + '/login?refresh=true&return_to=' + encodeURIComponent(back);
}
