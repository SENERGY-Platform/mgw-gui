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

import {Component, Input, OnInit} from '@angular/core';
import {NgFor, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle} from '@angular/material/card';
import {MatFormField, MatHint, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {
  decodeFileData,
  DeploymentRequestModule,
  DeploymentUserInput,
  encodeFileData,
  MODULE_DATA_TYPE_TO_NUMERIC,
  ModuleConfigValue,
  ModuleInput,
  parseModuleConfigValue
} from 'src/app/core/models/deployment-request';
import {formatConfigValue, GlobalConfig} from 'src/app/core/models/global-configs';
import {Secret} from 'src/app/secrets/models/secret_models';
import {HostResource} from 'src/app/host/models/models';

interface ConfigRow {
  ref: string;
  input: ModuleInput;
  config: ModuleConfigValue;
  raw: string;
  useGlobal: boolean;
  globalConfigId: string;
  matchingGlobals: GlobalConfig[];
  error: string;
}

interface ResourceRow {
  ref: string;
  input: ModuleInput;
  selectedId: string;
  error: string;
}

interface SecretRow {
  ref: string;
  input: ModuleInput;
  type: string;
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

// One deployment form per module. The parent page loads the modules
// (deployment-request or the installed module for edits) and the selectable
// options, then collects a DeploymentUserInput per form on submit.
@Component({
  selector: 'deployment-form',
  templateUrl: './deployment-form.component.html',
  styleUrls: ['./deployment-form.component.css'],
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, MatFormField, MatLabel, MatHint, MatInput, MatSelect, MatOption, MatCheckbox, MatIconButton, MatIcon, MatTooltip]
})
export class DeploymentFormComponent implements OnInit {
  @Input() module!: DeploymentRequestModule
  @Input() hostResources: HostResource[] = []
  @Input() secrets: Secret[] = []
  @Input() globalConfigs: GlobalConfig[] = []
  // prefill from the existing deployment (edit mode)
  @Input() prefill: boolean = false

  configRows: ConfigRow[] = []
  resourceRows: ResourceRow[] = []
  secretRows: SecretRow[] = []
  fileRows: FileRow[] = []
  fileGroupRows: FileGroupRow[] = []

  ngOnInit(): void {
    this.buildRows()
  }

  private buildRows() {
    var inputs = this.module.inputs || <any>{}
    // deployment.id check: see the is_deployed workaround in the edit page
    var deployment = (this.prefill && (this.module.is_deployed || this.module.deployment?.id)) ? this.module.deployment : undefined

    for (const [ref, input] of Object.entries(inputs.configs || {})) {
      var config = (this.module.configs || {})[ref]
      if (!config) {
        continue
      }
      var globalId = deployment?.global_configs?.[ref] || ""
      var existing = deployment?.configs?.[ref]
      this.configRows.push({
        ref: ref,
        input: <ModuleInput>input,
        config: config,
        raw: existing ? formatConfigValue(existing) : this.defaultRaw(config),
        useGlobal: !!globalId,
        globalConfigId: globalId,
        matchingGlobals: this.globalConfigs.filter(gc =>
          gc.data_type === MODULE_DATA_TYPE_TO_NUMERIC[config.data_type] && gc.is_slice === config.is_slice),
        error: "",
      })
    }

    for (const [ref, input] of Object.entries(inputs.resources || {})) {
      this.resourceRows.push({
        ref: ref,
        input: <ModuleInput>input,
        selectedId: deployment?.host_resources?.[ref] || "",
        error: "",
      })
    }

    for (const [ref, input] of Object.entries(inputs.secrets || {})) {
      this.secretRows.push({
        ref: ref,
        input: <ModuleInput>input,
        type: (this.module.secrets || {})[ref]?.type || "",
        selectedId: deployment?.secrets?.[ref]?.id || "",
        error: "",
      })
    }

    for (const [ref, input] of Object.entries(inputs.files || {})) {
      var file = (this.module.files || {})[ref]
      var existingData = deployment?.files?.[ref]
      this.fileRows.push({
        ref: ref,
        input: <ModuleInput>input,
        required: file?.required || false,
        text: decodeFileData(existingData !== undefined ? existingData : (file?.default_data || "")),
        hasDefault: !!file?.default_data,
      })
    }

    for (const [ref, input] of Object.entries(inputs.file_groups || {})) {
      var existingGroup = deployment?.file_groups?.[ref]
      this.fileGroupRows.push({
        ref: ref,
        input: <ModuleInput>input,
        files: (existingGroup?.files || []).map(f => ({path: f.path, format: f.format, text: decodeFileData(f.data)})),
        error: "",
      })
    }

    var byGroup = (a: { input: ModuleInput }, b: { input: ModuleInput }) =>
      this.groupLabel(a.input.group).localeCompare(this.groupLabel(b.input.group)) || a.input.name.localeCompare(b.input.name)
    this.configRows.sort(byGroup)
    this.resourceRows.sort(byGroup)
    this.secretRows.sort(byGroup)
  }

  private defaultRaw(config: ModuleConfigValue): string {
    if (config.default === null || config.default === undefined) {
      return ""
    }
    if (config.is_slice && Array.isArray(config.default)) {
      return config.default.join("\n")
    }
    return String(config.default)
  }

  // flattened path of the nested input groups, e.g. "Broker / Advanced"
  groupLabel(groupRef: string): string {
    var groups = this.module.inputs?.groups || {}
    var parts: string[] = []
    var ref = groupRef
    var guard = 0
    while (ref && groups[ref] && guard < 10) {
      parts.unshift(groups[ref].name || ref)
      ref = groups[ref].group
      guard++
    }
    return parts.join(" / ")
  }

  secretOptionsFor(row: SecretRow): Secret[] {
    if (!row.type) {
      return this.secrets
    }
    return this.secrets.filter(secret => secret.type === row.type)
  }

  addGroupFile(row: FileGroupRow) {
    row.files.push({path: "", format: "", text: ""})
  }

  removeGroupFile(row: FileGroupRow, index: number) {
    row.files.splice(index, 1)
  }

  // Collects the user input for this module. Returns undefined and marks the
  // offending fields when validation fails.
  collect(): DeploymentUserInput | undefined {
    var valid = true
    var result: DeploymentUserInput = {
      module_id: this.module.id,
      host_resources: {},
      secrets: {},
      configs: {},
      global_configs: {},
      files: {},
      file_groups: {},
    }

    for (const row of this.configRows) {
      row.error = ""
      if (row.useGlobal) {
        if (!row.globalConfigId) {
          row.error = "Select a global config or switch back to a direct value"
          valid = false
          continue
        }
        result.global_configs[row.ref] = row.globalConfigId
        continue
      }
      if (row.raw.trim() === "") {
        // no input: fall back to the module default
        continue
      }
      try {
        result.configs[row.ref] = parseModuleConfigValue(row.config, row.raw)
      } catch (err: any) {
        row.error = err.message
        valid = false
      }
    }

    for (const row of this.resourceRows) {
      row.error = ""
      if (row.selectedId) {
        result.host_resources[row.ref] = row.selectedId
      }
    }

    for (const row of this.secretRows) {
      row.error = ""
      if (row.selectedId) {
        result.secrets[row.ref] = row.selectedId
      }
    }

    for (const row of this.fileRows) {
      if (row.text !== "" || row.required) {
        result.files[row.ref] = encodeFileData(row.text)
      }
    }

    for (const row of this.fileGroupRows) {
      row.error = ""
      var files: Record<string, any> = {}
      for (const file of row.files) {
        if (!file.path.trim()) {
          row.error = "Every file of the group needs a path"
          valid = false
          continue
        }
        files[file.path.trim()] = {format: file.format, data: encodeFileData(file.text)}
      }
      if (Object.keys(files).length > 0) {
        result.file_groups[row.ref] = files
      }
    }

    return valid ? result : undefined
  }
}
