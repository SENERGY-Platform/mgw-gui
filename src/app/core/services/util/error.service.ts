/*
 *
 *     Copyright 2018 InfAI (CC SES)
 *
 *     Licensed under the Apache License, Version 2.0 (the “License”);
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an “AS IS” BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 *
 */

import {HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {throwError} from 'rxjs';
import {ErrorDialogComponent} from '../../components/error-dialog/error-dialog.component';
import {safeInjectTransloco} from '../language/safe-transloco';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  // No template is involved anywhere in this method - the snackbar and its
  // action button take plain strings, not bindings a `transloco` pipe could
  // sit on - so this is the one place in core that calls
  // TranslocoService.translate() directly rather than translating through a
  // template. Keys passed to a direct call have to be written out in full
  // ("core.xxx"): unlike the pipe, translate() has no ambient scope to
  // prefix them with on its own. See safeInjectTransloco for why this is not
  // a plain `inject(TranslocoService)`.
  //
  // That also means this text can only be as fresh as the 'core' scope's
  // translation file is by the time an error actually happens. In practice
  // that scope starts loading the moment the shell renders - before any
  // page has had a chance to fail a request - so by the time a user
  // triggers this, it has long since arrived.
  private readonly transloco = safeInjectTransloco();

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  private translate(key: string, params?: Record<string, unknown>): string {
    return this.transloco?.translate<string>(key, params) ?? key;
  }

  // Shows a short, readable notification with a Details action that opens the
  // full error. `context` says what failed in the user's terms ("Loading
  // modules failed"); without it a generic message is used. The raw error is
  // never shown in the notification itself - a 502 from the gateway is a page
  // of HTML.
  handleError(service: string, method: string, error: HttpErrorResponse | Error | any, context?: string) {
    let errorMessage: string;
    let status = 0;
    if (error instanceof HttpErrorResponse) {
      status = error.status;
      if (typeof error.error == 'object') {
        // e.g cant parse response body
        errorMessage = error.message;
      } else {
        // backend message
        errorMessage = error.error;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }

    console.error('Error =>> Service: ' + service + ' =>> Method: ' + method, errorMessage);

    let short = context || this.translate('core.errorDialog.defaultContext');
    if (status === 503) {
      // the module-manager serializes long-running operations: 503 means
      // another job is still active
      short = (context ? context + ' — ' : '') + this.translate('core.errorService.operationInProgress');
    } else if (status > 0) {
      short = short + ' ' + this.translate('core.errorService.httpStatusSuffix', {status});
    }

    this.snackBar
      .open(short, this.translate('core.errorService.detailsAction'), {panelClass: ['error'], duration: 10000})
      .onAction()
      .subscribe(() => {
        this.dialog.open(ErrorDialogComponent, {
          data: {
            context: short,
            source: service + '.' + method + (status > 0 ? ' — HTTP ' + status : ''),
            detail: errorMessage,
          },
        });
      });

    // Return an observable with a user-facing error message.
    return throwError(() => new Error(this.translate('core.errorService.genericError')));
  }
}
