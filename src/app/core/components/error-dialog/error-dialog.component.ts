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
  MatDialogTitle
} from '@angular/material/dialog';
import {NgIf} from '@angular/common';
import {MatButton} from '@angular/material/button';

// Shows the full error behind a short notification: what failed (context),
// where it happened technically, and the raw response for diagnosis.
@Component({
    selector: 'error-dialog',
    templateUrl: './error-dialog.component.html',
    styleUrls: ['./error-dialog.component.css'],
    imports: [NgIf, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButton]
})
export class ErrorDialogComponent {
  context: string
  source: string
  detail: string

  constructor(@Inject(MAT_DIALOG_DATA) data: any) {
    this.context = data.context || "The last action failed"
    this.source = data.source || ""
    this.detail = data.detail || ""
  }
}
