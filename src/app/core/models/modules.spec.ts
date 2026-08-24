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

import {DeploymentReduced, ModuleReduced, needsDeploymentUpdate} from './modules';

function moduleReduced(
  overrides: Partial<ModuleReduced> = {},
  deployment: Partial<DeploymentReduced> = {},
): ModuleReduced {
  return {
    id: 'github.com/acme/mod-a',
    source: 'github.com/acme/repository',
    channel: 'main',
    version: 'v1.0.0',
    name: 'Module A',
    description: '',
    tags: [],
    license: '',
    author: '',
    is_deployed: true,
    has_error: false,
    error_msg: '',
    deployment: {
      id: 'dep-1',
      module_source: 'github.com/acme/repository',
      module_channel: 'main',
      module_version: 'v1.0.0',
      enabled: true,
      created: '2026-08-18T10:00:00Z',
      updated: '2026-08-18T10:00:00Z',
      state: 1,
      has_error: false,
      error_msg: '',
      ...deployment,
    },
    ...overrides,
  };
}

describe('needsDeploymentUpdate', () => {
  it('should be false when the deployment matches the installed variant', () => {
    expect(needsDeploymentUpdate(moduleReduced())).toBe(false);
  });

  it('should be false for modules without a deployment', () => {
    expect(needsDeploymentUpdate(moduleReduced({is_deployed: false}))).toBe(false);
  });

  it('should be true when the installed version is newer', () => {
    expect(needsDeploymentUpdate(moduleReduced({version: 'v1.1.0'}))).toBe(true);
  });

  it('should be true when the source changed', () => {
    expect(needsDeploymentUpdate(moduleReduced({source: 'github.com/other/repository'}))).toBe(true);
  });

  it('should be true when the channel changed', () => {
    expect(needsDeploymentUpdate(moduleReduced({channel: 'beta'}))).toBe(true);
  });
});
