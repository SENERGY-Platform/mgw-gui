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

import {BreakpointObserver} from '@angular/cdk/layout';
import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {EMPTY, Subject, of} from 'rxjs';
import type {Mock} from 'vitest';
import {AuthService} from '../../services/auth/auth.service';
import {telemetryConsent} from '../../services/telemetry/telemetry-consent';
import {ThemeService} from '../../services/theme/theme.service';
import {ErrorService} from '../../services/util/error.service';
import {FeedbackDialogComponent} from '../feedback-dialog/feedback-dialog.component';
import {TelemetryConsentDialogComponent} from '../telemetry-consent-dialog/telemetry-consent-dialog.component';
import {ShellComponent} from './shell.component';

describe('ShellComponent', () => {
  let shell: ShellComponent;
  let dialog: {open: Mock};
  let closed: Subject<unknown>;

  beforeEach(() => {
    closed = new Subject<unknown>();
    dialog = {
      open: vi.fn().mockReturnValue({afterClosed: () => closed.asObservable()}),
    };

    TestBed.configureTestingModule({
      providers: [
        ShellComponent,
        {provide: MatDialog, useValue: dialog},
        {provide: Router, useValue: {url: '/', events: EMPTY, navigateByUrl: () => undefined}},
        {provide: AuthService, useValue: {}},
        {provide: ErrorService, useValue: {}},
        {provide: BreakpointObserver, useValue: {observe: () => of({matches: false, breakpoints: {}})}},
        {provide: ThemeService, useValue: {}},
      ],
    });

    // The consent store is a module singleton shared with every other spec in
    // the run, and Jasmine orders them randomly.
    telemetryConsent.reset();
    shell = TestBed.inject(ShellComponent);
  });

  afterEach(() => {
    telemetryConsent.reset();
  });

  describe('the consent question', () => {
    it('is asked once the shell has settled', fakeAsync(() => {
      shell.ngOnInit();
      tick();

      expect(dialog.open).toHaveBeenCalledWith(TelemetryConsentDialogComponent);
    }));

    it('is not asked at all once it has been answered', fakeAsync(() => {
      telemetryConsent.set(0);

      shell.ngOnInit();
      tick();

      expect(dialog.open).not.toHaveBeenCalled();
    }));

    it('is dropped when the shell goes away before it is due', fakeAsync(() => {
      // Signing out during the deferral, for instance: the dialog would
      // otherwise open on top of whatever replaced the shell.
      shell.ngOnInit();
      shell.ngOnDestroy();
      tick();

      expect(dialog.open).not.toHaveBeenCalled();
    }));
  });

  describe('the feedback dialog', () => {
    it('opens', () => {
      shell.openFeedback();

      expect(dialog.open).toHaveBeenCalledWith(FeedbackDialogComponent);
    });

    it('opens only once however often the icon is clicked', () => {
      // MatDialog stacks whatever it is asked to open. Two feedback dialogs
      // share one held recording, and the second one closing used to throw
      // away what the first was still deciding about.
      shell.openFeedback();
      shell.openFeedback();

      expect(dialog.open).toHaveBeenCalledTimes(1);
    });

    it('opens again once the first one has closed', () => {
      shell.openFeedback();
      closed.next(undefined);

      shell.openFeedback();

      expect(dialog.open).toHaveBeenCalledTimes(2);
    });
  });
});
