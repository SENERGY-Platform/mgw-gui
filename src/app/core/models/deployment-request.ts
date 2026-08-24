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

// Models for creating and updating deployments with the next-gen
// module-manager. Mirrors mgw-module-manager/lib/models/deployments.go and
// the input metadata of mgw-module-lib/model; field names follow the JSON
// tags of the Go structs.

import {ErrorResult} from './jobs';
import {InterfaceValue} from './global-configs';

// mgw-module-lib uses string data types, the global config API numeric ones
export const MODULE_DATA_TYPE_TO_NUMERIC: Record<string, number> = {
  string: 1,
  int: 2,
  float: 3,
  bool: 4,
};

export interface ModuleInput {
  name: string;
  description: string;
  // reference of the group this input belongs to (inputs.groups)
  group: string;
}

export interface ModuleInputGroup {
  name: string;
  description: string;
  // reference of the parent group
  group: string;
}

export interface ModuleInputs {
  resources: Record<string, ModuleInput> | null;
  secrets: Record<string, ModuleInput> | null;
  configs: Record<string, ModuleInput> | null;
  files: Record<string, ModuleInput> | null;
  file_groups: Record<string, ModuleInput> | null;
  groups: Record<string, ModuleInputGroup> | null;
}

export interface ModuleConfigValue {
  default: any;
  // allowed values matching data_type, null if unrestricted
  options: any[] | null;
  // accept values outside of options
  opt_ext: boolean;
  // validation definition, e.g. text, number
  type: string;
  // type specific constraints: min, max, step, regex, min_len, max_len
  type_opt: Record<string, any> | null;
  // string data type: string, int, float, bool
  data_type: string;
  is_slice: boolean;
  required: boolean;
}

export interface ModuleSecretDef {
  // secret type as defined by the secret manager, e.g. certificate, basic-auth
  type: string;
  required: boolean;
}

export interface ModuleHostResourceDef {
  required: boolean;
}

export interface ModuleFileDef {
  // content type, e.g. generic, json, yaml
  type: string;
  required: boolean;
  // default content as base64, only exposed by the module-manager wrapper
  default_data: string;
}

// Subset of the full module returned by /deployment-request and
// /modules/{MOD_ID}, limited to what the deployment form needs.
export interface DeploymentRequestModule extends ErrorResult {
  id: string;
  name: string;
  description: string;
  version: string;
  inputs: ModuleInputs;
  configs: Record<string, ModuleConfigValue> | null;
  secrets: Record<string, ModuleSecretDef> | null;
  host_resources: Record<string, ModuleHostResourceDef> | null;
  files: Record<string, ModuleFileDef> | null;
  is_deployed: boolean;
  deployment: DeploymentDetails;
}

export interface DeploymentSecretValue {
  id: string;
}

export interface DeploymentFileGroupFile {
  path: string;
  format: string;
  // base64 encoded content
  data: string;
}

export interface DeploymentFileGroup {
  id: string;
  files: DeploymentFileGroupFile[];
}

// Full deployment as embedded in a module, used to prefill the edit form.
export interface DeploymentDetails extends ErrorResult {
  id: string;
  module_version: string;
  enabled: boolean;
  host_resources: Record<string, string> | null;
  secrets: Record<string, DeploymentSecretValue> | null;
  configs: Record<string, InterfaceValue> | null;
  global_configs: Record<string, string> | null;
  files: Record<string, string> | null;
  file_groups: Record<string, DeploymentFileGroup> | null;
}

export interface DeploymentFileGroupUserInput {
  format: string;
  data: string;
}

export interface DeploymentUserInput {
  module_id: string;
  host_resources: Record<string, string>;
  secrets: Record<string, string>;
  configs: Record<string, any>;
  global_configs: Record<string, string>;
  files: Record<string, string>;
  file_groups: Record<string, Record<string, DeploymentFileGroupUserInput>>;
}

// Parses one raw string into the module-lib data type. Throws on invalid input.
export function parseModuleConfigItem(dataType: string, raw: string): any {
  raw = raw.trim();
  switch (dataType) {
    case 'int': {
      if (!/^[+-]?\d+$/.test(raw)) {
        throw new Error("'" + raw + "' is not an integer");
      }
      return Number(raw);
    }
    case 'float': {
      if (raw === '' || isNaN(Number(raw))) {
        throw new Error("'" + raw + "' is not a number");
      }
      return Number(raw);
    }
    case 'bool': {
      if (raw === 'true') {
        return true;
      }
      if (raw === 'false') {
        return false;
      }
      throw new Error("'" + raw + "' is not a boolean (use true or false)");
    }
    default:
      return raw;
  }
}

// Client-side counterpart of the mgw-module-lib validation definitions
// (validation/configs/definitions): number -> min/max/step, text -> regex,
// min_len, max_len, plus the options restriction. The module-manager
// validates again server-side; this only surfaces errors early.
export function validateModuleConfigItem(config: ModuleConfigValue, value: any): void {
  const opt = config.type_opt || {};
  if (typeof value === 'number') {
    if (opt['min'] !== undefined && opt['min'] !== null && value < opt['min']) {
      throw new Error(value + ' is below the minimum of ' + opt['min']);
    }
    if (opt['max'] !== undefined && opt['max'] !== null && value > opt['max']) {
      throw new Error(value + ' is above the maximum of ' + opt['max']);
    }
  }
  if (typeof value === 'string') {
    if (opt['min_len'] && value.length < opt['min_len']) {
      throw new Error('must be at least ' + opt['min_len'] + ' characters long');
    }
    if (opt['max_len'] && value.length > opt['max_len']) {
      throw new Error('must be at most ' + opt['max_len'] + ' characters long');
    }
    if (opt['regex'] && !new RegExp(opt['regex']).test(value)) {
      throw new Error("'" + value + "' does not match " + opt['regex']);
    }
  }
  if (config.options && config.options.length > 0 && !config.opt_ext && !config.options.includes(value)) {
    throw new Error("'" + value + "' is not one of the allowed values");
  }
}

// Parses and validates the raw form input of a module config (one line per
// item for slices). Returns the typed value or throws.
export function parseModuleConfigValue(config: ModuleConfigValue, raw: string): any {
  if (!config.is_slice) {
    const value = parseModuleConfigItem(config.data_type, raw);
    validateModuleConfigItem(config, value);
    return value;
  }
  const items = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
  if (items.length === 0) {
    throw new Error('a list needs at least one value (one per line)');
  }
  return items.map((item) => {
    const value = parseModuleConfigItem(config.data_type, item);
    validateModuleConfigItem(config, value);
    return value;
  });
}

// base64 helpers for file contents (UTF-8 safe)
export function encodeFileData(text: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(text)));
}

export function decodeFileData(data: string): string {
  if (!data) {
    return '';
  }
  return new TextDecoder().decode(Uint8Array.from(atob(data), (c) => c.charCodeAt(0)));
}
