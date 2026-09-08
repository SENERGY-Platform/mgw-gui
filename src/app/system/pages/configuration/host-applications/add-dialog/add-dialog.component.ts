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

import {Component, OnInit} from '@angular/core';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';

export interface DialogData {
  name: string;
  socket: string;
}

@Component({
  selector: 'app-add-dialog',
  imports: [
    MatFormField,
    MatInput,
    MatLabel,
    MatDialogContent,
    MatDialogTitle,
    MatButton,
    MatDialogActions,
    FormsModule,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  templateUrl: './add-dialog.component.html',
  styleUrl: './add-dialog.component.css',
  providers: [provideTranslocoScope('system')],
})
export class AddDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    readonly dialogRef: MatDialogRef<AddDialogComponent>,
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      name: [null, Validators.required],
      socket: [null, Validators.required],
    });
  }

  submit(form: {value: DialogData}) {
    this.dialogRef.close(form.value);
  }
}
