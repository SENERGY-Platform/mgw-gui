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
import {MatFormField, MatHint, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {
  DATA_TYPE_BOOL,
  DATA_TYPE_FLOAT,
  DATA_TYPE_INT,
  DATA_TYPE_STRING,
  formatConfigValue,
  GlobalConfig,
  GlobalConfigInput,
  parseConfigValue,
} from 'src/app/core/models/global-configs';

// Create or edit a global config. The input field adapts to the selected
// data type; the value is sent with the matching JSON type. Closes with a
// GlobalConfigInput or undefined when cancelled.
@Component({
  selector: 'global-config-dialog',
  templateUrl: './global-config-dialog.component.html',
  styleUrls: ['./global-config-dialog.component.css'],
  imports: [
    FormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    MatCheckbox,
    MatFormField,
    MatLabel,
    MatHint,
    MatInput,
    MatSelect,
    MatOption,
  ],
})
export class GlobalConfigDialogComponent {
  DATA_TYPE_STRING = DATA_TYPE_STRING;
  DATA_TYPE_INT = DATA_TYPE_INT;
  DATA_TYPE_FLOAT = DATA_TYPE_FLOAT;
  DATA_TYPE_BOOL = DATA_TYPE_BOOL;

  isEdit: boolean = false;
  name: string = '';
  dataType: number = DATA_TYPE_STRING;
  isSlice: boolean = false;
  rawValue: string = '';
  boolValue: string = 'true';
  error: string = '';

  constructor(
    public dialogRef: MatDialogRef<GlobalConfigDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
  ) {
    var config: GlobalConfig | undefined = data?.config;
    if (config) {
      this.isEdit = true;
      this.name = config.name;
      this.dataType = config.data_type;
      this.isSlice = config.is_slice;
      if (config.data_type === DATA_TYPE_BOOL && !config.is_slice) {
        this.boolValue = String(config.value);
      } else {
        this.rawValue = formatConfigValue(config);
      }
    }
  }

  save() {
    this.error = '';
    if (!this.name.trim()) {
      this.error = 'Name is required';
      return;
    }
    var raw = this.dataType === DATA_TYPE_BOOL && !this.isSlice ? this.boolValue : this.rawValue;
    var value: any;
    try {
      value = parseConfigValue(this.dataType, this.isSlice, raw);
    } catch (err: any) {
      this.error = err.message;
      return;
    }
    var input: GlobalConfigInput = {
      name: this.name.trim(),
      data_type: this.dataType,
      is_slice: this.isSlice,
      value: value,
    };
    this.dialogRef.close(input);
  }
}
