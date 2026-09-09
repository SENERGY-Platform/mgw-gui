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
import {provideTranslocoTesting} from 'src/testing/transloco-testing';
import {
  DeploymentRequestModule,
  encodeFileData,
  ModuleConfigValue,
  ModuleFileDef,
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
  fileInputs?: Record<string, ModuleInput>;
  files?: Record<string, ModuleFileDef>;
  fileGroupInputs?: Record<string, ModuleInput>;
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
      files: opts.fileInputs ?? null,
      file_groups: opts.fileGroupInputs ?? null,
      groups: null,
    },
    configs: opts.configs ?? null,
    secrets: opts.secrets ?? null,
    host_resources: opts.hostResources ?? null,
    files: opts.files ?? null,
  };
}

describe('DeploymentFormComponent', () => {
  let fixture: ComponentFixture<DeploymentFormComponent>;
  let component: DeploymentFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeploymentFormComponent, provideTranslocoTesting('deployments')],
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

  it('offers to restore the module default once the value was changed', () => {
    create(
      makeModule({
        configInputs: {cfg: moduleInput('Config')},
        configs: {cfg: textConfig({default: 'hello'})},
      }),
    );

    // untouched: the field still holds the default, nothing to restore
    expect(fixture.nativeElement.querySelector('.reset-default')).toBeNull();

    component.configRows[0].raw = 'changed';
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.reset-default') as HTMLButtonElement;
    expect(button).not.toBeNull();

    button.click();
    fixture.detectChanges();

    expect(component.configRows[0].raw).toBe('hello');
    expect(fixture.nativeElement.querySelector('.reset-default')).toBeNull();
  });

  it('offers no restore for a config without a default', () => {
    create(
      makeModule({
        configInputs: {cfg: moduleInput('Config')},
        configs: {cfg: textConfig({default: null})},
      }),
    );

    component.configRows[0].raw = 'changed';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.reset-default')).toBeNull();
  });

  it('restores a slice default as one value per line', () => {
    create(
      makeModule({
        configInputs: {cfg: moduleInput('Config')},
        configs: {cfg: textConfig({default: ['a', 'b'], is_slice: true})},
      }),
    );

    component.configRows[0].raw = 'c';
    component.resetToDefault(component.configRows[0]);

    expect(component.configRows[0].raw).toBe('a\nb');
  });

  it('offers to restore a file input to its module default', () => {
    create(
      makeModule({
        fileInputs: {cfg: moduleInput('Config file')},
        files: {cfg: {type: 'generic', required: false, default_data: encodeFileData('key = value')}},
      }),
    );

    // untouched: the field holds the default that was decoded into it
    expect(component.fileRows[0].text).toBe('key = value');
    expect(fixture.nativeElement.querySelector('.reset-default')).toBeNull();

    component.fileRows[0].text = 'key = other';
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.reset-default') as HTMLButtonElement;
    expect(button).not.toBeNull();

    button.click();
    fixture.detectChanges();

    expect(component.fileRows[0].text).toBe('key = value');
    expect(fixture.nativeElement.querySelector('.reset-default')).toBeNull();
  });

  it('offers no restore for a file input without a default', () => {
    create(
      makeModule({
        fileInputs: {cfg: moduleInput('Config file')},
        files: {cfg: {type: 'generic', required: false, default_data: ''}},
      }),
    );

    component.fileRows[0].text = 'something';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.reset-default')).toBeNull();
  });

  it('blocks submit for a required file left empty with no module default', () => {
    create(
      makeModule({
        fileInputs: {cfg: moduleInput('Config file')},
        files: {cfg: {type: 'generic', required: true, default_data: ''}},
      }),
    );
    component.fileRows[0].text = '   ';

    const result = component.collect();

    expect(result).toBeUndefined();
    expect(component.fileRows[0].error).not.toBe('');
  });

  it('collects a required file left empty when the module ships a default', () => {
    create(
      makeModule({
        fileInputs: {cfg: moduleInput('Config file')},
        files: {cfg: {type: 'generic', required: true, default_data: encodeFileData('key = value')}},
      }),
    );
    component.fileRows[0].text = '';

    const result = component.collect();

    expect(result).toBeDefined();
    expect(result!.files['cfg']).toBe(encodeFileData(''));
    expect(component.fileRows[0].error).toBe('');
  });

  it('collects an optional file left empty', () => {
    create(
      makeModule({
        fileInputs: {cfg: moduleInput('Config file')},
        files: {cfg: {type: 'json', required: false, default_data: ''}},
      }),
    );
    component.fileRows[0].text = '';

    const result = component.collect();

    expect(result).toBeDefined();
    expect(component.fileRows[0].error).toBe('');
  });

  it('collects a json file with valid content, base64-encoded', () => {
    create(
      makeModule({
        fileInputs: {cfg: moduleInput('Config file')},
        files: {cfg: {type: 'json', required: false, default_data: ''}},
      }),
    );
    component.fileRows[0].text = '{"a":1}';

    const result = component.collect();

    expect(result).toBeDefined();
    expect(result!.files['cfg']).toBe(encodeFileData('{"a":1}'));
    expect(component.fileRows[0].error).toBe('');
  });

  it('blocks submit for a json file with broken content and marks the row', () => {
    create(
      makeModule({
        fileInputs: {cfg: moduleInput('Config file')},
        files: {cfg: {type: 'json', required: false, default_data: ''}},
      }),
    );
    component.fileRows[0].text = '{"a":';

    const result = component.collect();

    expect(result).toBeUndefined();
    expect(component.fileRows[0].error).not.toBe('');
  });

  it('collects a generic file with the same broken content fine - the type decides', () => {
    create(
      makeModule({
        fileInputs: {cfg: moduleInput('Config file')},
        files: {cfg: {type: 'generic', required: false, default_data: ''}},
      }),
    );
    component.fileRows[0].text = '{"a":';

    const result = component.collect();

    expect(result).toBeDefined();
    expect(result!.files['cfg']).toBe(encodeFileData('{"a":'));
    expect(component.fileRows[0].error).toBe('');
  });

  it('collects a yaml file with broken content fine - there is no yaml validation', () => {
    create(
      makeModule({
        fileInputs: {cfg: moduleInput('Config file')},
        files: {cfg: {type: 'yaml', required: false, default_data: ''}},
      }),
    );
    component.fileRows[0].text = 'a: [b';

    const result = component.collect();

    expect(result).toBeDefined();
    expect(result!.files['cfg']).toBe(encodeFileData('a: [b'));
    expect(component.fileRows[0].error).toBe('');
  });

  it('reformats valid json on blur and clears the error', () => {
    create(
      makeModule({
        fileInputs: {cfg: moduleInput('Config file')},
        files: {cfg: {type: 'json', required: false, default_data: ''}},
      }),
    );
    component.fileRows[0].text = '{"a":1}';
    component.fileRows[0].error = 'stale error';

    component.formatFileOnBlur(component.fileRows[0]);

    expect(component.fileRows[0].text).toBe(JSON.stringify({a: 1}, null, 2));
    expect(component.fileRows[0].error).toBe('');
  });

  it('sets the error on blur with broken json and leaves the text unchanged', () => {
    create(
      makeModule({
        fileInputs: {cfg: moduleInput('Config file')},
        files: {cfg: {type: 'json', required: false, default_data: ''}},
      }),
    );
    component.fileRows[0].text = '{"a":';

    component.formatFileOnBlur(component.fileRows[0]);

    expect(component.fileRows[0].text).toBe('{"a":');
    expect(component.fileRows[0].error).not.toBe('');
  });

  it('clears the error when resetting a file to its module default', () => {
    create(
      makeModule({
        fileInputs: {cfg: moduleInput('Config file')},
        files: {cfg: {type: 'json', required: false, default_data: encodeFileData('{}')}},
      }),
    );
    component.fileRows[0].text = '{"a":';
    component.fileRows[0].error = 'stale error';

    component.resetFileToDefault(component.fileRows[0]);

    expect(component.fileRows[0].text).toBe('{}');
    expect(component.fileRows[0].error).toBe('');
  });

  it('does not treat an empty json file as a parse error', () => {
    create(
      makeModule({
        fileInputs: {cfg: moduleInput('Config file')},
        files: {cfg: {type: 'json', required: false, default_data: ''}},
      }),
    );
    component.fileRows[0].text = '';

    const result = component.collect();

    expect(result).toBeDefined();
    expect(result!.files['cfg']).toBeUndefined();
    expect(component.fileRows[0].error).toBe('');
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

  it('offers a format from the known list and defaults a new group file to generic', () => {
    create(makeModule({fileGroupInputs: {extra: moduleInput('Extra files')}}));

    const row = component.fileGroupRows[0];
    component.addGroupFile(row);

    expect(row.files[0].format).toBe('generic');
    expect(component.formatOptionsFor(row.files[0])).toContain('json');
  });

  it('keeps a stored format the known list does not cover', () => {
    create(
      makeModule({
        fileGroupInputs: {extra: moduleInput('Extra files')},
        isDeployed: true,
        deployment: {
          id: 'dep-1',
          module_version: 'v1.0.0',
          enabled: true,
          host_resources: {},
          secrets: {},
          configs: {},
          global_configs: {},
          files: {},
          file_groups: {
            extra: {id: 'fg-1', files: [{path: 'run.sh', format: 'shell', data: encodeFileData('echo hi')}]},
          },
          has_error: false,
          error_msg: '',
        },
      }),
      {prefill: true},
    );

    const file = component.fileGroupRows[0].files[0];

    expect(file.format).toBe('shell');
    expect(component.formatOptionsFor(file)[0]).toBe('shell');
  });

  // SNRGY-4691: the step of a number input comes out of type_opt, whose
  // entries wrap the value together with its data type
  it('reads the number step out of the wrapped type option', () => {
    create(
      makeModule({
        configInputs: {scale: moduleInput('Scale factor')},
        configs: {
          scale: textConfig({
            type: 'number',
            data_type: 'float',
            default: 1.5,
            type_opt: {step: {value: 0.1, data_type: 'float'}},
          }),
        },
      }),
    );

    expect(component.stepFor(component.configRows[0])).toBe(0.1);
  });
});
