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

import {ContainerInfo} from 'src/app/container/models/container';
import {Configs, Labels, Volumes} from 'src/app/core/models/base';

export interface AuxDepRunConfig {
  command: string;
  pseudo_tty: boolean;
}

export interface AuxDeploymentBase {
  id: string;
  dep_id: string;
  name: string;
  enabled: boolean;
  created: Date;
  updated: Date;
  image: string;
  labels: Labels;
  configs: Configs;
  volumes: Volumes;
  ref: string;
  run_config: AuxDepRunConfig;
}

export interface AuxDepContainer {
  id: string;
  alias: string;
  info: null | ContainerInfo;
}

export interface AuxDeployment extends AuxDeploymentBase {
  container: AuxDepContainer;
}

export type AuxDeploymentResponse = Record<string, AuxDeployment>;
