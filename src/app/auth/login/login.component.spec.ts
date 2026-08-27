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

import {ActivatedRoute} from '@angular/router';
import {AuthService} from 'src/app/core/services/auth/auth.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {environment} from 'src/environments/environment';
import {LoginComponent} from './login.component';

// returnTo ends up in window.location.href once the login succeeds, so what
// the query parameter is allowed to carry decides where a signed-in user can
// be sent. The component is built directly; nothing here touches the template.
function componentFor(returnTo: string | null): LoginComponent {
  const route = {
    snapshot: {queryParamMap: {get: (key: string) => (key === 'return_to' ? returnTo : null)}},
  } as unknown as ActivatedRoute;
  return new LoginComponent({} as AuthService, route, {} as ErrorService);
}

describe('LoginComponent return target', () => {
  it('keeps a path on this origin', () => {
    expect(componentFor('/modules').returnTo).toBe('/modules');
    expect(componentFor('/resources/secrets?q=1').returnTo).toBe('/resources/secrets?q=1');
  });

  it('reads the parameter url-encoded', () => {
    expect(componentFor('%2Fmodules%2Fcatalog').returnTo).toBe('/modules/catalog');
  });

  it('rejects a target on another origin', () => {
    const fallback = environment.uiBaseUrl || '/';
    // A browser reads each of these as a foreign host rather than a local path.
    expect(componentFor('//example.com').returnTo).toBe(fallback);
    expect(componentFor('%2F%2Fexample.com').returnTo).toBe(fallback);
    expect(componentFor('/\\example.com').returnTo).toBe(fallback);
    expect(componentFor('https://example.com').returnTo).toBe(fallback);
  });

  it('falls back to where the app is mounted', () => {
    const fallback = environment.uiBaseUrl || '/';
    expect(componentFor(null).returnTo).toBe(fallback);
    expect(componentFor('modules').returnTo).toBe(fallback);
  });
});
