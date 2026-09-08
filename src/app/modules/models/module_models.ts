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

import {BaseRequest} from 'src/app/core/models/base';

export interface Module {
  id: string;
  name: string;
  description: string;
  tags: string[];
  license: string;
  author: string;
  version: string;
  type: string;
  deployment_type: string;
  added: Date;
  updated: Date;
}

export type ModuleResponse = Record<string, Module>;

export interface AddModule {
  id?: string;
  version?: string;
}

export interface ModuleUpdate {
  pending: boolean;
  pending_versions: Record<string, string>;
  checked: Date;
  versions: string[];
}

export type ModuleUpdates = Record<string, ModuleUpdate>;

export interface ModuleUpdatePrepare {
  version: string;
}

export interface ModuleUpdateRequest extends BaseRequest {
  dependencies: Record<string, BaseRequest> | null;
}
