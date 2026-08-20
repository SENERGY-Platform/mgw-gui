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

import {of, throwError} from 'rxjs';
import {ManageComponent} from './manage.component';
import {RepoModule} from 'src/app/core/models/repositories';

function repoModule(id: string, installed: boolean): RepoModule {
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
      ? {source: 'src-a', channel: 'main', version: 'v1.0.0', next_version: ''}
      : {source: '', channel: '', version: '', next_version: ''},
  };
}

// plain class tests: the collaborators are stubbed at the service boundary
function makeComponent(modules: RepoModule[]) {
  const moduleService: any = {
    loadRepositoryModules: () => of(modules),
    getAvailableUpdatesCount: () => of(0),
    getModulesChangeRequest: () => throwError(() => ({status: 404})),
  };
  return new ManageComponent({} as any, moduleService, {handleError: () => undefined} as any, {} as any);
}

describe('ManageComponent.load', () => {
  it('lists the repository modules and marks the page ready', () => {
    const component = makeComponent([repoModule('mod-a', false), repoModule('mod-b', true)]);
    component.load();
    expect(component.dataSource.data.length).toBe(2);
    expect(component.ready).toBeTrue();
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
    expect(component.isVariantChange(component.dataSource.data[0])).toBeFalse();
    component.selectedVariant['mod-a'] = 'src-b|dev';
    expect(component.isVariantChange(component.dataSource.data[0])).toBeTrue();
  });
});
