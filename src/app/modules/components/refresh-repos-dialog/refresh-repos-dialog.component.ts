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

import {FormsModule} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatIcon} from '@angular/material/icon';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';
import {Repository} from 'src/app/core/models/repositories';

// Lets the user pick which repositories to refresh. Closes with the selected
// sources (empty array = all) or undefined when cancelled. Refreshing only
// some repositories avoids GitHub rate limits during local development.
@Component({
  selector: 'refresh-repos-dialog',
  templateUrl: './refresh-repos-dialog.component.html',
  styleUrls: ['./refresh-repos-dialog.component.css'],
  imports: [
    FormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    MatCheckbox,
    MatIcon,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('modules')],
})
export class RefreshReposDialogComponent {
  repositories: Repository[] = [];
  selected: Record<string, boolean> = {};
  hasPendingChangeRequest = false;

  constructor(
    public dialogRef: MatDialogRef<RefreshReposDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
  ) {
    this.repositories = data.repositories || [];
    this.hasPendingChangeRequest = !!data.hasPendingChangeRequest;
    this.repositories.forEach((repo) => (this.selected[repo.source] = true));
  }

  selectedSources(): string[] {
    return this.repositories.map((repo) => repo.source).filter((source) => this.selected[source]);
  }

  allSelected(): boolean {
    return this.selectedSources().length === this.repositories.length;
  }

  refresh() {
    // no filter when everything is selected
    this.dialogRef.close(this.allSelected() ? [] : this.selectedSources());
  }
}
