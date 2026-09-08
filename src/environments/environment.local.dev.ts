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

import {ContainerEngineManagerService} from 'src/app/core/services/container-engine-manager/container-engine-manager.service';
import {CoreManagerService} from 'src/app/core/services/core-manager/core-manager.service';
import {HostManagerService} from 'src/app/core/services/host-manager/host-manager.service';
import {SecretManagerServiceService} from 'src/app/core/services/secret-manager/secret-manager-service.service';
import {ModuleManagerService} from '../app/core/services/module-manager/module-manager-service.service';

// Relative path: requests go through the dev-server proxy (proxy.conf.json)
// to the local MGW core on http://localhost:8080. Same-origin, so no CORS
// issues and the Kratos session cookie works.
const CORE_PREFIX = '/core';

export const environment = {
  production: false,
  moduleManagerService: ModuleManagerService,
  secretManagerService: SecretManagerServiceService,
  hostManagerService: HostManagerService,
  containerEngineManagerService: ContainerEngineManagerService,
  coreManagerService: CoreManagerService,
  uiVersion: 'UI-VERSION',
  coreApiUrl: CORE_PREFIX + '/api',
  coreSwaggerUrl: CORE_PREFIX + '/swagger',
  authApiUrl: CORE_PREFIX + '/auth',
  // Empty on purpose, and the one value that differs from every other
  // environment. The redirect on a 401 is built as uiBaseUrl + '/login';
  // with the usual '/core/web-ui' that path matches the dev-server proxy,
  // so an expired session silently hands the browser to the core's own
  // bundle - the app appears to revert to the installed version on the same
  // port. At the root the redirect stays on the dev server's /login route.
  uiBaseUrl: '',
  endpointsUrl: '/endpoints',
  sentryDsn: '',
  sentryEnvironment: '',
};
