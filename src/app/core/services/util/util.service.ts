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

import {Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Observable} from 'rxjs';
import {ConfirmDialogComponent} from '../../components/confirm-dialog/confirm-dialog.component';
import {JobLoaderModalComponent, JobResultKind} from '../../components/job-loader-modal/job-loader-modal.component';
import {JobResultDialogComponent} from '../../components/job-result-dialog/job-result-dialog.component';
import {hasFailures, JobResultItem} from '../../models/job-result-view';
import {NotificationService} from './notifications.service';

@Injectable({
  providedIn: 'root',
})
export class UtilService {
  constructor(
    public dialog: MatDialog,
    private notificationService: NotificationService,
  ) {}

  // Presents a job outcome: failures open the result dialog with per-item
  // errors and hints, a clean run only shows a short success notification.
  presentJobResult(title: string, items: JobResultItem[], successMessage?: string) {
    if (hasFailures(items)) {
      this.dialog.open(JobResultDialogComponent, {data: {title: title, items: items}});
    } else if (successMessage) {
      this.notificationService.showSuccess(successMessage);
    }
  }

  dateIsToday(dateTime: string | number): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let date = new Date(dateTime);
    if (typeof dateTime == 'number') {
      date = new Date(dateTime);
    }
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  }

  checkJobStatus(jobID: string, message: string, service: string, resultKind?: JobResultKind): Observable<any> {
    /*
      Shows a Modal with a loading circle.
      When the job completed successfully, the modal will close
      When the job returned an error, the modal will close with the error message
      For module-manager jobs, resultKind selects the /results endpoint whose
      typed result is returned in the close event.
    */

    const dialogRef = this.dialog.open(JobLoaderModalComponent, {
      data: {
        jobID: jobID,
        message: message,
        service: service,
        resultKind: resultKind,
      },
    });

    // TODO pipe and throw error when
    return dialogRef?.afterClosed();
  }

  objectIsEmptyOrNull(obj: any) {
    return obj === null || obj === undefined || Object.keys(obj).length === 0;
  }

  askForConfirmation(message: string): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {data: {message: message}});

    return dialogRef?.afterClosed();
  }
}
