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
import {JobResultItem} from 'src/app/core/models/job-result-view';

// Presents the outcome of a job per item: what succeeded, what failed with
// which error, and - where the cause is known - how to resolve it.
@Component({
  selector: 'job-result-dialog',
  templateUrl: './job-result-dialog.component.html',
  styleUrls: ['./job-result-dialog.component.css'],
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButton, MatIcon, TranslocoPipe],
  providers: [provideTranslocoScope('core')],
})
export class JobResultDialogComponent {
  // Empty rather than defaulted to 'Result' here, for the same reason as
  // ErrorDialogComponent's context: the template decides the fallback text,
  // through the transloco pipe, rather than this constructor resolving it
  // once before the translation may even have loaded.
  title: string;
  items: JobResultItem[];

  constructor(@Inject(MAT_DIALOG_DATA) data: any) {
    this.title = data.title || '';
    this.items = data.items || [];
  }

  failedCount(): number {
    return this.items.filter((item) => !item.ok).length;
  }

  /** The plural form to use for the "N of M failed" summary - see the JSON for both forms. */
  summaryKey(): string {
    return `core.jobResultDialog.summary.${this.items.length === 1 ? 'one' : 'other'}`;
  }
}
