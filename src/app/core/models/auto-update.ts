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

// Mirrors mgw-module-manager/lib/models/auto_update.go; field names follow the
// JSON tags of the Go structs.

import {CarryOverMissing} from './carry-over';
import {ErrorResult} from './jobs';

export const AUTO_UPDATE_LEVELS = ['patch', 'minor', 'major'] as const;
export type AutoUpdateLevel = (typeof AUTO_UPDATE_LEVELS)[number];

// Reasons the auto-update left a module or deployment unchanged (lib/constants).
export const AUTO_UPDATE_SKIP_REASONS = [
  'level_exceeded',
  'dependency_level_exceeded',
  'new_dependency',
  'needs_input',
  'invalid_version',
  'module_error',
  'deployment_error',
  'dependency_not_deployed',
  'dependent_range_violated',
  'deployment_variant_differs',
] as const;

export interface AutoUpdateSettings {
  enabled: boolean;
  level: AutoUpdateLevel;
  // HH:MM, inclusive; the window may cross midnight
  window_start: string;
  // HH:MM, exclusive, differs from window_start
  window_end: string;
  // IANA time zone name the window is evaluated in
  time_zone: string;
}

export interface AutoUpdateUpdatedModule {
  id: string;
  from: string;
  to: string;
}

export interface AutoUpdateSkippedModule {
  id: string;
  version: string;
  next_version: string;
  reason: string;
  // only set if reason is needs_input
  missing: CarryOverMissing[] | null;
}

export interface AutoUpdateFailedModule {
  id: string;
  error: string;
}

// has_error is set if the run was aborted by an error that belongs to no single module
export interface AutoUpdateRun extends ErrorResult {
  start: string;
  end: string;
  updated: AutoUpdateUpdatedModule[] | null;
  skipped: AutoUpdateSkippedModule[] | null;
  failed: AutoUpdateFailedModule[] | null;
}

export interface AutoUpdateStatus extends AutoUpdateSettings {
  // null if no run has completed yet
  last_run: AutoUpdateRun | null;
}
