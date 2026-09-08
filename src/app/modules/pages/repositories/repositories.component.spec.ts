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
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import type {Mock} from 'vitest';

import {provideTranslocoTesting} from 'src/testing/transloco-testing';
import {Repository} from 'src/app/core/models/repositories';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {UtilService} from 'src/app/core/services/util/util.service';
import {RepositoriesComponent} from './repositories.component';

function repository(overrides: Partial<Repository> = {}): Repository {
  return {
    type: 'github.com',
    source: 'github.com/SENERGY-Platform/mgw-module-repository',
    priority: 100,
    channels: [{name: 'main', priority: 2}],
    ...overrides,
  };
}

describe('RepositoriesComponent', () => {
  let fixture: ComponentFixture<RepositoriesComponent>;
  let component: RepositoriesComponent;
  let moduleService: {
    getRepositories: Mock;
    createRepository: Mock;
    refreshRepositories: Mock;
    deleteRepository: Mock;
  };
  let utilService: {checkJobStatus: Mock; presentJobResult: Mock; askForConfirmation: Mock};
  let errorService: {handleError: Mock};
  let dialog: {open: Mock};

  // The repositories the page has loaded before the add, the list the create
  // is followed by, and the job result the refresh reports.
  function create(opts: {before?: Repository[]; after?: Repository[]; jobResult?: undefined} = {}) {
    moduleService = {
      getRepositories: vi.fn().mockReturnValue(of(opts.after ?? opts.before ?? [])),
      createRepository: vi.fn().mockReturnValue(of('')),
      refreshRepositories: vi.fn().mockReturnValue(of({id: 'job-1'})),
      deleteRepository: vi.fn().mockReturnValue(of(true)),
    };
    utilService = {
      checkJobStatus: vi.fn().mockReturnValue(of(opts.jobResult)),
      presentJobResult: vi.fn(),
      askForConfirmation: vi.fn().mockReturnValue(of(true)),
    };
    errorService = {handleError: vi.fn()};
    dialog = {open: vi.fn()};

    TestBed.configureTestingModule({
      imports: [RepositoriesComponent, provideTranslocoTesting('modules')],
      providers: [
        provideNoopAnimations(),
        {provide: 'ModuleManagerService', useValue: moduleService},
        {provide: UtilService, useValue: utilService},
        {provide: ErrorService, useValue: errorService},
        {provide: MatDialog, useValue: dialog},
      ],
    });

    fixture = TestBed.createComponent(RepositoriesComponent);
    component = fixture.componentInstance;
    // ngOnInit's load() consumes the first getRepositories call
    fixture.detectChanges();
    component.dataSource.data = opts.before ?? [];
    fixture.detectChanges();
  }

  // SNRGY-4686
  describe('read-only repositories', () => {
    it('treats a repository the core marks read_only as read-only', () => {
      create();

      expect(component.isReadOnly(repository({read_only: true}))).toBe(true);
      expect(component.isReadOnly(repository({read_only: false}))).toBe(false);
    });

    it('still protects host-dir against a core that does not send the flag', () => {
      create();

      expect(component.isReadOnly(repository({type: 'host-dir', source: 'localhost'}))).toBe(true);
    });

    it('marks it built in instead of offering a delete', () => {
      create({before: [repository({read_only: true})]});

      const cell = fixture.nativeElement.querySelector('.mgw-row-actions') as HTMLElement;

      expect(cell.querySelector('.locked')).not.toBeNull();
      expect(cell.querySelector('button')).toBeNull();
    });

    it('offers a delete for a repository the user added', () => {
      create({before: [repository({read_only: false})]});

      const cell = fixture.nativeElement.querySelector('.mgw-row-actions') as HTMLElement;

      expect(cell.querySelector('.locked')).toBeNull();
      expect(cell.querySelector('button')).not.toBeNull();
    });

    it('refuses to delete a read-only repository', () => {
      create();

      component.delete(repository({read_only: true}));

      expect(moduleService.deleteRepository).not.toHaveBeenCalled();
      expect(errorService.handleError).toHaveBeenCalled();
    });
  });
});
