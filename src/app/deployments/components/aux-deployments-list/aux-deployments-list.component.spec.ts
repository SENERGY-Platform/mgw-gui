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

import {Component} from '@angular/core';
import {ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks} from '@angular/core/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import type {Mock} from 'vitest';
import {provideTranslocoTesting} from 'src/testing/transloco-testing';

import {AuxDeploymentsListComponent} from './aux-deployments-list.component';

@Component({
  template: `<aux-deployments-list [deploymentID]="deploymentID"></aux-deployments-list>`,
  imports: [AuxDeploymentsListComponent],
})
class HostComponent {
  deploymentID = '';
}

describe('AuxDeploymentsListComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let moduleService: {getAuxDeployments: Mock};

  beforeEach(async () => {
    moduleService = {getAuxDeployments: vi.fn().mockReturnValue(of({}))};

    await TestBed.configureTestingModule({
      imports: [HostComponent, provideTranslocoTesting('deployments')],
      providers: [provideNoopAnimations(), {provide: 'ModuleManagerService', useValue: moduleService}],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
  });

  it('asks for nothing when the module has no deployment', fakeAsync(() => {
    // A module that was never deployed carries an empty deployment id. Asking
    // anyway builds /deployments//auxiliary/deployments, which is a 404 - and
    // the poll below would repeat it every five seconds for as long as the
    // page stays open.
    fixture.componentInstance.deploymentID = '';
    fixture.detectChanges();

    tick(11000);

    expect(moduleService.getAuxDeployments).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('says there is nothing rather than showing a spinner forever', () => {
    fixture.componentInstance.deploymentID = '';
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No auxiliary deployments');
  });

  it('loads and keeps polling once there is a deployment to ask about', fakeAsync(() => {
    fixture.componentInstance.deploymentID = 'dep-1';
    fixture.detectChanges();

    expect(moduleService.getAuxDeployments).toHaveBeenCalledWith('dep-1');

    tick(5000);
    expect(moduleService.getAuxDeployments.mock.calls.length).toBe(2);

    discardPeriodicTasks();
    fixture.destroy();
  }));
});
