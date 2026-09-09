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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute} from '@angular/router';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {provideTranslocoTesting} from 'src/testing/transloco-testing';
import {DeploymentRequestModule} from 'src/app/core/models/deployment-request';
import {ModulesComponent} from './modules.component';

function requestModule(id: string, isDeployed = false): DeploymentRequestModule {
  return {
    id: id,
    name: id,
    description: '',
    version: 'v1.0.0',
    is_deployed: isDeployed,
    has_error: false,
    error_msg: '',
    deployment: {} as DeploymentRequestModule['deployment'],
    inputs: {configs: null, resources: null, secrets: null, files: null, file_groups: null, groups: null},
    configs: null,
    secrets: null,
    host_resources: null,
    files: null,
  };
}

describe('ModulesComponent', () => {
  let fixture: ComponentFixture<ModulesComponent>;
  let requested: string[];

  // Only the calls the page makes on load are stubbed; every one of them is
  // wrapped in a catchError by the page except the module request itself.
  function create(ids: string, modules: DeploymentRequestModule[]): void {
    requested = [];
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ModulesComponent, provideTranslocoTesting('deployments')],
      providers: [
        provideNoopAnimations(),
        {provide: ActivatedRoute, useValue: {snapshot: {params: {ids: ids}}}},
        {
          provide: 'ModuleManagerService',
          useValue: {
            loadDeploymentRequest: (moduleIDs: string[]) => {
              requested = moduleIDs;
              return of(modules);
            },
            getGlobalConfigs: () => of({}),
          },
        },
        {provide: 'HostManagerService', useValue: {getHostResources: () => of([])}},
        {provide: 'SecretManagerService', useValue: {getSecrets: () => of([])}},
      ],
    });
    fixture = TestBed.createComponent(ModulesComponent);
    fixture.detectChanges();
  }

  it('requests the single module of the route', () => {
    const id = 'github.com/SENERGY-Platform/test-mod-a';
    create(encodeURIComponent(id), [requestModule(id)]);

    expect(requested).toEqual([id]);
    expect(fixture.componentInstance.modules.length).toBe(1);
  });

  // SNRGY-4690: the modules list hands its whole selection over as one
  // comma-joined route parameter, the same way the batch edit route does
  it('splits and decodes a comma-joined selection', () => {
    const ids = ['github.com/SENERGY-Platform/test-mod-a', 'github.com/SENERGY-Platform/test-mod-b'];
    create(
      ids.map((id) => encodeURIComponent(id)).join(','),
      ids.map((id) => requestModule(id)),
    );

    expect(requested).toEqual(ids);
    expect(fixture.componentInstance.requestedCount).toBe(2);
    expect(fixture.componentInstance.modules.length).toBe(2);
  });

  it('drops modules that already have a deployment', () => {
    const ids = ['mod-a', 'mod-b'];
    create(ids.join(','), [requestModule('mod-a', true), requestModule('mod-b')]);

    expect(fixture.componentInstance.modules.map((module) => module.id)).toEqual(['mod-b']);
  });

  it('names the selection rather than dependencies once several modules were requested', () => {
    create('mod-a,mod-b', [requestModule('mod-a'), requestModule('mod-b')]);

    expect(fixture.componentInstance.descriptionKey()).toBe('deployments.addDeployment.descriptionMultiple');
    expect(fixture.componentInstance.noticeKey()).toBe('deployments.addDeployment.selectionNotice');
    expect(fixture.componentInstance.nothingToDeployKey()).toBe('deployments.addDeployment.allAlreadyDeployedMessage');
  });

  it('names dependencies when a single module pulled the extra forms in', () => {
    create('mod-a', [requestModule('mod-a'), requestModule('mod-dep')]);

    expect(fixture.componentInstance.descriptionKey()).toBe('deployments.addDeployment.description');
    expect(fixture.componentInstance.noticeKey()).toBe('deployments.addDeployment.dependenciesNotice');
    expect(fixture.componentInstance.nothingToDeployKey()).toBe('deployments.addDeployment.alreadyDeployedMessage');
  });
});
