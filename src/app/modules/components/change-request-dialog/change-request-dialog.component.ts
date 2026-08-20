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

import {Component, Inject} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {DatePipe} from '@angular/common';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {StatusPillComponent} from 'src/app/core/components/status-pill/status-pill.component';
import {ModulesChangeRequest} from 'src/app/core/models/modules';

// Shows the pending modules change request for review. Closes with
// 'execute', 'discard' or undefined (keep the request pending).
@Component({
  selector: 'change-request-dialog',
  templateUrl: './change-request-dialog.component.html',
  styleUrls: ['./change-request-dialog.component.css'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    MatIcon,
    StatusPillComponent,
    DatePipe,
  ],
})
export class ChangeRequestDialogComponent {
  request!: ModulesChangeRequest;

  constructor(
    public dialogRef: MatDialogRef<ChangeRequestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
  ) {
    this.request = data.request;
  }

  isEmpty(): boolean {
    return !this.request.install?.length && !this.request.change?.length && !this.request.remove?.length;
  }

  execute() {
    this.dialogRef.close('execute');
  }

  discard() {
    this.dialogRef.close('discard');
  }
}
