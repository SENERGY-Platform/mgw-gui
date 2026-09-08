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
import {CoreManagerService} from 'src/app/core/services/core-manager/core-manager.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {UtilService} from 'src/app/core/services/util/util.service';
import {InfoComponent} from './info.component';

const MODULE_ID = 'github.com/SENERGY-Platform/mgw-cloud-proxy/mgw-module';

function makeModule(deployed: boolean): ModuleInfo {
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
      has_error: false,
      error_msg: '',
    },
  };
}

describe('InfoComponent', () => {
  let fixture: ComponentFixture<InfoComponent>;
  let component: InfoComponent;
  let navigate: Mock;

  function create(opts: {deployed?: boolean; tab?: string} = {}) {
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
            loadModule: vi.fn().mockReturnValue(of(makeModule(opts.deployed ?? true))),
            // the aux tab's body is built when that tab is selected
            getAuxDeployments: vi.fn().mockReturnValue(of({})),
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

    expect(tabLabels()).toEqual(['Overview', 'Containers', 'Endpoints', 'Auxiliary deployments']);
    discardPeriodicTasks();
  }));

  it('disables the endpoints tab for a module that is not deployed', fakeAsync(() => {
    create({deployed: false});

    const endpointsTab = fixture.nativeElement.querySelectorAll('.mat-mdc-tab')[2] as HTMLElement;

    expect(endpointsTab.getAttribute('aria-disabled')).toBe('true');
    discardPeriodicTasks();
  }));

  // The tab query parameter carries the name, not the index. Inserting a tab
  // must therefore leave existing links intact - the logs page sends the
  // reader back to 'containers'.
  it('still selects the tab a link names, after the insertion', fakeAsync(() => {
    create({tab: 'containers'});

    expect(component.selectedTab).toBe(1);
    discardPeriodicTasks();
  }));

  it('still selects the tab the insertion pushed along', fakeAsync(() => {
    create({tab: 'auxDeployments'});

    expect(component.selectedTab).toBe(3);
    discardPeriodicTasks();
  }));

  it('selects the endpoints tab from its name', fakeAsync(() => {
    create({tab: 'endpoints'});

    expect(component.selectedTab).toBe(2);
    discardPeriodicTasks();
  }));

  it('writes the name of the tab it switches to into the url', fakeAsync(() => {
    create();

    component.onTabChange(2);
    tick();

    expect(navigate).toHaveBeenCalled();
    expect(navigate.mock.calls[0][1].queryParams).toEqual({tab: 'endpoints'});
    discardPeriodicTasks();
  }));
});
