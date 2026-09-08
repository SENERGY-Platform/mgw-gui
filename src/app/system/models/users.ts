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

export interface HumanUserMeta {
  first_name: string;
  last_name: string;
}

export interface DeviceUserMeta {
  model: string;
  manufacturer: string;
}

export interface BaseUser {
  id: string;
  created: string;
  updated: string;
  type: string;
  username: string;
}

export interface HumanUser extends BaseUser {
  meta: HumanUserMeta;
}

export interface DeviceUser extends BaseUser {
  meta: DeviceUserMeta;
}

export type HumanUsersResponse = Record<string, HumanUser>;

export type DeviceUsersResponse = Record<string, DeviceUser>;

export interface UserRequest {
  username: string;
  meta: HumanUserMeta;
  secret: string;
  type: string;
}
