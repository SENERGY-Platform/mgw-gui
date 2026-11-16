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

// Mirrors mgw-module-manager/lib/models/carry_over.go; field names follow the
// JSON tags of the Go structs.

import {DeploymentUserInput} from './deployment-request';
import {ErrorResult} from './jobs';

// Reasons a setup does not answer a module item (lib/constants).
export const CARRY_OVER_REASONS = [
  'not_declared',
  'not_set',
  'empty_value',
  'type_mismatch',
  'invalid_value',
  'missing_path',
  'global_config_not_found',
  'secret_not_found',
  'secret_type_unknown',
] as const;

// An item of a module the current setup does not answer.
export interface CarryOverMissing {
  // values: config, secret, host_resource, file, file_group
  kind: string;
  ref: string;
  reason: string;
}

export interface DeploymentCarryOver extends ErrorResult {
  module_id: string;
  // update payload built from the current setup, null if it cannot be carried over
  input: DeploymentUserInput | null;
  // empty if input is set
  missing: CarryOverMissing[] | null;
}

// Router navigation state from a carry-over check to the deployments edit page:
// the missing items per module ID.
export interface CarryOverNavigationState {
  carryOverMissing: Record<string, CarryOverMissing[]>;
}
