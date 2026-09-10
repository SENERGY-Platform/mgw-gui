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
import {MatDialog} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {of} from 'rxjs';

import {provideTranslocoTesting} from 'src/testing/transloco-testing';
import {DEPLOYMENT_STATE_HEALTHY, ModuleReduced} from 'src/app/core/models/modules';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {UtilService} from 'src/app/core/services/util/util.service';
import {ListComponent} from './list.component';

function makeModule(id: string, deployed: boolean): ModuleReduced {
  return {
    id,
    source: 'github.com',
    channel: 'main',
    version: 'v1.0.0',
    name: id,
    description: '',
    tags: null,
    license: 'Apache-2.0',
    author: '',
    has_error: false,
    error_msg: '',
    is_deployed: deployed,
    deployment: {
      id: 'dpl-' + id,
      module_source: 'github.com',
      module_channel: 'main',
      module_version: 'v1.0.0',
      enabled: deployed,
      created: '',
      updated: '',
      state: deployed ? DEPLOYMENT_STATE_HEALTHY : 0,
      has_error: false,
      error_msg: '',
    },
  };
}

describe('ListComponent', () => {
  let fixture: ComponentFixture<ListComponent>;
  let component: ListComponent;

  const modules = [makeModule('running-a', true), makeModule('running-b', true), makeModule('installed-only', false)];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ListComponent, provideTranslocoTesting('modules', 'core')],
      providers: [
        provideNoopAnimations(),
        {
          provide: Router,
          useValue: {
            navigateByUrl: vi.fn(),
            navigate: vi.fn(),
            createUrlTree: vi.fn(),
            serializeUrl: vi.fn().mockReturnValue(''),
          },
        },
        {provide: ActivatedRoute, useValue: {params: of({}), queryParams: of({})}},
        {provide: MatDialog, useValue: {open: vi.fn()}},
        {
          provide: 'ModuleManagerService',
          useValue: {loadModulesReduced: vi.fn().mockReturnValue(of(modules))},
        },
        {provide: ErrorService, useValue: {handleError: vi.fn()}},
        {provide: UtilService, useValue: {checkJobStatus: vi.fn(), askForConfirmation: vi.fn()}},
      ],
    });

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // the component polls every five seconds; nothing here waits for it
    component.stopPeriodicRefresh();
  });

  it('reduces the selection to what a status filter leaves visible', () => {
    component.masterToggle();
    expect(component.selection.selected.length).toBe(3);

    component.setStatusFilter('healthy');

    // A bulk action reads the selection, not the table, so a row nobody can
    // see must not be in it - the master checkbox would otherwise arm Stop
    // for a module the filter just hid.
    expect(component.selection.selected).toEqual(['running-a', 'running-b']);
  });

  it('drops a selected row that the search term hides', () => {
    component.masterToggle();

    component.search = 'running-a';
    component.applyFilters();

    expect(component.selection.selected).toEqual(['running-a']);
  });

  it('keeps the selection when the filter hides nothing', () => {
    component.masterToggle();

    component.setStatusFilter('all');

    expect(component.selection.selected.length).toBe(3);
  });
});
