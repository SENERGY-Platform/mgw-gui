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

export interface CoreEndpoint {
  id: string;
  parent_id: string;
  type: number;
  host: string;
  int_path: string;
  ext_path: string;
  labels: Record<string, string>;
  ref: string;
  port: number;
}

export type CoreEndpointsResponse = Record<string, CoreEndpoint>;

export interface CoreEndpointAliasReq {
  parent_id: string;
  path: string;
}
