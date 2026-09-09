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

import {ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick} from '@angular/core/testing';
import {ActivatedRoute, Router} from '@angular/router';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import type {Mock} from 'vitest';

import {provideTranslocoTesting} from 'src/testing/transloco-testing';
import {DEPLOYMENT_STATE_HEALTHY, ModuleInfo} from 'src/app/core/models/modules';
import {ModuleConfigValue} from 'src/app/core/models/deployment-request';
import {InterfaceValue} from 'src/app/core/models/global-configs';
import {CoreManagerService} from 'src/app/core/services/core-manager/core-manager.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {UtilService} from 'src/app/core/services/util/util.service';
import {ConfigRow, InfoComponent} from './info.component';

const MODULE_ID = 'github.com/SENERGY-Platform/mgw-cloud-proxy/mgw-module';

interface ConfigOpts {
  // what the module declares, by config reference
  declared?: Record<string, ModuleConfigValue>;
  // the user's own values, by config reference
  values?: Record<string, InterfaceValue> | null;
  // global config ids, by config reference
  globals?: Record<string, string> | null;
  names?: Record<string, {name: string; description: string; group: string}>;
}

function moduleConfig(overrides: Partial<ModuleConfigValue> = {}): ModuleConfigValue {
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

function makeModule(deployed: boolean, configs: ConfigOpts = {}): ModuleInfo {
  return {
    id: MODULE_ID,
    name: 'Cloud proxy',
    description: '',
    version: 'v1.0.0',
    author: '',
    license: 'Apache-2.0',
    tags: null,
    source: 'github.com',
    channel: 'main',
    added: '',
    updated: '',
    has_error: false,
    error_msg: '',
    is_deployed: deployed,
    deployment: {
      id: 'dpl-1',
      module_source: 'github.com',
      module_channel: 'main',
      module_version: 'v1.0.0',
      enabled: true,
      created: '',
      updated: '',
      state: DEPLOYMENT_STATE_HEALTHY,
      containers: null,
      configs: configs.values ?? null,
      global_configs: configs.globals ?? null,
      has_error: false,
      error_msg: '',
    },
    inputs: {
      configs: configs.names ?? null,
      resources: null,
      secrets: null,
      files: null,
      file_groups: null,
      groups: null,
    },
    configs: configs.declared ?? null,
  };
}

describe('InfoComponent', () => {
  let fixture: ComponentFixture<InfoComponent>;
  let component: InfoComponent;
  let navigate: Mock;

  function create(opts: {deployed?: boolean; tab?: string; configs?: ConfigOpts; globalConfigs?: unknown} = {}) {
    navigate = vi.fn();
    TestBed.configureTestingModule({
      imports: [InfoComponent, provideTranslocoTesting('modules', 'core')],
      providers: [
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({id: MODULE_ID}),
            queryParams: of(opts.tab ? {tab: opts.tab} : {}),
          },
        },
        {provide: Router, useValue: {navigate: navigate}},
        {
          provide: 'ModuleManagerService',
          useValue: {
            loadModule: vi.fn().mockReturnValue(of(makeModule(opts.deployed ?? true, opts.configs))),
            // the aux tab's body is built when that tab is selected
            getAuxDeployments: vi.fn().mockReturnValue(of({})),
            getGlobalConfigs: vi.fn().mockReturnValue(of(opts.globalConfigs ?? {})),
          },
        },
        {provide: CoreManagerService, useValue: {getEndpoints: vi.fn().mockReturnValue(of({}))}},
        {provide: ErrorService, useValue: {handleError: vi.fn()}},
        {provide: UtilService, useValue: {checkJobStatus: vi.fn(), askForConfirmation: vi.fn()}},
      ],
    });

    fixture = TestBed.createComponent(InfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function tabLabels(): string[] {
    const labels = fixture.nativeElement.querySelectorAll('.mat-mdc-tab .mdc-tab__text-label');
    return Array.from(labels).map((label) => (label as HTMLElement).textContent!.trim());
  }

  it('offers an endpoints tab', fakeAsync(() => {
    create();

    expect(tabLabels()).toEqual(['Overview', 'Configuration', 'Containers', 'Endpoints', 'Auxiliary deployments']);
    discardPeriodicTasks();
  }));

  it('disables the endpoints tab for a module that is not deployed', fakeAsync(() => {
    create({deployed: false});

    const endpointsTab = fixture.nativeElement.querySelectorAll('.mat-mdc-tab')[3] as HTMLElement;

    expect(endpointsTab.getAttribute('aria-disabled')).toBe('true');
    discardPeriodicTasks();
  }));

  // The tab query parameter carries the name, not the index. Inserting a tab
  // must therefore leave existing links intact - the logs page sends the
  // reader back to 'containers'.
  it('still selects the tab a link names, after the insertion', fakeAsync(() => {
    create({tab: 'containers'});

    expect(component.selectedTab).toBe(2);
    discardPeriodicTasks();
  }));

  it('still selects the tab the insertion pushed along', fakeAsync(() => {
    create({tab: 'auxDeployments'});

    expect(component.selectedTab).toBe(4);
    discardPeriodicTasks();
  }));

  it('selects the endpoints tab from its name', fakeAsync(() => {
    create({tab: 'endpoints'});

    expect(component.selectedTab).toBe(3);
    discardPeriodicTasks();
  }));

  it('writes the name of the tab it switches to into the url', fakeAsync(() => {
    create();

    component.onTabChange(3);
    tick();

    expect(navigate).toHaveBeenCalled();
    expect(navigate.mock.calls[0][1].queryParams).toEqual({tab: 'endpoints'});
    discardPeriodicTasks();
  }));

  // SNRGY-4695: the module declares which configs exist, the deployment answers
  // some of them, and the tab has to say which of the two a value came from.
  describe('configuration tab', () => {
    function rowsFor(opts: {deployed?: boolean; configs?: ConfigOpts; globalConfigs?: unknown}): ConfigRow[] {
      create(opts);
      return component.configRows;
    }

    it('falls back to the module default for a config the deployment does not answer', fakeAsync(() => {
      const rows = rowsFor({
        configs: {
          declared: {logLevel: moduleConfig({default: 'warning', required: true})},
          names: {logLevel: {name: 'Log level', description: 'How chatty', group: ''}},
        },
      });

      expect(rows).toEqual([
        {
          ref: 'logLevel',
          name: 'Log level',
          description: 'How chatty',
          group: '',
          value: 'warning',
          origin: 'default',
          required: true,
        },
      ]);
      discardPeriodicTasks();
    }));

    it('shows the user input where there is one', fakeAsync(() => {
      const rows = rowsFor({
        configs: {
          declared: {port: moduleConfig({default: 8080, data_type: 'int'})},
          values: {port: {data_type: 2, is_slice: false, value: 8081}},
        },
      });

      expect(rows[0].value).toBe('8081');
      expect(rows[0].origin).toBe('input');
      discardPeriodicTasks();
    }));

    // A config pointed at a global config is user input too - reading it as a
    // module default would name the wrong value as the effective one.
    it('names the global config a value was taken from', fakeAsync(() => {
      const rows = rowsFor({
        configs: {
          declared: {broker: moduleConfig({default: 'localhost'})},
          globals: {broker: 'gc-1'},
        },
        globalConfigs: {'gc-1': {id: 'gc-1', name: 'Shared broker', data_type: 1, is_slice: false, value: 'mqtt'}},
      });

      expect(rows[0].value).toBe('Shared broker');
      expect(rows[0].origin).toBe('global');
      discardPeriodicTasks();
    }));

    it('keeps the id when the name of a global config cannot be fetched', fakeAsync(() => {
      const rows = rowsFor({
        configs: {declared: {broker: moduleConfig()}, globals: {broker: 'gc-unknown'}},
      });

      expect(rows[0].value).toBe('gc-unknown');
      discardPeriodicTasks();
    }));

    // After an update that dropped a config, the deployment still carries the
    // value. Hiding it would leave no way to find out why it stopped applying.
    it('lists a value the module no longer declares as deprecated', fakeAsync(() => {
      const rows = rowsFor({
        configs: {
          declared: {kept: moduleConfig({default: 'a'})},
          values: {
            kept: {data_type: 1, is_slice: false, value: 'b'},
            gone: {data_type: 1, is_slice: false, value: 'c'},
          },
        },
      });

      expect(rows.map((row) => [row.ref, row.origin])).toEqual([
        ['kept', 'input'],
        ['gone', 'deprecated'],
      ]);
      expect(rows[1].value).toBe('c');
      discardPeriodicTasks();
    }));

    it('ignores the deployment of a module that is not deployed', fakeAsync(() => {
      const rows = rowsFor({
        deployed: false,
        configs: {
          declared: {port: moduleConfig({default: 8080, data_type: 'int'})},
          values: {port: {data_type: 2, is_slice: false, value: 8081}},
        },
      });

      expect(rows[0].value).toBe('8080');
      expect(rows[0].origin).toBe('default');
      discardPeriodicTasks();
    }));

    it('renders a slice default as one line', fakeAsync(() => {
      const rows = rowsFor({
        configs: {declared: {hosts: moduleConfig({default: ['a', 'b'], is_slice: true})}},
      });

      expect(rows[0].value).toBe('a, b');
      // no user input metadata: the reference is the only name there is
      expect(rows[0].name).toBe('hosts');
      discardPeriodicTasks();
    }));
  });
});
