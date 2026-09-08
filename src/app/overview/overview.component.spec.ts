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
import {provideRouter} from '@angular/router';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {TranslocoService} from '@jsverse/transloco';
import {firstValueFrom, of} from 'rxjs';
import {provideTranslocoTesting} from 'src/testing/transloco-testing';
import {DEPLOYMENT_STATE_HEALTHY, DEPLOYMENT_STATE_UNHEALTHY, ModuleReduced} from '../core/models/modules';

import {OverviewComponent} from './overview.component';

const MODULE_ID = 'github.com/SENERGY-Platform/mgw-test-modules/mod-a';

interface ModuleOpts {
  state?: number;
  hasError?: boolean;
  errorMsg?: string;
  deploymentHasError?: boolean;
  deploymentErrorMsg?: string;
}

// Only the fields the overview reads are filled in; the deployment always
// matches the installed variant so that no update entry is added on top.
function makeModule(opts: ModuleOpts = {}): ModuleReduced {
  return {
    id: MODULE_ID,
    source: 'github.com',
    channel: 'main',
    version: 'v1.0.0',
    name: 'Module A',
    description: '',
    tags: null,
    license: 'Apache-2.0',
    author: '',
    has_error: opts.hasError ?? false,
    error_msg: opts.errorMsg ?? '',
    is_deployed: true,
    deployment: {
      id: 'dpl-1',
      module_source: 'github.com',
      module_channel: 'main',
      module_version: 'v1.0.0',
      enabled: true,
      created: '',
      updated: '',
      state: opts.state ?? DEPLOYMENT_STATE_HEALTHY,
      has_error: opts.deploymentHasError ?? false,
      error_msg: opts.deploymentErrorMsg ?? '',
    },
  };
}

describe('OverviewComponent', () => {
  let fixture: ComponentFixture<OverviewComponent>;
  let component: OverviewComponent;

  async function create(modules: ModuleReduced[]): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [OverviewComponent, provideTranslocoTesting('overview')],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        {
          provide: 'ModuleManagerService',
          useValue: {
            loadModulesReduced: vi.fn().mockReturnValue(of(modules)),
            getAvailableUpdatesCount: vi.fn().mockReturnValue(of(0)),
            getJobs: vi.fn().mockReturnValue(of([])),
          },
        },
        {provide: 'CoreManagerService', useValue: {getServices: vi.fn().mockReturnValue(of({}))}},
      ],
    }).compileComponents();

    // The component resolves its generic texts through TranslocoService in
    // TypeScript, so the scope has to be loaded before the (synchronous) mock
    // response reaches recount(). In the app the HTTP round trip does that.
    await firstValueFrom(TestBed.inject(TranslocoService).load('overview/en'));

    fixture = TestBed.createComponent(OverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  // stops the five-second poll ngOnInit starts
  afterEach(() => fixture?.destroy());

  it('lists an unhealthy module with a backend error once, carrying that error', async () => {
    await create([
      makeModule({
        state: DEPLOYMENT_STATE_UNHEALTHY,
        deploymentHasError: true,
        deploymentErrorMsg: 'container exited with code 1',
      }),
    ]);

    expect(component.attention.length).toBe(1);
    expect(component.attention[0].detail).toBe('container exited with code 1');
  });

  it('falls back to the generic text when an unhealthy deployment reports no message', async () => {
    await create([makeModule({state: DEPLOYMENT_STATE_UNHEALTHY})]);

    expect(component.attention.length).toBe(1);
    expect(component.attention[0].detail).toContain('unhealthy state');
  });

  it('reports a module error on a healthy deployment', async () => {
    await create([makeModule({hasError: true, errorMsg: 'modfile is invalid'})]);

    expect(component.attention.length).toBe(1);
    expect(component.attention[0].detail).toBe('modfile is invalid');
  });

  it('escapes the module ID in the link exactly once', async () => {
    await create([makeModule({state: DEPLOYMENT_STATE_UNHEALTHY})]);

    const link = (fixture.nativeElement as HTMLElement).querySelector('a.attention');

    // %252F is a literal "%2F" in the path: the module detail route never
    // matches it, which is what produced the 404 on every entry
    expect(link?.getAttribute('href')).toBe('/modules/detail/github.com%2FSENERGY-Platform%2Fmgw-test-modules%2Fmod-a');
  });
});
