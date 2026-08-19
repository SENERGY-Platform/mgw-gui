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

// Models of the next-gen module-manager module API.
// Mirrors mgw-module-manager/lib/models (modules.go, deployments.go) and
// lib/constants; field names follow the JSON tags of the Go structs.

import {ErrorResult} from './jobs';

// constants.DeploymentState
export const DEPLOYMENT_STATE_UNKNOWN = 0; // disabled or could not be determined
export const DEPLOYMENT_STATE_HEALTHY = 1;
export const DEPLOYMENT_STATE_UNHEALTHY = 2;

export interface DeploymentReduced extends ErrorResult {
  id: string;
  module_source: string;
  module_channel: string;
  // version of the module the deployment was created for, can differ from
  // the installed version until the deployment is updated
  module_version: string;
  // disabled deployments are not started and not health checked
  enabled: boolean;
  created: string;
  updated: string;
  // 1 = healthy, 2 = unhealthy, 0 if disabled or undetermined
  state: number;
}

export interface ModuleReduced extends ErrorResult {
  id: string;
  source: string;
  channel: string;
  version: string;
  name: string;
  description: string;
  tags: string[];
  license: string;
  author: string;
  // true if a deployment exists, deployment is only populated if true
  is_deployed: boolean;
  deployment: DeploymentReduced;
}

// Subset of the full deployment embedded in a Module, limited to the fields
// the UI displays; runtime and user-input details follow with SNRGY-4589.
export interface DeploymentInfo extends ErrorResult {
  id: string;
  module_source: string;
  module_channel: string;
  module_version: string;
  enabled: boolean;
  created: string;
  updated: string;
  // 1 = healthy, 2 = unhealthy, 0 if disabled or undetermined
  state: number;
}

// Subset of the full Module returned by /modules and /modules/{MOD_ID},
// limited to the fields the UI displays; the modfile metadata (configs,
// inputs, files, ...) follows with SNRGY-4589.
export interface ModuleInfo extends ErrorResult {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  license: string;
  tags: string[];
  source: string;
  channel: string;
  added: string;
  updated: string;
  is_deployed: boolean;
  deployment: DeploymentInfo;
}

// True if the installed module variant differs from the one the deployment
// was created for: the deployment has to be updated by the user.
export function needsDeploymentUpdate(module: ModuleReduced): boolean {
  if (!module.is_deployed) {
    return false;
  }
  return module.deployment.module_version !== module.version
    || module.deployment.module_source !== module.source
    || module.deployment.module_channel !== module.channel;
}
