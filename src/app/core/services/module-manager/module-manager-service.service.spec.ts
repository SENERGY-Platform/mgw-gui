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

import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {environment} from 'src/environments/environment';
import {AutoUpdateSettings} from '../../models/auto-update';
import {ModuleManagerService} from './module-manager-service.service';

describe('ModuleManagerService auto-update and carry-over', () => {
  let service: ModuleManagerService;
  let http: HttpTestingController;
  const base = environment.coreApiUrl + '/module-manager';
  const settings: AutoUpdateSettings = {
    enabled: true,
    level: 'minor',
    window_start: '22:00',
    window_end: '04:00',
    time_zone: 'Europe/Berlin',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    service = TestBed.inject(ModuleManagerService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the settings', () => {
    let result: AutoUpdateSettings | undefined;
    service.getAutoUpdateSettings().subscribe((s) => (result = s));

    const req = http.expectOne(base + '/auto-update');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush(settings);
    expect(result).toEqual(settings);
  });

  // the answer to a PUT is plain text; parsed as JSON it would fail
  it('writes the settings as text', () => {
    service.updateAutoUpdateSettings(settings).subscribe();

    const req = http.expectOne(base + '/auto-update');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(settings);
    expect(req.request.responseType).toBe('text');
    req.flush('');
  });

  it('reads the status including the last run', () => {
    service.getAutoUpdateStatus().subscribe();

    const req = http.expectOne(base + '/auto-update/status');
    expect(req.request.method).toBe('GET');
    req.flush({...settings, last_run: null});
  });

  it('passes a 404 on the auto-update routes through to the caller', () => {
    let status = 0;
    service.getAutoUpdateStatus().subscribe({error: (err) => (status = err.status)});

    http.expectOne(base + '/auto-update/status').flush('not found', {status: 404, statusText: 'Not Found'});
    expect(status).toBe(404);
  });

  it('asks for the carry-over of the given modules as a comma separated list', () => {
    service.getDeploymentsCarryOver(['a', 'b']).subscribe();

    const req = http.expectOne((r) => r.url === base + '/deployments-carry-over');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('module_ids')).toBe('a,b');
    req.flush([]);
  });
});

describe('ModuleManagerService restart', () => {
  let service: ModuleManagerService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    service = TestBed.inject(ModuleManagerService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts the module ids to the restart route and returns the job', () => {
    let job: unknown;
    service.restartDeployments(['m1', 'm2']).subscribe((j) => (job = j));

    const req = http.expectOne(environment.coreApiUrl + '/module-manager/deployments-restart');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(['m1', 'm2']);
    req.flush({id: 'job-1'});
    expect(job).toEqual({id: 'job-1'});
  });
});
