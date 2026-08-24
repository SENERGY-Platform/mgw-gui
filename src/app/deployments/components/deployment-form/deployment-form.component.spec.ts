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
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {
  DeploymentRequestModule,
  ModuleConfigValue,
  ModuleHostResourceDef,
  ModuleInput,
  ModuleSecretDef,
} from 'src/app/core/models/deployment-request';
import {GlobalConfig} from 'src/app/core/models/global-configs';
import {HostResource} from 'src/app/host/models/models';
import {Secret} from 'src/app/secrets/models/secret_models';
import {DeploymentFormComponent} from './deployment-form.component';

function moduleInput(name: string): ModuleInput {
  return {name: name, description: '', group: ''};
}

// A plain text config without validation constraints, used as the base for
// the required/default combinations under test.
function textConfig(overrides: Partial<ModuleConfigValue> = {}): ModuleConfigValue {
  return {
    default: null,
    options: null,
    opt_ext: false,
    type: 'text',
    type_opt: null,
    data_type: 'string',
    is_slice: false,
    required: false,
    ...overrides,
  };
}

interface ModuleOpts {
  configInputs?: Record<string, ModuleInput>;
  configs?: Record<string, ModuleConfigValue>;
  secretInputs?: Record<string, ModuleInput>;
  secrets?: Record<string, ModuleSecretDef>;
  resourceInputs?: Record<string, ModuleInput>;
  hostResources?: Record<string, ModuleHostResourceDef>;
  isDeployed?: boolean;
  deployment?: DeploymentRequestModule['deployment'];
}

// Only the parts of DeploymentRequestModule the form actually reads are
// filled in; each test brings just the input kind it exercises.
function makeModule(opts: ModuleOpts = {}): DeploymentRequestModule {
  return {
    id: 'mod-1',
    name: 'Test module',
    description: '',
    version: 'v1.0.0',
    is_deployed: opts.isDeployed ?? false,
    has_error: false,
    error_msg: '',
    deployment: opts.deployment ?? ({} as DeploymentRequestModule['deployment']),
    inputs: {
      configs: opts.configInputs ?? null,
      resources: opts.resourceInputs ?? null,
      secrets: opts.secretInputs ?? null,
      files: null,
      file_groups: null,
      groups: null,
    },
    configs: opts.configs ?? null,
    secrets: opts.secrets ?? null,
    host_resources: opts.hostResources ?? null,
    files: null,
  };
}

describe('DeploymentFormComponent', () => {
  let fixture: ComponentFixture<DeploymentFormComponent>;
  let component: DeploymentFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeploymentFormComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
  });

  // Sets the @Input properties and runs the first change detection, which
  // triggers ngOnInit / buildRows() the same way the host page would.
  function create(
    module: DeploymentRequestModule,
    extra: {hostResources?: HostResource[]; secrets?: Secret[]; globalConfigs?: GlobalConfig[]; prefill?: boolean} = {},
  ): void {
    fixture = TestBed.createComponent(DeploymentFormComponent);
    component = fixture.componentInstance;
    component.module = module;
    component.hostResources = extra.hostResources ?? [];
    component.secrets = extra.secrets ?? [];
    component.globalConfigs = extra.globalConfigs ?? [];
    component.prefill = extra.prefill ?? false;
    fixture.detectChanges();
  }

  it('blocks submit when a required secret has no selection, and marks the row', () => {
    create(
      makeModule({
        secretInputs: {sec: moduleInput('Secret')},
        secrets: {sec: {type: 'certificate', required: true}},
      }),
    );

    const result = component.collect();

    expect(result).toBeUndefined();
    expect(component.secretRows[0].error).not.toBe('');
  });

  it('does not block submit when a non-required secret has no selection', () => {
    create(
      makeModule({
        secretInputs: {sec: moduleInput('Secret')},
        secrets: {sec: {type: 'certificate', required: false}},
      }),
    );

    const result = component.collect();

    expect(result).toBeDefined();
    expect(result!.secrets['sec']).toBeUndefined();
    expect(component.secretRows[0].error).toBe('');
  });

  it('blocks submit when a required config has no default and is left empty', () => {
    create(
      makeModule({
        configInputs: {cfg: moduleInput('Config')},
        configs: {cfg: textConfig({required: true, default: null})},
      }),
    );
    component.configRows[0].raw = '';

    const result = component.collect();

    expect(result).toBeUndefined();
    expect(component.configRows[0].error).not.toBe('');
  });

  it('does not block a required config with a default when left empty, and does not send it', () => {
    create(
      makeModule({
        configInputs: {cfg: moduleInput('Config')},
        configs: {cfg: textConfig({required: true, default: 'hello'})},
      }),
    );
    // Simulates the field being cleared out again: the default carries the
    // value server-side, so the client must not send an explicit one either.
    component.configRows[0].raw = '';

    const result = component.collect();

    expect(result).toBeDefined();
    expect(result!.configs['cfg']).toBeUndefined();
  });

  it('is satisfied when a required config points at a selected global config', () => {
    const globalConfig: GlobalConfig = {id: 'gc-1', name: 'Global', data_type: 1, is_slice: false, value: 'x'};
    create(
      makeModule({
        configInputs: {cfg: moduleInput('Config')},
        configs: {cfg: textConfig({required: true, default: null})},
      }),
      {globalConfigs: [globalConfig]},
    );
    component.configRows[0].useGlobal = true;
    component.configRows[0].globalConfigId = 'gc-1';

    const result = component.collect();

    expect(result).toBeDefined();
    expect(result!.global_configs['cfg']).toBe('gc-1');
    expect(component.configRows[0].error).toBe('');
  });

  it('blocks submit when a required host resource has no selection', () => {
    create(
      makeModule({
        resourceInputs: {res: moduleInput('Resource')},
        hostResources: {res: {required: true}},
      }),
    );

    const result = component.collect();

    expect(result).toBeUndefined();
    expect(component.resourceRows[0].error).not.toBe('');
  });

  it('marks required config, secret and host resource fields in the DOM', () => {
    create(
      makeModule({
        configInputs: {cfg: moduleInput('Config')},
        configs: {cfg: textConfig({required: true, default: 'hello'})},
        secretInputs: {sec: moduleInput('Secret')},
        secrets: {sec: {type: 'certificate', required: true}},
        resourceInputs: {res: moduleInput('Resource')},
        hostResources: {res: {required: true}},
      }),
    );

    const cfgLabel = fixture.nativeElement.querySelector('label[for="cfg-cfg"]');
    const secLabel = fixture.nativeElement.querySelector('label[for="sec-sec"]');
    const resLabel = fixture.nativeElement.querySelector('label[for="res-res"]');

    expect(cfgLabel?.querySelector('.required')).not.toBeNull();
    expect(secLabel?.querySelector('.required')).not.toBeNull();
    expect(resLabel?.querySelector('.required')).not.toBeNull();
  });

  it('does not flag a required secret that already has a value from the edit prefill', () => {
    create(
      makeModule({
        secretInputs: {sec: moduleInput('Secret')},
        secrets: {sec: {type: 'certificate', required: true}},
        isDeployed: true,
        deployment: {
          id: 'dep-1',
          module_version: 'v1.0.0',
          enabled: true,
          host_resources: {},
          secrets: {sec: {id: 'secret-1'}},
          configs: {},
          global_configs: {},
          files: {},
          file_groups: {},
          has_error: false,
          error_msg: '',
        },
      }),
      {prefill: true},
    );

    const result = component.collect();

    expect(result).toBeDefined();
    expect(result!.secrets['sec']).toBe('secret-1');
  });
});
