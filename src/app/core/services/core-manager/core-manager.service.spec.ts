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
import {CoreManagerService} from './core-manager.service';

describe('CoreManagerService single sign-on setting', () => {
  let service: CoreManagerService;
  let http: HttpTestingController;
  const url = environment.coreApiUrl + '/core-manager/oidc';

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    service = TestBed.inject(CoreManagerService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the setting', () => {
    service.getOidcSettings().subscribe();

    const req = http.expectOne(url);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  // The job id comes back as plain text; parsed as JSON it would fail.
  it('writes the setting and returns the job id as text', () => {
    let jobID = '';
    service
      .updateOidcSettings({enabled: false, issuer_url: '', client_id: '', scope: [], external_url: ''})
      .subscribe((id) => (jobID = id));

    const req = http.expectOne(url);
    expect(req.request.method).toBe('PUT');
    expect(req.request.responseType).toBe('text');
    req.flush('c0ffee12');
    expect(jobID).toBe('c0ffee12');
  });
});
