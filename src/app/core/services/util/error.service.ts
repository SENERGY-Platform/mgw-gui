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

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

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

    let short = context || 'The last action failed';
    if (status === 503) {
      // the module-manager serializes long-running operations: 503 means
      // another job is still active
      short = (context ? context + ' — ' : '') + 'Another operation is still running, please wait for it to finish.';
    } else if (status > 0) {
      short = short + ' (HTTP ' + status + ')';
    }

    this.snackBar
      .open(short, 'Details', {panelClass: ['error'], duration: 10000})
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
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}
