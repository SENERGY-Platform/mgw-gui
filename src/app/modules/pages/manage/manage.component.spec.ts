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

import {DestroyRef, Injector, runInInjectionContext} from '@angular/core';
import {Router} from '@angular/router';
import {TranslocoService} from '@jsverse/transloco';
import {of, throwError} from 'rxjs';
import {ManageComponent} from './manage.component';
import {RepoModule} from 'src/app/core/models/repositories';
import {ModuleReduced} from 'src/app/core/models/modules';
import {DeploymentRequestModule, DeploymentUserInput} from 'src/app/core/models/deployment-request';
import {DATA_TYPE_INT} from 'src/app/core/models/global-configs';
import {NotificationService} from 'src/app/core/services/util/notifications.service';

const UPDATE_SCOPE_KEY = 'mgw-update-scope';

function repoModule(id: string, installed: boolean, nextVersion = ''): RepoModule {
  return {
    id: id,
    name: id,
    description: '',
    version: 'v1.0.0',
    repository_variants: [
      {source: 'src-a', priority: 1, channels: [{name: 'main', priority: 1, version: 'v1.0.0'}]},
      {source: 'src-b', priority: 0, channels: [{name: 'dev', priority: 0, version: 'v1.1.0'}]},
    ],
    is_installed: installed,
    installed_variant: installed
      ? {source: 'src-a', channel: 'main', version: 'v1.0.0', next_version: nextVersion}
      : {source: '', channel: '', version: '', next_version: ''},
  };
}

// A module whose installed variant moved ahead of the version its setup was
// created for - what needsDeploymentUpdate() reports as drift.
function driftedModule(id: string): ModuleReduced {
  return {
    id: id,
    source: 'src-a',
    channel: 'main',
    version: 'v2.0.0',
    name: id,
    description: '',
    tags: null,
    license: '',
    author: '',
    is_deployed: true,
    deployment: {
      id: 'dep-' + id,
      module_source: 'src-a',
      module_channel: 'main',
      module_version: 'v1.0.0',
      enabled: true,
      created: '',
      updated: '',
      state: 1,
      has_error: false,
      error_msg: '',
    },
    has_error: false,
    error_msg: '',
  };
}

function requestModule(id: string, needsInput: boolean): DeploymentRequestModule {
  return {
    id: id,
    name: id,
    description: '',
    version: 'v2.0.0',
    // a required config without a default that the setup holds no value for is
    // the one thing the follow-up cannot answer on its own
    // Either way the new version declares something: a config the setup
    // answers, or - for needsInput - one it does not.
    inputs: {
      configs: needsInput
        ? {token: {name: 'Token', description: '', group: ''}}
        : {port: {name: 'Port', description: '', group: ''}},
      resources: null,
      secrets: null,
      files: null,
      file_groups: null,
      groups: null,
    },
    configs: needsInput
      ? {
          token: {
            default: null,
            options: null,
            opt_ext: false,
            type: 'text',
            type_opt: null,
            data_type: 'string',
            is_slice: false,
            required: true,
          },
        }
      : {
          port: {
            default: null,
            options: null,
            opt_ext: false,
            type: 'number',
            type_opt: null,
            data_type: 'int',
            is_slice: false,
            required: true,
          },
        },
    secrets: null,
    host_resources: null,
    files: null,
    is_deployed: true,
    deployment: {
      id: 'dep-' + id,
      module_version: 'v1.0.0',
      enabled: true,
      host_resources: null,
      secrets: null,
      configs: needsInput ? null : {port: {data_type: DATA_TYPE_INT, is_slice: false, value: 8081}},
      global_configs: null,
      files: null,
      file_groups: null,
      has_error: false,
      error_msg: '',
    },
    has_error: false,
    error_msg: '',
  };
}

// The stubbed service calls the tests below assert on. Typed as mocks rather
// than as the service itself, so `.mock.calls` stays reachable.
interface ServiceSpies {
  executeModulesChangeRequest: ReturnType<typeof vi.fn>;
  loadModulesReduced: ReturnType<typeof vi.fn>;
  loadModulesFull: ReturnType<typeof vi.fn>;
  updateDeployments: ReturnType<typeof vi.fn>;
}

interface Harness {
  component: ManageComponent;
  service: ServiceSpies;
  navigateByUrl: ReturnType<typeof vi.fn>;
  showInfo: ReturnType<typeof vi.fn>;
}

// plain class tests: the collaborators are stubbed at the service boundary.
// The component reads TranslocoService, Router and NotificationService through
// inject(), so the direct construction has to happen inside an injection
// context that provides the stubs - translate() returns the key itself, since
// none of the tests below render translated text.
// `changed` names the modules the change job reports as changed; it defaults to
// every drifted one, since that is the ordinary case - a job that installed
// exactly what drifted.
function makeHarness(
  modules: RepoModule[],
  drifted: ModuleReduced[] = [],
  needsInput: string[] = [],
  changed: string[] = drifted.map((module) => module.id),
  // what the loader reports for the setup-update job; an absent result is what
  // cancelling looks like
  setupJob: {result?: unknown} = {result: {has_error: false, error_msg: '', results: []}},
): Harness {
  const moduleService: any = {
    loadRepositoryModules: () => of(modules),
    getAvailableUpdatesCount: () => of(0),
    getModulesChangeRequest: () => throwError(() => ({status: 404})),
    createModulesChangeRequest: vi.fn(() => of({install: null, change: null, remove: null, created: ''})),
    executeModulesChangeRequest: vi.fn(() => of({id: 'job-1'})),
    loadModulesReduced: vi.fn(() => of(drifted)),
    // /modules answers with the installed version's declarations next to the
    // stored deployment. /deployment-request would not: it omits every module
    // that already has one, which is every module a follow-up looks at.
    loadModulesFull: vi.fn((ids: string[]) => of(ids.map((id) => requestModule(id, needsInput.includes(id))))),
    updateDeployments: vi.fn(() => of({id: 'job-2'})),
  };
  const utilService = {
    // the kind tells the two jobs apart: the change request first, the setup
    // update afterwards
    checkJobStatus: (_id: string, _label: string, _service: string, kind: string) =>
      kind === 'deployments-update'
        ? of(setupJob)
        : of({
            result: {
              has_error: false,
              error_msg: '',
              success: changed.map((id) => ({id: id, action: 'change'})),
              failed: [],
              results: [],
            },
          }),
    presentJobResult: vi.fn(),
  };
  // the review dialog of an executed change request, closed with "execute"
  const dialog = {open: () => ({afterClosed: () => of('execute')})};
  const navigateByUrl = vi.fn();
  const showInfo = vi.fn();
  const injector = Injector.create({
    providers: [
      {provide: TranslocoService, useValue: {translate: (key: string) => key}},
      {provide: Router, useValue: {navigateByUrl: navigateByUrl}},
      {provide: NotificationService, useValue: {showInfo: showInfo}},
      // the follow-up ties its subscriptions to the component's lifetime;
      // nothing here destroys it, so the hook is never called
      {provide: DestroyRef, useValue: {onDestroy: () => () => undefined}},
    ],
  });
  const component = runInInjectionContext(
    injector,
    () => new ManageComponent(dialog as any, moduleService, {handleError: () => undefined} as any, utilService as any),
  );
  return {component: component, service: moduleService, navigateByUrl: navigateByUrl, showInfo: showInfo};
}

function makeComponent(modules: RepoModule[]) {
  return makeHarness(modules).component;
}

describe('ManageComponent.load', () => {
  it('lists the repository modules and marks the page ready', () => {
    const component = makeComponent([repoModule('mod-a', false), repoModule('mod-b', true)]);
    component.load();
    expect(component.dataSource.data.length).toBe(2);
    expect(component.ready).toBe(true);
  });

  it('keeps variant option identities stable across loads so change detection terminates', () => {
    // regression for c25c930: options recomputed per template call rebuilt the
    // mat-options every cycle and froze the renderer
    const component = makeComponent([repoModule('mod-a', false)]);
    component.load();
    const first = component.variantOptionsById['mod-a'];
    expect(first.length).toBe(2);
    expect(component.variantOptionsById['mod-a']).toBe(first);
  });

  it('preselects the installed variant, falling back to the first offered one', () => {
    const component = makeComponent([repoModule('installed-mod', true), repoModule('new-mod', false)]);
    component.load();
    expect(component.selectedVariant['installed-mod']).toBe('src-a|main');
    expect(component.selectedVariant['new-mod']).toBe('src-a|main');
  });

  it('turns selecting a different variant of an installed module into a change intent', () => {
    const component = makeComponent([repoModule('mod-a', true)]);
    component.load();
    expect(component.isVariantChange(component.dataSource.data[0])).toBe(false);
    component.selectedVariant['mod-a'] = 'src-b|dev';
    expect(component.isVariantChange(component.dataSource.data[0])).toBe(true);
  });
});

// The catalog already collected installs, changes, updates and removals into
// one change request; the selection stages one intent for many modules at
// once. Only that staging is under test here - creating and executing the
// request is unchanged.
describe('ManageComponent selection', () => {
  it('stages each selected module with its own primary action', () => {
    const component = makeComponent([
      repoModule('fresh', false),
      repoModule('outdated', true, 'v1.1.0'),
      repoModule('current', true),
    ]);
    component.load();

    component.selection.select('fresh', 'outdated', 'current');
    component.stageSelected();

    // 'current' is installed and up to date, so it contributes no entry
    expect(component.cartAction('fresh')).toBe('install');
    expect(component.cartAction('outdated')).toBe('update');
    expect(component.cartAction('current')).toBe('');
    expect(component.selection.selected.length).toBe(0);
  });

  it('stages the variant the user picked, not the installed one', () => {
    const component = makeComponent([repoModule('mod-a', true)]);
    component.load();
    component.selectedVariant['mod-a'] = 'src-b|dev';

    component.selection.select('mod-a');
    component.stageSelected();

    expect(component.cart['mod-a']).toEqual({id: 'mod-a', source: 'src-b', channel: 'dev'});
  });

  it('restricts the bulk update to installed modules that have one', () => {
    const component = makeComponent([
      repoModule('fresh', false),
      repoModule('outdated', true, 'v1.1.0'),
      repoModule('current', true),
    ]);
    component.load();

    component.selection.select('fresh', 'outdated', 'current');
    expect(component.updatableSelected().map((module) => module.id)).toEqual(['outdated']);

    component.stageUpdateForSelected();

    expect(component.cart).toEqual({outdated: {id: 'outdated', update: true}});
  });

  it('restricts the bulk removal to installed modules', () => {
    const component = makeComponent([repoModule('fresh', false), repoModule('installed', true)]);
    component.load();

    component.selection.select('fresh', 'installed');
    component.stageRemoveForSelected();

    expect(component.cart).toEqual({installed: {id: 'installed', remove: true}});
  });

  it('selects and clears every row through the header checkbox', () => {
    const component = makeComponent([repoModule('mod-a', false), repoModule('mod-b', false)]);
    component.load();

    component.masterToggle();
    expect(component.isAllSelected()).toBe(true);

    component.masterToggle();
    expect(component.selection.selected.length).toBe(0);
  });

  it('leaves a module that already carries a staged intent untouched', () => {
    const component = makeComponent([repoModule('mod-a', true, 'v1.1.0')]);
    component.load();
    component.remove(component.dataSource.data[0]);

    component.selection.select('mod-a');
    component.stageSelected();

    // the row offers undo rather than a second intent, and so does the bulk bar
    expect(component.cart['mod-a']).toEqual({id: 'mod-a', remove: true});
    expect(component.stageableSelected().length).toBe(0);
  });

  it('drops a selected module the reloaded catalog no longer lists', () => {
    const modules = [repoModule('mod-a', false), repoModule('mod-b', false)];
    const component = makeComponent(modules);
    component.load();
    component.selection.select('mod-a', 'mod-b');

    // a narrower filter, or a repository refresh that removed the module
    modules.pop();
    component.load();

    expect(component.selection.selected).toEqual(['mod-a']);
  });
});

// The second update path, beside the two-step one: the switch decides whether
// an executed change request is followed by an update of the setups.
describe('ManageComponent update scope', () => {
  afterEach(() => {
    localStorage.removeItem(UPDATE_SCOPE_KEY);
    // Storage.prototype is a shared global that outlives the spec that patched
    // it - unlike a Jasmine spy, vi.spyOn does not undo itself.
    vi.restoreAllMocks();
  });

  it('defaults to updating the modules only', () => {
    expect(makeComponent([]).updateScope).toBe('modules');
  });

  it('honours a stored scope and persists a changed one', () => {
    localStorage.setItem(UPDATE_SCOPE_KEY, 'modules-and-setups');
    expect(makeComponent([]).updateScope).toBe('modules-and-setups');

    const component = makeComponent([]);
    component.setUpdateScope('modules');
    expect(localStorage.getItem(UPDATE_SCOPE_KEY)).toBe('modules');
  });

  it('falls back to the default scope when the stored value is unknown', () => {
    localStorage.setItem(UPDATE_SCOPE_KEY, 'everything');
    expect(makeComponent([]).updateScope).toBe('modules');
  });

  it('survives a localStorage that throws on read and on write', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    let component!: ManageComponent;
    expect(() => (component = makeComponent([]))).not.toThrow();
    expect(component.updateScope).toBe('modules');
    expect(() => component.setUpdateScope('modules-and-setups')).not.toThrow();
    expect(component.updateScope).toBe('modules-and-setups');
  });

  it('leaves the setups alone with the default scope', () => {
    const harness = makeHarness([repoModule('mod-a', true, 'v2.0.0')], [driftedModule('mod-a')]);
    harness.component.reviewCart();

    expect(harness.service.executeModulesChangeRequest).toHaveBeenCalled();
    expect(harness.service.loadModulesReduced).not.toHaveBeenCalled();
    expect(harness.service.updateDeployments).not.toHaveBeenCalled();
    expect(harness.navigateByUrl).not.toHaveBeenCalled();
  });

  it('updates a setup whose declarations are all answered, without the form', () => {
    const harness = makeHarness([repoModule('mod-a', true, 'v2.0.0')], [driftedModule('mod-a')]);
    harness.component.setUpdateScope('modules-and-setups');

    harness.component.reviewCart();

    expect(harness.service.updateDeployments).toHaveBeenCalledTimes(1);
    expect(harness.service.updateDeployments.mock.calls[0][0]).toEqual([
      {
        module_id: 'mod-a',
        host_resources: {},
        secrets: {},
        configs: {port: 8081},
        global_configs: {},
        files: {},
        file_groups: {},
      },
    ]);
    expect(harness.navigateByUrl).not.toHaveBeenCalled();
  });

  it('offers the form for a setup the new version asks something new of', () => {
    const harness = makeHarness([repoModule('mod-a', true, 'v2.0.0')], [driftedModule('mod-a')], ['mod-a']);
    harness.component.setUpdateScope('modules-and-setups');

    harness.component.reviewCart();

    expect(harness.service.updateDeployments).not.toHaveBeenCalled();
    expect(harness.showInfo).toHaveBeenCalledOnce();
    expect(harness.navigateByUrl).toHaveBeenCalledWith('/deployments/edit/mod-a');
  });

  it('does not drag the user into a form when the setup job was cancelled', () => {
    // Cancelling closes the loader with no result, which is the only thing
    // telling it apart from a job that finished without one.
    const harness = makeHarness(
      [repoModule('mod-a', true, 'v2.0.0'), repoModule('mod-b', true, 'v2.0.0')],
      [driftedModule('mod-a'), driftedModule('mod-b')],
      ['mod-b'],
      ['mod-a', 'mod-b'],
      {result: undefined},
    );
    harness.component.setUpdateScope('modules-and-setups');

    harness.component.reviewCart();

    expect(harness.service.updateDeployments).toHaveBeenCalledTimes(1);
    expect(harness.navigateByUrl).not.toHaveBeenCalled();
  });

  it('updates the answered setups of a mixed batch and names the rest', () => {
    const harness = makeHarness(
      [repoModule('mod-a', true, 'v2.0.0'), repoModule('mod-b', true, 'v2.0.0')],
      [driftedModule('mod-a'), driftedModule('mod-b')],
      ['mod-b'],
    );
    harness.component.setUpdateScope('modules-and-setups');

    harness.component.reviewCart();

    expect(harness.service.updateDeployments).toHaveBeenCalledTimes(1);
    const inputs = harness.service.updateDeployments.mock.calls[0][0] as DeploymentUserInput[];
    expect(inputs.map((input) => input.module_id)).toEqual(['mod-a']);
    expect(harness.navigateByUrl).toHaveBeenCalledWith('/deployments/edit/mod-b');
  });

  it('does not touch the setups of modules that did not drift', () => {
    // the job changed mod-a, but its setup is already on that version
    const harness = makeHarness([repoModule('mod-a', true, 'v2.0.0')], [], [], ['mod-a']);
    harness.component.setUpdateScope('modules-and-setups');

    harness.component.reviewCart();

    expect(harness.service.loadModulesReduced).toHaveBeenCalledOnce();
    expect(harness.service.loadModulesFull).not.toHaveBeenCalled();
    expect(harness.service.updateDeployments).not.toHaveBeenCalled();
    expect(harness.navigateByUrl).not.toHaveBeenCalled();
  });

  it('leaves a drift this job did not cause alone', () => {
    // A setup left behind by an earlier session must not have its containers
    // recreated on the back of an unrelated install.
    const harness = makeHarness([repoModule('mod-a', true, 'v2.0.0')], [driftedModule('mod-b')], [], ['mod-a']);
    harness.component.setUpdateScope('modules-and-setups');

    harness.component.reviewCart();

    expect(harness.service.loadModulesFull).not.toHaveBeenCalled();
    expect(harness.service.updateDeployments).not.toHaveBeenCalled();
    expect(harness.navigateByUrl).not.toHaveBeenCalled();
  });
});
