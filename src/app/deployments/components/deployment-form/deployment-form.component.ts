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

import {Component, Input, OnInit, inject} from '@angular/core';

import {FormsModule} from '@angular/forms';
import {MatFormField, MatHint} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {TranslocoPipe, TranslocoService, provideTranslocoScope} from '@jsverse/transloco';
import {
  decodeFileData,
  DeploymentRequestModule,
  DeploymentUserInput,
  encodeFileData,
  MODULE_DATA_TYPE_TO_NUMERIC,
  ModuleConfigValue,
  moduleConfigTypeOptionNumber,
  moduleInputGroupLabel,
  ModuleInput,
  parseModuleConfigValue,
} from 'src/app/core/models/deployment-request';
import {formatConfigValue, GlobalConfig} from 'src/app/core/models/global-configs';
import {Secret} from 'src/app/secrets/models/secret_models';
import {HostResource} from 'src/app/host/models/models';

interface ConfigRow {
  ref: string;
  input: ModuleInput;
  config: ModuleConfigValue;
  // mirrors config.required; kept as its own field so the template can read
  // it the same way for configs, secrets, resources and files
  required: boolean;
  raw: string;
  // the module default rendered the same way as `raw`, so the two can be
  // compared to tell whether the field still holds the default
  defaultRaw: string;
  hasDefault: boolean;
  useGlobal: boolean;
  globalConfigId: string;
  matchingGlobals: GlobalConfig[];
  error: string;
}

interface ResourceRow {
  ref: string;
  input: ModuleInput;
  required: boolean;
  selectedId: string;
  error: string;
}

interface SecretRow {
  ref: string;
  input: ModuleInput;
  type: string;
  required: boolean;
  selectedId: string;
  error: string;
}

interface FileRow {
  ref: string;
  input: ModuleInput;
  required: boolean;
  text: string;
  // the decoded module default, so it can be compared against the edited text
  defaultText: string;
  hasDefault: boolean;
  // content type from the module, e.g. generic, json, yaml; drives validation
  type: string;
  error: string;
}

interface FileGroupFileRow {
  path: string;
  format: string;
  text: string;
}

// Formats offered for a file of a file group. The module manager does not
// interpret the value; it tells the ui which editor a file expects, so the
// vocabulary follows the content types of ModuleFileDef.
const FILE_GROUP_FORMATS = ['generic', 'json', 'yaml', 'xml', 'ini', 'toml'];

interface FileGroupRow {
  ref: string;
  input: ModuleInput;
  files: FileGroupFileRow[];
  error: string;
}

// Configuration inputs carry the module's own grouping. Rendering that
// grouping instead of one flat list is what keeps a module with two dozen
// settings readable.
interface ConfigGroup {
  label: string;
  rows: ConfigRow[];
}

// One deployment form per module. The parent page loads the modules
// (deployment-request or the installed module for edits) and the selectable
// options, then collects a DeploymentUserInput per form on submit.
@Component({
  selector: 'deployment-form',
  templateUrl: './deployment-form.component.html',
  styleUrls: ['./deployment-form.component.css'],
  imports: [
    FormsModule,
    MatFormField,
    MatHint,
    MatInput,
    MatSelect,
    MatOption,
    MatSlideToggle,
    MatButton,
    MatIconButton,
    MatIcon,
    MatTooltip,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('deployments')],
})
export class DeploymentFormComponent implements OnInit {
  // Resolved directly rather than through the `transloco` pipe: the errors
  // below are plain string fields shown by ordinary interpolation, set once
  // validation runs - see the "TypeScript-only messages" section of the
  // project README.
  private readonly transloco = inject(TranslocoService);

  @Input() module!: DeploymentRequestModule;
  @Input() hostResources: HostResource[] = [];
  @Input() secrets: Secret[] = [];
  @Input() globalConfigs: GlobalConfig[] = [];
  // prefill from the existing deployment (edit mode)
  @Input() prefill = false;

  configRows: ConfigRow[] = [];
  configGroups: ConfigGroup[] = [];
  resourceRows: ResourceRow[] = [];
  secretRows: SecretRow[] = [];
  fileRows: FileRow[] = [];
  fileGroupRows: FileGroupRow[] = [];

  ngOnInit(): void {
    this.buildRows();
  }

  private buildRows() {
    const inputs = this.module.inputs || ({} as any);
    const deployment = this.prefill && this.module.is_deployed ? this.module.deployment : undefined;

    for (const [ref, input] of Object.entries(inputs.configs || {})) {
      var config = (this.module.configs || {})[ref];
      if (!config) {
        continue;
      }
      const globalId = deployment?.global_configs?.[ref] || '';
      const existing = deployment?.configs?.[ref];
      const defaultRaw = this.defaultRaw(config);
      this.configRows.push({
        ref: ref,
        input: input as ModuleInput,
        config: config,
        required: config.required,
        raw: existing ? formatConfigValue(existing) : defaultRaw,
        defaultRaw: defaultRaw,
        hasDefault: config.default !== null && config.default !== undefined,
        useGlobal: !!globalId,
        globalConfigId: globalId,
        matchingGlobals: this.globalConfigs.filter(
          (gc) => gc.data_type === MODULE_DATA_TYPE_TO_NUMERIC[config.data_type] && gc.is_slice === config.is_slice,
        ),
        error: '',
      });
    }

    for (const [ref, input] of Object.entries(inputs.resources || {})) {
      this.resourceRows.push({
        ref: ref,
        input: input as ModuleInput,
        required: (this.module.host_resources || {})[ref]?.required || false,
        selectedId: deployment?.host_resources?.[ref] || '',
        error: '',
      });
    }

    for (const [ref, input] of Object.entries(inputs.secrets || {})) {
      this.secretRows.push({
        ref: ref,
        input: input as ModuleInput,
        type: (this.module.secrets || {})[ref]?.type || '',
        required: (this.module.secrets || {})[ref]?.required || false,
        selectedId: deployment?.secrets?.[ref]?.id || '',
        error: '',
      });
    }

    for (const [ref, input] of Object.entries(inputs.files || {})) {
      const file = (this.module.files || {})[ref];
      const existingData = deployment?.files?.[ref];
      const defaultText = decodeFileData(file?.default_data || '');
      this.fileRows.push({
        ref: ref,
        input: input as ModuleInput,
        required: file?.required || false,
        text: existingData !== undefined ? decodeFileData(existingData) : defaultText,
        defaultText: defaultText,
        hasDefault: !!file?.default_data,
        type: file?.type || '',
        error: '',
      });
    }

    for (const [ref, input] of Object.entries(inputs.file_groups || {})) {
      const existingGroup = deployment?.file_groups?.[ref];
      this.fileGroupRows.push({
        ref: ref,
        input: input as ModuleInput,
        files: (existingGroup?.files || []).map((f) => ({
          path: f.path,
          format: f.format,
          text: decodeFileData(f.data),
        })),
        error: '',
      });
    }

    const byGroup = (a: {input: ModuleInput}, b: {input: ModuleInput}) =>
      this.groupLabel(a.input.group).localeCompare(this.groupLabel(b.input.group)) ||
      a.input.name.localeCompare(b.input.name);
    this.configRows.sort(byGroup);
    this.resourceRows.sort(byGroup);
    this.secretRows.sort(byGroup);
    this.configGroups = this.groupConfigRows();
  }

  // Preserves the sort order established above: rows are already ordered by
  // group label, so groups come out in the same order without a second sort.
  private groupConfigRows(): ConfigGroup[] {
    const groups: ConfigGroup[] = [];
    for (const row of this.configRows) {
      var label = this.groupLabel(row.input.group);
      let group = groups.find((g) => g.label === label);
      if (!group) {
        group = {label: label, rows: []};
        groups.push(group);
      }
      group.rows.push(row);
    }
    return groups;
  }

  hasInputs(): boolean {
    return (
      this.configRows.length > 0 ||
      this.resourceRows.length > 0 ||
      this.secretRows.length > 0 ||
      this.fileRows.length > 0 ||
      this.fileGroupRows.length > 0
    );
  }

  // true when the control is a plain text/number input rather than a select
  isFreeText(row: ConfigRow): boolean {
    if (row.config.is_slice || row.config.data_type === 'bool') {
      return false;
    }
    return !(row.config.options && row.config.options.length > 0 && !row.config.opt_ext);
  }

  isNumeric(row: ConfigRow): boolean {
    return row.config.data_type === 'int' || row.config.data_type === 'float';
  }

  // The number input needs the bare step value; type_opt wraps it together
  // with its data type.
  stepFor(row: ConfigRow): number | string {
    return moduleConfigTypeOptionNumber(row.config, 'step') ?? (row.config.data_type === 'int' ? 1 : 'any');
  }

  private defaultRaw(config: ModuleConfigValue): string {
    if (config.default === null || config.default === undefined) {
      return '';
    }
    if (config.is_slice && Array.isArray(config.default)) {
      return config.default.join('\n');
    }
    return String(config.default);
  }

  groupLabel(groupRef: string): string {
    return moduleInputGroupLabel(this.module.inputs, groupRef);
  }

  secretOptionsFor(row: SecretRow): Secret[] {
    if (!row.type) {
      return this.secrets;
    }
    return this.secrets.filter((secret) => secret.type === row.type);
  }

  resetToDefault(row: ConfigRow) {
    row.raw = row.defaultRaw;
    row.error = '';
  }

  resetFileToDefault(row: FileRow) {
    row.text = row.defaultText;
    row.error = '';
  }

  // Reformats valid JSON to a readable indentation on blur; a parse failure
  // sets the error and leaves the text as the user typed it.
  formatFileOnBlur(row: FileRow) {
    if (row.type !== 'json' || row.text.trim() === '') {
      return;
    }
    try {
      row.text = JSON.stringify(JSON.parse(row.text), null, 2);
      row.error = '';
    } catch (err) {
      row.error = this.transloco.translate<string>('deployments.form.errors.fileInvalidJson', {
        message: this.jsonErrorMessage(err),
      });
    }
  }

  // JSON.parse throws a SyntaxError, but a strict catch clause types it as
  // unknown; this narrows it to the message text shown to the user.
  private jsonErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
  }

  // A stored format the list does not know stays selectable, otherwise
  // editing a deployment would silently drop it.
  formatOptionsFor(file: FileGroupFileRow): string[] {
    if (file.format && !FILE_GROUP_FORMATS.includes(file.format)) {
      return [file.format, ...FILE_GROUP_FORMATS];
    }
    return FILE_GROUP_FORMATS;
  }

  addGroupFile(row: FileGroupRow) {
    row.files.push({path: '', format: 'generic', text: ''});
  }

  removeGroupFile(row: FileGroupRow, index: number) {
    row.files.splice(index, 1);
  }

  // Collects the user input for this module. Returns undefined and marks the
  // offending fields when validation fails.
  collect(): DeploymentUserInput | undefined {
    let valid = true;
    const result: DeploymentUserInput = {
      module_id: this.module.id,
      host_resources: {},
      secrets: {},
      configs: {},
      global_configs: {},
      files: {},
      file_groups: {},
    };

    for (const row of this.configRows) {
      row.error = '';
      if (row.useGlobal) {
        if (!row.globalConfigId) {
          row.error = this.transloco.translate<string>('deployments.form.errors.selectGlobalConfigOrValue');
          valid = false;
          continue;
        }
        result.global_configs[row.ref] = row.globalConfigId;
        continue;
      }
      if (row.raw.trim() === '') {
        // no input: fall back to the module default, unless there is none
        // to fall back to and the module needs a value regardless
        if (row.required && (row.config.default === null || row.config.default === undefined)) {
          row.error = this.transloco.translate<string>('deployments.form.errors.valueRequired');
          valid = false;
        }
        continue;
      }
      try {
        result.configs[row.ref] = parseModuleConfigValue(row.config, row.raw);
      } catch (err: any) {
        row.error = err.message;
        valid = false;
      }
    }

    for (const row of this.resourceRows) {
      row.error = '';
      if (row.selectedId) {
        result.host_resources[row.ref] = row.selectedId;
      } else if (row.required) {
        row.error = this.transloco.translate<string>('deployments.form.errors.selectHostResource');
        valid = false;
      }
    }

    for (const row of this.secretRows) {
      row.error = '';
      if (row.selectedId) {
        result.secrets[row.ref] = row.selectedId;
      } else if (row.required) {
        row.error = this.transloco.translate<string>('deployments.form.errors.selectSecret');
        valid = false;
      }
    }

    for (const row of this.fileRows) {
      row.error = '';
      if (row.text.trim() === '') {
        // no content: the module falls back to its own default, unless it ships
        // none and still cannot be deployed without content
        if (row.required && !row.hasDefault) {
          row.error = this.transloco.translate<string>('deployments.form.errors.fileContentRequired');
          valid = false;
          continue;
        }
      } else if (row.type === 'json') {
        try {
          JSON.parse(row.text);
        } catch (err) {
          row.error = this.transloco.translate<string>('deployments.form.errors.fileInvalidJson', {
            message: this.jsonErrorMessage(err),
          });
          valid = false;
          continue;
        }
      }
      if (row.text !== '' || row.required) {
        result.files[row.ref] = encodeFileData(row.text);
      }
    }

    for (const row of this.fileGroupRows) {
      row.error = '';
      const files: Record<string, any> = {};
      for (const file of row.files) {
        if (!file.path.trim()) {
          row.error = this.transloco.translate<string>('deployments.form.errors.fileGroupPathRequired');
          valid = false;
          continue;
        }
        files[file.path.trim()] = {format: file.format, data: encodeFileData(file.text)};
      }
      if (Object.keys(files).length > 0) {
        result.file_groups[row.ref] = files;
      }
    }

    return valid ? result : undefined;
  }
}
