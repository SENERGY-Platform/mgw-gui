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
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css'],
  imports: [MatButton, MatDialogTitle, MatDialogContent, MatDialogActions, TranslocoPipe],
  providers: [provideTranslocoScope('core')],
})
export class ConfirmDialogComponent {
  message!: string;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
  ) {
    this.message = data.message;
  }

  cancel() {
    this.dialogRef.close(false);
  }

  confirm() {
    this.dialogRef.close(true);
  }
}
