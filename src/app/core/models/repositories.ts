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

// Models of the next-gen module-manager repository API.
// Mirrors mgw-module-manager/lib/models/repositories.go; field names follow
// the JSON tags of the Go structs.

// Repository and RepositoryChannel have no json tags upstream and therefore
// serialize with Go-style capitalized field names (see SNRGY-4601).
export interface RepositoryChannel {
  Name: string;
  Priority: number;
}

export interface Repository {
  // values: github.com, host-dir
  Type: string;
  Source: string;
  Priority: number;
  Channels: RepositoryChannel[];
}

export interface RepoModuleVariantChannel {
  name: string;
  priority: number;
  // version of the module this channel provides
  version: string;
}

export interface RepoModuleVariant {
  source: string;
  priority: number;
  channels: RepoModuleVariantChannel[];
}

export interface InstalledModuleVariant {
  source: string;
  channel: string;
  version: string;
  // version the module can be updated to within its source and channel,
  // empty if no update is available
  next_version: string;
}

export interface RepoModule {
  id: string;
  name: string;
  description: string;
  // version taken from the highest priority channel
  version: string;
  // sorted by repository priority in descending order
  repository_variants: RepoModuleVariant[];
  // true if installed, installed_variant is only populated if true
  is_installed: boolean;
  installed_variant: InstalledModuleVariant;
}
