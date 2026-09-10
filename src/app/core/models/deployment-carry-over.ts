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

// Decides whether an existing setup can be carried over to a newer module
// version without asking the user, and builds the update payload if it can.
// Used by the "modules and their setups" update path of the catalog page.

import {InterfaceValue} from './global-configs';
import {
  DeploymentDetails,
  DeploymentFileGroupUserInput,
  DeploymentRequestModule,
  DeploymentUserInput,
  MODULE_DATA_TYPE_TO_NUMERIC,
  ModuleConfigValue,
  validateModuleConfigItem,
} from './deployment-request';

/**
 * Builds the update payload for a module whose installed version moved ahead
 * of its setup, or returns undefined if the new version asks for something
 * the setup does not answer. Undefined also covers every check that cannot be
 * evaluated: erring towards the form leaves the user with a question, erring
 * the other way writes a config nobody chose.
 *
 * `declared` carries the declarations of the new version (deployment-request),
 * `installed` the module whose embedded deployment holds the current values.
 */
export function carryOverSetup(module: DeploymentRequestModule | undefined): DeploymentUserInput | undefined {
  // One module answers both sides: `GET /modules` reports the declarations of
  // the installed version together with the deployment created for an earlier
  // one. Kept as two parameters below so a test can pin the two apart.
  return carryOverDeploymentInput(module, module);
}

export function carryOverDeploymentInput(
  declared: DeploymentRequestModule | undefined,
  installed: DeploymentRequestModule | undefined,
): DeploymentUserInput | undefined {
  if (!declared || !installed || declared.has_error || installed.has_error) {
    return undefined;
  }
  if (!installed.is_deployed || !installed.deployment || installed.deployment.has_error) {
    return undefined;
  }
  const setup = installed.deployment;
  const inputs = declared.inputs;
  if (!inputs) {
    return undefined;
  }

  const result: DeploymentUserInput = {
    module_id: declared.id,
    host_resources: {},
    secrets: {},
    configs: {},
    global_configs: {},
    files: {},
    file_groups: {},
  };

  // Only the refs the new version declares are carried over; one it dropped
  // would be rejected as unknown.
  for (const ref of Object.keys(inputs.configs || {})) {
    if (!carryOverConfig(declared.configs?.[ref], setup, ref, result)) {
      return undefined;
    }
  }

  // An unanswered optional secret or resource is left unanswered, the same way
  // the file branch below treats one: only a required declaration nobody
  // answered is a question for the user.
  for (const ref of Object.keys(inputs.secrets || {})) {
    const id = setup.secrets?.[ref]?.id;
    if (!id) {
      if (declared.secrets?.[ref]?.required !== false) {
        return undefined;
      }
      continue;
    }
    result.secrets[ref] = id;
  }

  for (const ref of Object.keys(inputs.resources || {})) {
    const id = setup.host_resources?.[ref];
    if (!id) {
      if (declared.host_resources?.[ref]?.required !== false) {
        return undefined;
      }
      continue;
    }
    result.host_resources[ref] = id;
  }

  for (const ref of Object.keys(inputs.files || {})) {
    const stored = setup.files?.[ref];
    if (stored) {
      // already base64 as the API wants it, so it is passed through verbatim
      result.files[ref] = stored;
      continue;
    }
    if (stored === '') {
      // Stored as empty, which is neither a content to carry over nor an
      // absence the default answers - the same question an empty config is.
      return undefined;
    }
    const file = declared.files?.[ref];
    if (!file || (file.required && !file.default_data)) {
      return undefined;
    }
  }

  for (const ref of Object.keys(inputs.file_groups || {})) {
    const files = setup.file_groups?.[ref]?.files || [];
    if (files.length === 0) {
      // A group nobody put a file in is not an open question: neither the form
      // nor the manager treats it as one, and there is no required flag to
      // read. Sending the user to a form with nothing to fill in is worse.
      continue;
    }
    const group: Record<string, DeploymentFileGroupUserInput> = {};
    for (const file of files) {
      if (!file.path) {
        return undefined;
      }
      group[file.path] = {format: file.format, data: file.data || ''};
    }
    result.file_groups[ref] = group;
  }

  return result;
}

// Carries one config over into `result`, or reports that it needs input.
function carryOverConfig(
  config: ModuleConfigValue | undefined,
  setup: DeploymentDetails,
  ref: string,
  result: DeploymentUserInput,
): boolean {
  if (!config) {
    // declared as an input without a definition: nothing to check a value against
    return false;
  }
  const globalId = setup.global_configs?.[ref];
  if (globalId) {
    // the value lives in the global config the user pointed at; its own
    // validity against the new declaration is the module manager's to reject
    result.global_configs[ref] = globalId;
    return true;
  }
  const stored = setup.configs?.[ref];
  if (stored === undefined || stored === null) {
    // no stored value: the module default answers it, unless there is none
    return !(config.required && (config.default === null || config.default === undefined));
  }
  if (isEmptyStoredValue(stored)) {
    // Asked rather than resolved either way. Sending it pins an empty value
    // over the new default - and an empty list is rejected against declared
    // options, which fails the whole batch, not just this module. Dropping it
    // instead would silently move the setup onto that default.
    return false;
  }
  if (!storedValueFits(config, stored)) {
    return false;
  }
  result.configs[ref] = stored.value;
  return true;
}

// An empty string or an empty list answers nothing, whichever way it got there.
function isEmptyStoredValue(stored: InterfaceValue): boolean {
  if (Array.isArray(stored.value)) {
    return stored.value.length === 0;
  }
  return stored.value === '';
}

// True if the stored value is still valid for the new declaration: same data
// type, and every item within the constraints the new version declares.
function storedValueFits(config: ModuleConfigValue, stored: InterfaceValue): boolean {
  const dataType = MODULE_DATA_TYPE_TO_NUMERIC[config.data_type];
  if (dataType === undefined || stored.data_type !== dataType || !!stored.is_slice !== !!config.is_slice) {
    return false;
  }
  if (config.is_slice && !Array.isArray(stored.value)) {
    return false;
  }
  const items: unknown[] = config.is_slice ? stored.value : [stored.value];
  if (config.required && (items.length === 0 || items.some((item) => item === ''))) {
    return false;
  }
  for (const item of items) {
    if (!matchesDataType(config.data_type, item)) {
      return false;
    }
    try {
      validateModuleConfigItem(config, item);
    } catch {
      return false;
    }
  }
  return true;
}

// The stored data type is a claim of the response, not a guarantee about the
// value next to it - and validateModuleConfigItem only applies a constraint to
// a value of the type it fits, so a mistyped one would pass unchecked.
function matchesDataType(dataType: string, value: unknown): boolean {
  switch (dataType) {
    case 'int':
      return typeof value === 'number' && Number.isInteger(value);
    case 'float':
      return typeof value === 'number' && Number.isFinite(value);
    case 'bool':
      return typeof value === 'boolean';
    case 'string':
      return typeof value === 'string';
    default:
      return false;
  }
}
