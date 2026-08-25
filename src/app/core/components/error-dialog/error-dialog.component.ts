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
  MatDialogTitle,
} from '@angular/material/dialog';

import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';

// Shows the full error behind a short notification: what failed (context),
// where it happened technically, and the raw response for diagnosis.
@Component({
  selector: 'error-dialog',
  templateUrl: './error-dialog.component.html',
  styleUrls: ['./error-dialog.component.css'],
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButton, MatIcon, TranslocoPipe],
  providers: [provideTranslocoScope('core')],
})
export class ErrorDialogComponent {
  // Empty rather than defaulted here: an empty context means "show the
  // fallback text", and the template is what decides what that text is, so
  // that it goes through the transloco pipe like everything else instead of
  // being resolved once, synchronously, before the translation may even have
  // loaded.
  context: string;
  source: string;
  detail: string;

  constructor(@Inject(MAT_DIALOG_DATA) data: any) {
    this.context = data.context || '';
    this.source = data.source || '';
    this.detail = data.detail || '';
  }
}
