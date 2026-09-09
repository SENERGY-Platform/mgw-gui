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

import {Injector, runInInjectionContext} from '@angular/core';
import {TranslocoService} from '@jsverse/transloco';
import {of, throwError} from 'rxjs';
import {ManageComponent} from './manage.component';
import {RepoModule} from 'src/app/core/models/repositories';

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

// plain class tests: the collaborators are stubbed at the service boundary.
// The component reads TranslocoService through inject(), so the direct
// construction has to happen inside an injection context that provides the
// stub - translate() returns the key itself, since none of the tests below
// render translated text.
function makeComponent(modules: RepoModule[]) {
  const moduleService: any = {
    loadRepositoryModules: () => of(modules),
    getAvailableUpdatesCount: () => of(0),
    getModulesChangeRequest: () => throwError(() => ({status: 404})),
  };
  const injector = Injector.create({
    providers: [{provide: TranslocoService, useValue: {translate: (key: string) => key}}],
  });
  return runInInjectionContext(
    injector,
    () => new ManageComponent({} as any, moduleService, {handleError: () => undefined} as any, {} as any),
  );
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
