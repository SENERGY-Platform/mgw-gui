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

import {Component, inject} from '@angular/core';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

import {FormsModule} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatFormField, MatHint, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {TranslocoPipe, TranslocoService, provideTranslocoScope} from '@jsverse/transloco';

// The repository definition is passed verbatim to the backend's type handler,
// so the dialog takes it as JSON (deliberately simple, see SNRGY-4587).
// Closes with {type, definition} or undefined when cancelled.
const GITHUB_TEMPLATE = {
  owner: 'SENERGY-Platform',
  repository: 'mgw-module-repository',
  reference: 'refs/heads/main',
  priority: 1,
  channels: [{name: 'main', priority: 1, blacklist: []}],
};

@Component({
  selector: 'add-repository-dialog',
  templateUrl: './add-repository-dialog.component.html',
  styleUrls: ['./add-repository-dialog.component.css'],
  imports: [
    FormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    MatFormField,
    MatLabel,
    MatHint,
    MatInput,
    MatSelect,
    MatOption,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('modules')],
})
export class AddRepositoryDialogComponent {
  repositoryType = 'github.com';
  definitionJson: string = JSON.stringify(GITHUB_TEMPLATE, null, 2);
  error = '';

  // Field injection, not a constructor parameter: new dependencies follow
  // the prefer-inject rule; the parameters above predate it.
  private readonly transloco = inject(TranslocoService);

  constructor(public dialogRef: MatDialogRef<AddRepositoryDialogComponent>) {}

  save() {
    this.error = '';
    let definition: any;
    try {
      definition = JSON.parse(this.definitionJson);
    } catch (err: any) {
      this.error = this.transloco.translate<string>('modules.addRepositoryDialog.invalidJson', {message: err.message});
      return;
    }
    this.dialogRef.close({type: this.repositoryType, definition: definition});
  }
}
