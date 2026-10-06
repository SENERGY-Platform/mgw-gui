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

// Where to send the user back to after logging in. The login page hands this
// to location.href, so it has to be the browser's own path including the base
// href the gateway serves the application under - the router's url, which
// starts below that base, would drop the prefix in production.
export function currentPath(): string {
  return window.location.pathname + window.location.search;
}

// One leading slash and no second one: a browser reads '//host' and '/\host'
// as a URL on another origin. Control characters are refused too: URL parsing
// drops tabs and newlines, so '/\t/host' becomes '//host'.
const RETURN_PATH = /^\/(?![/\\])/;

function hasControlCharacter(v: string): boolean {
  for (let i = 0; i < v.length; i++) {
    const c = v.charCodeAt(i);
    if (c < 0x20 || c === 0x7f) {
      return true;
    }
  }
  return false;
}

// The decoded path when it stays on this origin, otherwise null.
export function safeReturnPath(v: string | null | undefined): string | null {
  if (typeof v !== 'string') {
    return null;
  }
  try {
    const decoded = decodeURIComponent(v);
    return RETURN_PATH.test(decoded) && !hasControlCharacter(decoded) ? decoded : null;
  } catch {
    return null;
  }
}
