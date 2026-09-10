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

import {carryOverDeploymentInput} from './deployment-carry-over';
import {DeploymentDetails, DeploymentRequestModule, ModuleConfigValue} from './deployment-request';
import {DATA_TYPE_INT, DATA_TYPE_STRING} from './global-configs';

function config(overrides: Partial<ModuleConfigValue> = {}): ModuleConfigValue {
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

function setup(overrides: Partial<DeploymentDetails> = {}): DeploymentDetails {
  return {
    id: 'dep-1',
    module_version: 'v1.0.0',
    enabled: true,
    host_resources: null,
    secrets: null,
    configs: null,
    global_configs: null,
    files: null,
    file_groups: null,
    has_error: false,
    error_msg: '',
    ...overrides,
  };
}

// The module as the deployment-request reports it for the new version.
function declaredModule(overrides: Partial<DeploymentRequestModule> = {}): DeploymentRequestModule {
  return {
    id: 'mod-a',
    name: 'mod-a',
    description: '',
    version: 'v2.0.0',
    inputs: {resources: null, secrets: null, configs: null, files: null, file_groups: null, groups: null},
    configs: null,
    secrets: null,
    host_resources: null,
    files: null,
    is_deployed: true,
    deployment: setup(),
    has_error: false,
    error_msg: '',
    ...overrides,
  };
}

// The installed module, whose embedded deployment holds the current values.
function installedModule(deployment: DeploymentDetails, overrides: Partial<DeploymentRequestModule> = {}) {
  return declaredModule({version: 'v2.0.0', deployment: deployment, ...overrides});
}

describe('carryOverDeploymentInput', () => {
  it('carries a module without any declared input over unchanged', () => {
    const input = carryOverDeploymentInput(declaredModule(), installedModule(setup()));

    expect(input).toEqual({
      module_id: 'mod-a',
      host_resources: {},
      secrets: {},
      configs: {},
      global_configs: {},
      files: {},
      file_groups: {},
    });
  });

  it('leaves an optional secret or resource unanswered rather than asking', () => {
    // Otherwise a module that merely declares an optional secret nobody filled
    // in could never take the automatic path.
    const declared = declaredModule({
      inputs: {
        configs: null,
        secrets: {cert: {name: 'Cert', description: '', group: ''}},
        resources: {dev: {name: 'Device', description: '', group: ''}},
        files: null,
        file_groups: null,
        groups: null,
      },
      secrets: {cert: {type: 'certificate', required: false}},
      host_resources: {dev: {required: false}},
    });

    expect(carryOverDeploymentInput(declared, installedModule(setup()))).toEqual({
      module_id: 'mod-a',
      host_resources: {},
      secrets: {},
      configs: {},
      global_configs: {},
      files: {},
      file_groups: {},
    });
  });

  it('asks when a secret the new version requires is unanswered', () => {
    const declared = declaredModule({
      inputs: {
        configs: null,
        secrets: {cert: {name: 'Cert', description: '', group: ''}},
        resources: null,
        files: null,
        file_groups: null,
        groups: null,
      },
      secrets: {cert: {type: 'certificate', required: true}},
    });

    expect(carryOverDeploymentInput(declared, installedModule(setup()))).toBeUndefined();
  });

  it('asks when a declared secret carries no definition to read required off', () => {
    // A check that cannot be evaluated counts as a question, not as a pass.
    const declared = declaredModule({
      inputs: {
        configs: null,
        secrets: {cert: {name: 'Cert', description: '', group: ''}},
        resources: null,
        files: null,
        file_groups: null,
        groups: null,
      },
      secrets: null,
    });

    expect(carryOverDeploymentInput(declared, installedModule(setup()))).toBeUndefined();
  });

  it('carries every answered declaration over', () => {
    const declared = declaredModule({
      inputs: {
        configs: {port: {name: 'Port', description: '', group: ''}},
        secrets: {cert: {name: 'Cert', description: '', group: ''}},
        resources: {dev: {name: 'Device', description: '', group: ''}},
        files: {conf: {name: 'Conf', description: '', group: ''}},
        file_groups: {extra: {name: 'Extra', description: '', group: ''}},
        groups: null,
      },
      configs: {port: config({data_type: 'int', required: true})},
      secrets: {cert: {type: 'certificate', required: true}},
      host_resources: {dev: {required: true}},
      files: {conf: {type: 'json', required: true, default_data: ''}},
    });
    const current = setup({
      configs: {port: {data_type: DATA_TYPE_INT, is_slice: false, value: 8080}},
      secrets: {cert: {id: 'secret-1'}},
      host_resources: {dev: 'resource-1'},
      files: {conf: 'e30='},
      file_groups: {extra: {id: 'fg-1', files: [{path: 'a.yaml', format: 'yaml', data: 'YQ=='}]}},
    });

    expect(carryOverDeploymentInput(declared, installedModule(current))).toEqual({
      module_id: 'mod-a',
      host_resources: {dev: 'resource-1'},
      secrets: {cert: 'secret-1'},
      configs: {port: 8080},
      global_configs: {},
      files: {conf: 'e30='},
      file_groups: {extra: {'a.yaml': {format: 'yaml', data: 'YQ=='}}},
    });
  });

  it('needs input for a new required config without a default', () => {
    const declared = declaredModule({
      inputs: {
        configs: {token: {name: 'Token', description: '', group: ''}},
        resources: null,
        secrets: null,
        files: null,
        file_groups: null,
        groups: null,
      },
      configs: {token: config({required: true})},
    });

    expect(carryOverDeploymentInput(declared, installedModule(setup()))).toBeUndefined();
  });

  it('lets a new required config with a default fall back to it', () => {
    const declared = declaredModule({
      inputs: {
        configs: {level: {name: 'Level', description: '', group: ''}},
        resources: null,
        secrets: null,
        files: null,
        file_groups: null,
        groups: null,
      },
      configs: {level: config({required: true, default: 'info'})},
    });

    expect(carryOverDeploymentInput(declared, installedModule(setup()))?.configs).toEqual({});
  });

  it('needs input when a required config holds the empty string', () => {
    const declared = declaredModule({
      inputs: {
        configs: {name: {name: 'Name', description: '', group: ''}},
        resources: null,
        secrets: null,
        files: null,
        file_groups: null,
        groups: null,
      },
      configs: {name: config({required: true, default: 'fallback'})},
    });
    const current = setup({configs: {name: {data_type: DATA_TYPE_STRING, is_slice: false, value: ''}}});

    expect(carryOverDeploymentInput(declared, installedModule(current))).toBeUndefined();
  });

  it('needs input when the new version declares another data type for a config', () => {
    const declared = declaredModule({
      inputs: {
        configs: {port: {name: 'Port', description: '', group: ''}},
        resources: null,
        secrets: null,
        files: null,
        file_groups: null,
        groups: null,
      },
      configs: {port: config({data_type: 'int'})},
    });
    // the setup was created against the string version of the same config
    const current = setup({configs: {port: {data_type: DATA_TYPE_STRING, is_slice: false, value: '8080'}}});

    expect(carryOverDeploymentInput(declared, installedModule(current))).toBeUndefined();
  });

  it('needs input when the new version turned a config into a list', () => {
    const declared = declaredModule({
      inputs: {
        configs: {hosts: {name: 'Hosts', description: '', group: ''}},
        resources: null,
        secrets: null,
        files: null,
        file_groups: null,
        groups: null,
      },
      configs: {hosts: config({is_slice: true})},
    });
    const current = setup({configs: {hosts: {data_type: DATA_TYPE_STRING, is_slice: false, value: 'a'}}});

    expect(carryOverDeploymentInput(declared, installedModule(current))).toBeUndefined();
  });

  it('needs input when the stored value is not among the new options', () => {
    const declared = declaredModule({
      inputs: {
        configs: {mode: {name: 'Mode', description: '', group: ''}},
        resources: null,
        secrets: null,
        files: null,
        file_groups: null,
        groups: null,
      },
      configs: {mode: config({options: ['fast', 'slow']})},
    });
    const current = setup({configs: {mode: {data_type: DATA_TYPE_STRING, is_slice: false, value: 'medium'}}});

    expect(carryOverDeploymentInput(declared, installedModule(current))).toBeUndefined();
  });

  it('carries a value outside the options over when the new version allows that', () => {
    const declared = declaredModule({
      inputs: {
        configs: {mode: {name: 'Mode', description: '', group: ''}},
        resources: null,
        secrets: null,
        files: null,
        file_groups: null,
        groups: null,
      },
      configs: {mode: config({options: ['fast', 'slow'], opt_ext: true})},
    });
    const current = setup({configs: {mode: {data_type: DATA_TYPE_STRING, is_slice: false, value: 'medium'}}});

    expect(carryOverDeploymentInput(declared, installedModule(current))?.configs).toEqual({mode: 'medium'});
  });

  it('needs input when the stored value violates a constraint of the new version', () => {
    const declared = declaredModule({
      inputs: {
        configs: {port: {name: 'Port', description: '', group: ''}},
        resources: null,
        secrets: null,
        files: null,
        file_groups: null,
        groups: null,
      },
      configs: {
        port: config({
          data_type: 'int',
          type: 'number',
          type_opt: {min: {value: 1024, data_type: 'int'}},
        }),
      },
    });
    const current = setup({configs: {port: {data_type: DATA_TYPE_INT, is_slice: false, value: 80}}});

    expect(carryOverDeploymentInput(declared, installedModule(current))).toBeUndefined();
  });

  it('needs input when the stored value does not match the data type it claims', () => {
    const declared = declaredModule({
      inputs: {
        configs: {port: {name: 'Port', description: '', group: ''}},
        resources: null,
        secrets: null,
        files: null,
        file_groups: null,
        groups: null,
      },
      configs: {port: config({data_type: 'int'})},
    });
    // an int config whose stored value is a string: the min/max constraints of
    // the new version would not apply to it, so it cannot be checked at all
    const current = setup({configs: {port: {data_type: DATA_TYPE_INT, is_slice: false, value: '80'}}});

    expect(carryOverDeploymentInput(declared, installedModule(current))).toBeUndefined();
  });

  it('validates every item of a list, not just the first', () => {
    const declared = declaredModule({
      inputs: {
        configs: {modes: {name: 'Modes', description: '', group: ''}},
        resources: null,
        secrets: null,
        files: null,
        file_groups: null,
        groups: null,
      },
      configs: {modes: config({is_slice: true, options: ['fast', 'slow']})},
    });
    const current = setup({
      configs: {modes: {data_type: DATA_TYPE_STRING, is_slice: true, value: ['fast', 'medium']}},
    });

    expect(carryOverDeploymentInput(declared, installedModule(current))).toBeUndefined();
  });

  it('keeps a global config reference the setup points at', () => {
    const declared = declaredModule({
      inputs: {
        configs: {broker: {name: 'Broker', description: '', group: ''}},
        resources: null,
        secrets: null,
        files: null,
        file_groups: null,
        groups: null,
      },
      configs: {broker: config({required: true})},
    });
    const current = setup({global_configs: {broker: 'gc-1'}});

    const input = carryOverDeploymentInput(declared, installedModule(current));

    expect(input?.global_configs).toEqual({broker: 'gc-1'});
    expect(input?.configs).toEqual({});
  });

  it('drops a config the new version no longer declares', () => {
    const declared = declaredModule();
    const current = setup({configs: {gone: {data_type: DATA_TYPE_STRING, is_slice: false, value: 'x'}}});

    expect(carryOverDeploymentInput(declared, installedModule(current))?.configs).toEqual({});
  });

  it('needs input for a declared config without a definition to check it against', () => {
    const declared = declaredModule({
      inputs: {
        configs: {orphan: {name: 'Orphan', description: '', group: ''}},
        resources: null,
        secrets: null,
        files: null,
        file_groups: null,
        groups: null,
      },
      configs: {},
    });

    expect(carryOverDeploymentInput(declared, installedModule(setup()))).toBeUndefined();
  });

  it('needs input for a secret, host resource or file group the setup does not answer', () => {
    const cases: DeploymentRequestModule[] = [
      declaredModule({
        inputs: {
          secrets: {cert: {name: 'Cert', description: '', group: ''}},
          configs: null,
          resources: null,
          files: null,
          file_groups: null,
          groups: null,
        },
        secrets: {cert: {type: 'certificate', required: true}},
      }),
      declaredModule({
        inputs: {
          resources: {dev: {name: 'Device', description: '', group: ''}},
          configs: null,
          secrets: null,
          files: null,
          file_groups: null,
          groups: null,
        },
        host_resources: {dev: {required: true}},
      }),
    ];

    for (const declared of cases) {
      expect(carryOverDeploymentInput(declared, installedModule(setup()))).toBeUndefined();
    }
  });

  it('carries a declared file group nobody put a file in over as empty', () => {
    // There is no required flag for a file group, the form reports no error for
    // an empty one and the manager treats it as absent - so a form with nothing
    // to fill in would be the only thing asking achieves.
    const declared = declaredModule({
      inputs: {
        file_groups: {extra: {name: 'Extra', description: '', group: ''}},
        configs: null,
        secrets: null,
        resources: null,
        files: null,
        groups: null,
      },
    });

    expect(carryOverDeploymentInput(declared, installedModule(setup()))?.file_groups).toEqual({});
  });

  it('needs input when a stored file is empty rather than absent', () => {
    // Neither a content to carry over nor an absence the default answers.
    const declared = declaredModule({
      inputs: {
        files: {conf: {name: 'Conf', description: '', group: ''}},
        configs: null,
        secrets: null,
        resources: null,
        file_groups: null,
        groups: null,
      },
      files: {conf: {type: 'generic', required: false, default_data: 'ZGVmYXVsdA=='}},
    });
    const current = setup({files: {conf: ''}});

    expect(carryOverDeploymentInput(declared, installedModule(current))).toBeUndefined();
  });

  it('needs input when a stored list is empty', () => {
    // Sent on, an empty list is rejected against declared options and fails the
    // whole batch job, not only this module.
    const declared = declaredModule({
      inputs: {
        configs: {hosts: {name: 'Hosts', description: '', group: ''}},
        secrets: null,
        resources: null,
        files: null,
        file_groups: null,
        groups: null,
      },
      configs: {hosts: config({is_slice: true, options: ['a', 'b'], default: ['a']})},
    });
    const current = setup({configs: {hosts: {data_type: DATA_TYPE_STRING, is_slice: true, value: []}}});

    expect(carryOverDeploymentInput(declared, installedModule(current))).toBeUndefined();
  });

  it('needs input for a required file the new version ships no default for', () => {
    const declared = declaredModule({
      inputs: {
        files: {conf: {name: 'Conf', description: '', group: ''}},
        configs: null,
        secrets: null,
        resources: null,
        file_groups: null,
        groups: null,
      },
      files: {conf: {type: 'generic', required: true, default_data: ''}},
    });

    expect(carryOverDeploymentInput(declared, installedModule(setup()))).toBeUndefined();
  });

  it('lets a file without stored content fall back to the module default', () => {
    const declared = declaredModule({
      inputs: {
        files: {conf: {name: 'Conf', description: '', group: ''}},
        configs: null,
        secrets: null,
        resources: null,
        file_groups: null,
        groups: null,
      },
      files: {conf: {type: 'generic', required: true, default_data: 'YQ=='}},
    });

    expect(carryOverDeploymentInput(declared, installedModule(setup()))?.files).toEqual({});
  });

  it('needs input when either side is missing or reports an error', () => {
    const declared = declaredModule();
    const installed = installedModule(setup());

    expect(carryOverDeploymentInput(undefined, installed)).toBeUndefined();
    expect(carryOverDeploymentInput(declared, undefined)).toBeUndefined();
    expect(carryOverDeploymentInput(declaredModule({has_error: true, error_msg: 'boom'}), installed)).toBeUndefined();
    expect(carryOverDeploymentInput(declared, installedModule(setup({has_error: true})))).toBeUndefined();
    expect(carryOverDeploymentInput(declared, installedModule(setup(), {is_deployed: false}))).toBeUndefined();
  });
});
