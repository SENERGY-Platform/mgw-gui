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

// fakeAsync()/tick() (from '@angular/core/testing') only work while the test
// body they wrap runs inside a Zone carrying a ProxyZoneSpec - that is what
// they use to schedule and flush pending timers. zone.js/testing installs
// that wrapping itself, but only around a test framework it recognises by
// probing for a global (Jasmine, Jest, Mocha) at load time; it has never
// heard of Vitest, and by the time this file runs polyfills - including
// zone.js/testing - have already loaded, so patching that probe would be too
// late to help anyway. Without this, every fakeAsync test fails with
// "Expected to be running in 'ProxyZone', but it was not found."
//
// This wraps the handful of Vitest globals this suite actually calls with a
// callback - it/test and beforeEach/afterEach - the same way zone.js's own
// Jasmine/Jest patches wrap theirs. Variants nobody here uses (it.each,
// it.only, describe.skip, ...) are left pointing at the unwrapped original,
// so a fakeAsync test reached only through one of those would still fail
// this same way.
//
// zone.js itself is already loaded by the time this runs (it is a polyfill,
// evaluated before any setup file) - this import is only here so TypeScript
// picks up its ambient `Zone` global, which nothing else in this program
// otherwise references by name.
import 'zone.js';

type ZoneSpecCtor = new () => ZoneSpec;
const ProxyZoneSpec = (Zone as unknown as {ProxyZoneSpec: ZoneSpecCtor}).ProxyZoneSpec;
const proxyZone = Zone.current.fork(new ProxyZoneSpec());

type TestHook = (this: unknown, ...args: unknown[]) => unknown;

function runInProxyZone(fn: TestHook): TestHook {
  return function (this: unknown, ...args: unknown[]) {
    return proxyZone.run(fn, this, args);
  };
}

function patchHook(name: 'it' | 'test' | 'beforeEach' | 'afterEach'): void {
  const original = (globalThis as Record<string, unknown>)[name] as TestHook & Record<string, unknown>;
  const patched = function (this: unknown, ...args: unknown[]) {
    const callbackIndex = args.findIndex((arg) => typeof arg === 'function');
    if (callbackIndex !== -1) {
      args[callbackIndex] = runInProxyZone(args[callbackIndex] as TestHook);
    }
    return original.apply(this, args);
  };
  // Carries over .only/.skip/.each and friends unwrapped, so calling them
  // still works - see the caveat above.
  Object.assign(patched, original);
  (globalThis as Record<string, unknown>)[name] = patched;
}

(['it', 'test', 'beforeEach', 'afterEach'] as const).forEach(patchHook);
