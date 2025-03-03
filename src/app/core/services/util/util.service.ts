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
import {JobLoaderModalComponent} from '../../components/job-loader-modal/job-loader-modal.component';


@Injectable({
  providedIn: 'root'
})
export class UtilService {
  constructor(
    public dialog: MatDialog
  ) {
  }

  dateIsToday(dateTime: string | number): Boolean {
    var today = new Date()
    today.setHours(0, 0, 0, 0)

    var date = new Date(dateTime)
    if (typeof (dateTime) == 'number') {
      date = new Date(dateTime)
    }
    date.setHours(0, 0, 0, 0)
    return date.getTime() === today.getTime()
  }


  checkJobStatus(jobID: string, message: string, service: string): Observable<any> {
    /*
      Shows a Modal with a loading circle.
      When the job completed successfully, the modal will close
      When the job returned an error, the modal will close with the error message
    */

    var dialogRef = this.dialog.open(JobLoaderModalComponent, {
      data: {
        jobID: jobID,
        message: message,
        service: service
      }
    });

    // TODO pipe and throw error when
    return dialogRef?.afterClosed()
  }

  objectIsEmptyOrNull(obj: any) {
    return obj === null || obj === undefined || Object.keys(obj).length === 0;
  }

  askForConfirmation(message: string): Observable<boolean> {
    var dialogRef = this.dialog.open(ConfirmDialogComponent, {data: {message: message}});

    return dialogRef?.afterClosed()
  }
}
