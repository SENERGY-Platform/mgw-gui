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
  hasDefault: boolean;
}

interface FileGroupFileRow {
  path: string;
  format: string;
  text: string;
}

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
    // deployment.id check: see the is_deployed workaround in the edit page
    const deployment =
      this.prefill && (this.module.is_deployed || this.module.deployment?.id) ? this.module.deployment : undefined;

    for (const [ref, input] of Object.entries(inputs.configs || {})) {
      var config = (this.module.configs || {})[ref];
      if (!config) {
        continue;
      }
      const globalId = deployment?.global_configs?.[ref] || '';
      const existing = deployment?.configs?.[ref];
      this.configRows.push({
        ref: ref,
        input: input as ModuleInput,
        config: config,
        required: config.required,
        raw: existing ? formatConfigValue(existing) : this.defaultRaw(config),
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
      this.fileRows.push({
        ref: ref,
        input: input as ModuleInput,
        required: file?.required || false,
        text: decodeFileData(existingData !== undefined ? existingData : file?.default_data || ''),
        hasDefault: !!file?.default_data,
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

  private defaultRaw(config: ModuleConfigValue): string {
    if (config.default === null || config.default === undefined) {
      return '';
    }
    if (config.is_slice && Array.isArray(config.default)) {
      return config.default.join('\n');
    }
    return String(config.default);
  }

  // flattened path of the nested input groups, e.g. "Broker / Advanced"
  groupLabel(groupRef: string): string {
    const groups = this.module.inputs?.groups || {};
    const parts: string[] = [];
    let ref = groupRef;
    let guard = 0;
    while (ref && groups[ref] && guard < 10) {
      parts.unshift(groups[ref].name || ref);
      ref = groups[ref].group;
      guard++;
    }
    return parts.join(' / ');
  }

  secretOptionsFor(row: SecretRow): Secret[] {
    if (!row.type) {
      return this.secrets;
    }
    return this.secrets.filter((secret) => secret.type === row.type);
  }

  addGroupFile(row: FileGroupRow) {
    row.files.push({path: '', format: '', text: ''});
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
