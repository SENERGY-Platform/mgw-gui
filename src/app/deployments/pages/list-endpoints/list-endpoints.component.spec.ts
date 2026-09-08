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

import {ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {of, throwError} from 'rxjs';

import {provideTranslocoTesting} from 'src/testing/transloco-testing';
import {CoreEndpoint, CoreEndpointsResponse} from '../../models/endpoints';
import {CoreManagerService} from 'src/app/core/services/core-manager/core-manager.service';
import {ModuleReduced} from 'src/app/core/models/modules';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {UtilService} from 'src/app/core/services/util/util.service';
import {ListEndpointsComponent} from './list-endpoints.component';

const MODULE_ID = 'github.com/SENERGY-Platform/mgw-cloud-proxy/mgw-module';
const MODULE_NAME = 'Cloud proxy';
const DEPLOYMENT_ID = '01a080b1-77a3-7a0e-8986-df2430464256';

// only the two fields the page reads off the module list
function module(id: string, name: string): ModuleReduced {
  return {id: id, name: name} as ModuleReduced;
}

function endpoint(overrides: Partial<CoreEndpoint> = {}): CoreEndpoint {
  return {
    id: 'ep-1',
    parent_id: '',
    type: 1,
    host: 'mgw-host',
    int_path: '',
    ext_path: 'manager',
    labels: {mod_id: MODULE_ID, srv_ref: DEPLOYMENT_ID},
    ref: DEPLOYMENT_ID,
    port: 8080,
    ...overrides,
  };
}

function response(endpoints: CoreEndpoint[]): CoreEndpointsResponse {
  return Object.fromEntries(endpoints.map((e) => [e.id, e]));
}

describe('ListEndpointsComponent (endpoints page)', () => {
  let fixture: ComponentFixture<ListEndpointsComponent>;
  let component: ListEndpointsComponent;

  function create(endpoints: CoreEndpoint[], modules: ModuleReduced[] | 'fails' = [module(MODULE_ID, MODULE_NAME)]) {
    TestBed.configureTestingModule({
      imports: [ListEndpointsComponent, provideTranslocoTesting('deployments', 'core')],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        {
          provide: CoreManagerService,
          useValue: {getEndpoints: vi.fn().mockReturnValue(of(response(endpoints)))},
        },
        {
          provide: 'ModuleManagerService',
          useValue: {
            loadModulesReduced: vi
              .fn()
              .mockReturnValue(modules === 'fails' ? throwError(() => new Error('unreachable')) : of(modules)),
          },
        },
        {provide: ErrorService, useValue: {handleError: vi.fn()}},
        {provide: UtilService, useValue: {checkJobStatus: vi.fn(), askForConfirmation: vi.fn()}},
      ],
    });

    fixture = TestBed.createComponent(ListEndpointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function heading(): HTMLElement {
    return fixture.nativeElement.querySelector('.deployment-head') as HTMLElement;
  }

  it('names the module the core labelled the endpoints with', fakeAsync(() => {
    create([endpoint()]);

    // the deployment uuid alone told the reader nothing about which module
    // these endpoints belong to
    expect(heading().textContent).toContain(MODULE_NAME);
    expect(heading().textContent).toContain(MODULE_ID);
    expect(heading().textContent).not.toContain(DEPLOYMENT_ID);
    discardPeriodicTasks();
  }));

  it('falls back to the module id when the module list does not know it', fakeAsync(() => {
    create([endpoint()], [module('github.com/acme/other', 'Something else')]);

    expect(heading().querySelector('a')?.textContent?.trim()).toBe(MODULE_ID);
    // and then does not print the same id twice
    expect(heading().querySelector('.group-id')).toBeNull();
    discardPeriodicTasks();
  }));

  it('keeps the endpoints visible when the module list cannot be loaded', fakeAsync(() => {
    create([endpoint()], 'fails');

    // the names are a nicety; losing them must not cost the whole page
    expect(component.ready).toBe(true);
    expect(heading().querySelector('a')?.textContent?.trim()).toBe(MODULE_ID);
    discardPeriodicTasks();
  }));

  it('links the module to its own endpoints tab', fakeAsync(() => {
    create([endpoint()]);

    const link = heading().querySelector('a');

    expect(link?.getAttribute('href')).toBe(
      '/modules/detail/github.com%2FSENERGY-Platform%2Fmgw-cloud-proxy%2Fmgw-module?tab=endpoints',
    );
    discardPeriodicTasks();
  }));

  it('falls back to the deployment when no endpoint of the group is labelled', fakeAsync(() => {
    create([endpoint({labels: {}})]);

    expect(heading().textContent).toContain(DEPLOYMENT_ID);
    expect(heading().querySelector('a')).toBeNull();
    discardPeriodicTasks();
  }));

  it('takes the label from whichever endpoint has one, not the first', fakeAsync(() => {
    // an alias comes first and carries no mod_id of its own
    create([endpoint({id: 'ep-alias', type: 2, parent_id: 'ep-1', labels: {}}), endpoint()]);

    expect(component.groups.length).toBe(1);
    expect(heading().textContent).toContain(MODULE_NAME);
    discardPeriodicTasks();
  }));

  it('keeps one group per deployment', fakeAsync(() => {
    create([endpoint(), endpoint({id: 'ep-2', ref: 'other-deployment', labels: {mod_id: 'github.com/acme/other'}})]);

    expect(component.groups.map((group) => group.ref)).toEqual([DEPLOYMENT_ID, 'other-deployment']);
    discardPeriodicTasks();
  }));
});
