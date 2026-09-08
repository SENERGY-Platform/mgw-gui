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

export interface BaseRequest {
  host_resources: Record<string, string> | null;
  configs: Record<string, any> | null;
  secrets: Record<string, string> | null;
  module_id: string;
}

export type Labels = Record<string, string>;

export type Configs = Record<string, string>;

export type Volumes = Record<string, string>;
