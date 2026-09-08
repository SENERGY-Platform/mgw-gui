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

import {ContainerEngineManagerMockService} from 'src/app/core/services/container-engine-manager/container-engine-manager-mock.service';
import {CoreManagerService} from 'src/app/core/services/core-manager/core-manager.service';
import {HostManagerMockService} from 'src/app/core/services/host-manager/host-manager-mock.service';
import {SecretManagerMockService} from 'src/app/core/services/secret-manager/secret-manager-mock-service';
import {SecretManagerServiceService} from 'src/app/core/services/secret-manager/secret-manager-service.service';
import {ModuleManagerMockService} from '../app/core/services/module-manager/module-manager-mock.service';

const CORE_PREFIX = '/core';

export const environment = {
  production: false,
  moduleManagerService: ModuleManagerMockService,
  secretManagerService: SecretManagerMockService,
  hostManagerService: HostManagerMockService,
  containerEngineManagerService: ContainerEngineManagerMockService,
  coreManagerService: CoreManagerService,
  uiVersion: 'UI-VERSION',
  coreApiUrl: CORE_PREFIX + '/api',
  coreSwaggerUrl: CORE_PREFIX + '/swagger',
  authApiUrl: CORE_PREFIX + '/auth',
  uiBaseUrl: CORE_PREFIX + '/web-ui',
  endpointsUrl: '/endpoints',
  sentryDsn: '',
  sentryEnvironment: '',
};
