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
import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslocoService} from '@jsverse/transloco';
import {EMPTY} from 'rxjs';
import {provideTranslocoTesting} from 'src/testing/transloco-testing';
import {ErrorService} from './error.service';

describe('ErrorService', () => {
  let snackBar: {open: ReturnType<typeof vi.fn>};
  let dialog: {open: ReturnType<typeof vi.fn>};

  // ErrorService.translate() calls TranslocoService.translate() directly -
  // unlike the pipe, that never loads a scope itself, only reads whatever is
  // already cached. In the real application the shell's own templates have
  // already loaded 'core' long before a request can fail (see the README's
  // i18n section); simulated here by loading it before each test the same
  // way the pipe would, rather than the assertions racing an on-demand load.
  function create(): ErrorService {
    const service = TestBed.inject(ErrorService);
    TestBed.inject(TranslocoService).load('core/en').subscribe();
    return service;
  }

  beforeEach(() => {
    snackBar = {open: vi.fn().mockReturnValue({onAction: () => EMPTY})};
    dialog = {open: vi.fn()};

    TestBed.configureTestingModule({
      imports: [provideTranslocoTesting('core')],
      providers: [
        {provide: MatSnackBar, useValue: snackBar},
        {provide: MatDialog, useValue: dialog},
      ],
    });
  });

  it('shows the translated fallback text when no context is given', () => {
    create().handleError('Svc', 'method', new Error('boom'));

    expect(snackBar.open).toHaveBeenCalledWith('The last action failed', 'Details', expect.anything());
  });

  it('keeps the caller-supplied context untranslated', () => {
    create().handleError('Svc', 'method', new Error('boom'), 'Loading modules failed');

    expect(snackBar.open).toHaveBeenCalledWith('Loading modules failed', 'Details', expect.anything());
  });

  it('appends the translated "another operation is running" text on a 503', () => {
    const error = new HttpErrorResponse({status: 503, error: 'busy'});

    create().handleError('Svc', 'method', error, 'Deleting module');

    expect(snackBar.open).toHaveBeenCalledWith(
      'Deleting module — Another operation is still running, please wait for it to finish.',
      'Details',
      expect.anything(),
    );
  });

  it('says the backend is unreachable on a gateway 502 instead of showing a status code', () => {
    // what nginx actually returns when the host binaries are down
    const error = new HttpErrorResponse({status: 502, error: '<html><body><h1>502 Bad Gateway</h1></body></html>'});

    create().handleError('Svc', 'method', error, 'Loading modules failed');

    expect(snackBar.open).toHaveBeenCalledWith(
      'Loading modules failed — The backend service is not reachable',
      'Details',
      expect.anything(),
    );
  });

  it('appends the translated HTTP status suffix for any other HTTP error', () => {
    // 404 and not 502: gateway statuses carry their own wording now
    const error = new HttpErrorResponse({status: 404, error: 'not found'});

    create().handleError('Svc', 'method', error, 'Loading modules failed');

    expect(snackBar.open).toHaveBeenCalledWith('Loading modules failed (HTTP 404)', 'Details', expect.anything());
  });

  it('still works when nothing configured Transloco, falling back to the bare key', () => {
    // No provideTranslocoTesting() in this module - the constructible-anywhere
    // guarantee safeInjectTransloco exists for (see the README's i18n section).
    // Not using create(): that also injects TranslocoService to load 'core',
    // which would defeat the point of this test by configuring Transloco.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {provide: MatSnackBar, useValue: snackBar},
        {provide: MatDialog, useValue: dialog},
      ],
    });

    expect(() => TestBed.inject(ErrorService).handleError('Svc', 'method', new Error('boom'))).not.toThrow();
    expect(snackBar.open).toHaveBeenCalledWith(
      'core.errorDialog.defaultContext',
      'core.errorService.detailsAction',
      expect.anything(),
    );
  });
});
