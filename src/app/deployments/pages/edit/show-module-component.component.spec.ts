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
import {NotificationService} from 'src/app/core/services/util/notifications.service';
import {ShowModuleComponentComponent} from './show-module-component.component';

// A deployed module with one required config that has no default and no
// value in the existing deployment, so leaving it empty makes
// deployment-form's collect() fail for it.
function deployedModuleWithRequiredConfig(id: string): DeploymentRequestModule {
  return {
    id: id,
    name: id,
    description: '',
    version: 'v1.0.0',
    is_deployed: true,
    has_error: false,
    error_msg: '',
    deployment: {
      id: 'dep-' + id,
      module_version: 'v1.0.0',
      enabled: true,
      host_resources: {},
      secrets: {},
      configs: {},
      global_configs: {},
      files: {},
      file_groups: {},
      has_error: false,
      error_msg: '',
    },
    inputs: {
      configs: {cfg: {name: 'Config', description: '', group: ''}},
      resources: null,
      secrets: null,
      files: null,
      file_groups: null,
      groups: null,
    },
    configs: {
      cfg: {
        default: null,
        options: null,
        opt_ext: false,
        type: 'text',
        type_opt: null,
        data_type: 'string',
        is_slice: false,
        required: true,
      },
    },
    secrets: null,
    host_resources: null,
    files: null,
  };
}

describe('ShowModuleComponentComponent', () => {
  let fixture: ComponentFixture<ShowModuleComponentComponent>;
  let updateDeploymentsSpy: ReturnType<typeof vi.fn>;

  // Only the calls the page makes on load are stubbed; every one of them is
  // wrapped in a catchError by the page except the module request itself.
  function create(ids: string, modules: DeploymentRequestModule[]): void {
    updateDeploymentsSpy = vi.fn().mockReturnValue(of({id: 'job-1'}));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ShowModuleComponentComponent, provideTranslocoTesting('deployments')],
      providers: [
        provideNoopAnimations(),
        {provide: ActivatedRoute, useValue: {snapshot: {params: {ids: ids}}}},
        {
          provide: 'ModuleManagerService',
          useValue: {
            loadModulesFull: () => of(modules),
            getGlobalConfigs: () => of({}),
            updateDeployments: updateDeploymentsSpy,
          },
        },
        {provide: 'HostManagerService', useValue: {getHostResources: () => of([])}},
        {provide: 'SecretManagerService', useValue: {getSecrets: () => of([])}},
      ],
    });
    fixture = TestBed.createComponent(ShowModuleComponentComponent);
    fixture.detectChanges();
  }

  // SNRGY-4701: submit() used to stop at the first invalid form, leaving the
  // fields of later modules unmarked and the user without any feedback at all.
  it('validates every form before giving up, so a later module is marked too', () => {
    create('mod-a,mod-b', [deployedModuleWithRequiredConfig('mod-a'), deployedModuleWithRequiredConfig('mod-b')]);
    const notifications = TestBed.inject(NotificationService);
    vi.spyOn(notifications, 'showError').mockImplementation(() => undefined);

    fixture.componentInstance.submit();

    expect(updateDeploymentsSpy).not.toHaveBeenCalled();
    expect(notifications.showError).toHaveBeenCalledOnce();
    const forms = fixture.componentInstance.forms.toArray();
    expect(forms[0].configRows[0].error).not.toBe('');
    expect(forms[1].configRows[0].error).not.toBe('');
  });
});
