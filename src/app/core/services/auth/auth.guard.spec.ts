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

import {TestBed} from '@angular/core/testing';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {provideRouter} from '@angular/router';
import {firstValueFrom, Observable, of} from 'rxjs';
import {AuthService} from './auth.service';
import {authGuard} from './auth.guard';

function runGuard(hasSession: boolean): Promise<boolean | UrlTree> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), {provide: AuthService, useValue: {hasSession: () => of(hasSession)}}],
  });
  return TestBed.runInInjectionContext(async () => {
    const result = authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
    return firstValueFrom(result as Observable<boolean | UrlTree>);
  });
}

describe('authGuard', () => {
  it('lets the navigation through when a session exists', async () => {
    expect(await runGuard(true)).toBe(true);
  });

  it('sends a visitor without a session to the login page', async () => {
    const result = await runGuard(false);

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toContain('/login');
  });

  // The login page hands return_to to location.href, so it has to carry the
  // browser's own path - the router url would drop the base the gateway
  // serves the application under.
  it('carries the current browser path along as return_to', async () => {
    const result = await runGuard(false);
    const url = TestBed.inject(Router).serializeUrl(result as UrlTree);

    expect(url).toContain('return_to=' + encodeURIComponent(window.location.pathname));
  });
});
