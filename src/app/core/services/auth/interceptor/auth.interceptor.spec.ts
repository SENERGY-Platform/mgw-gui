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
import {HttpContext, HttpErrorResponse, HttpHandler, HttpRequest} from '@angular/common/http';
import {Router} from '@angular/router';
import {firstValueFrom, throwError} from 'rxjs';
import {AuthCheckInterceptor, SKIP_AUTH_REDIRECT} from './auth.interceptor';

// Captures what the interceptor asked the router to do instead of navigating.
function setup(currentUrl = '/modules'): {interceptor: AuthCheckInterceptor; navigations: unknown[][]} {
  const navigations: unknown[][] = [];
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      AuthCheckInterceptor,
      {
        provide: Router,
        useValue: {
          url: currentUrl,
          navigate: (commands: unknown[], extras: unknown) => {
            navigations.push([commands, extras]);
            return Promise.resolve(true);
          },
        },
      },
    ],
  });
  return {interceptor: TestBed.inject(AuthCheckInterceptor), navigations: navigations};
}

function failingHandler(status: number): HttpHandler {
  return {handle: () => throwError(() => new HttpErrorResponse({status: status}))};
}

async function expectRejection(promise: Promise<unknown>): Promise<void> {
  await promise.then(
    () => {
      throw new Error('expected the error to reach the caller');
    },
    () => undefined,
  );
}

describe('AuthCheckInterceptor', () => {
  it('sends the user to the login page on a 401 and passes the error on', async () => {
    const {interceptor, navigations} = setup();

    await expectRejection(
      firstValueFrom(interceptor.intercept(new HttpRequest('GET', '/core/api/x'), failingHandler(401))),
    );

    expect(navigations.length).toBe(1);
    expect(navigations[0][0]).toEqual(['/login']);
    expect(JSON.stringify(navigations[0][1])).toContain('return_to');
  });

  it('leaves any other failure alone', async () => {
    const {interceptor, navigations} = setup();

    await expectRejection(
      firstValueFrom(interceptor.intercept(new HttpRequest('GET', '/core/api/x'), failingHandler(503))),
    );

    expect(navigations.length).toBe(0);
  });

  // The guard's own probe expects a 401 as its answer; redirecting on it would
  // pre-empt the decision the guard is about to make.
  it('does not redirect for a request that opted out', async () => {
    const {interceptor, navigations} = setup();
    const request = new HttpRequest('GET', '/core/api/x', {
      context: new HttpContext().set(SKIP_AUTH_REDIRECT, true),
    });

    await expectRejection(firstValueFrom(interceptor.intercept(request, failingHandler(401))));

    expect(navigations.length).toBe(0);
  });

  // A page loads its data in parallel, so every one of those requests fails
  // in the same turn once the session is gone. They must not each ask for the
  // same navigation - hence dispatching both before awaiting either.
  it('asks for the login page once when several requests fail together', async () => {
    const {interceptor, navigations} = setup();

    const first = firstValueFrom(interceptor.intercept(new HttpRequest('GET', '/core/api/a'), failingHandler(401)));
    const second = firstValueFrom(interceptor.intercept(new HttpRequest('GET', '/core/api/b'), failingHandler(401)));
    await expectRejection(first);
    await expectRejection(second);

    expect(navigations.length).toBe(1);
  });

  // A request dispatched before the redirect can fail after it. Navigating
  // again would overwrite the return_to captured the first time with the
  // login page, stranding the user on the login form after signing in.
  it('stays put when the login page is already showing', async () => {
    const {interceptor, navigations} = setup('/login?return_to=%2Fmodules');

    await expectRejection(
      firstValueFrom(interceptor.intercept(new HttpRequest('GET', '/core/api/x'), failingHandler(401))),
    );

    expect(navigations.length).toBe(0);
  });
});
