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

import {environment} from 'src/environments/environment';

// Scope of an API, matching the directory the swagger documents live in.
export type ApiScope = 'public' | 'module' | 'internal';

export interface ApiEntry {
  scope: ApiScope;
  // path segment under /core/swagger/{scope}/ and, for public APIs, under
  // /core/api/ as well
  id: string;
  name: string;
  requiresAuth: boolean;
  /**
   * Base URL a request is sent to, relative to the UI's origin. Only public
   * APIs have one: module and core APIs are served on the gateway-internal
   * network under http://core-api/... and are not reachable from a browser.
   */
  requestBase?: string;
  /** Absolute URL shown to the user, e.g. to paste into curl. */
  displayUrl: string;
  docUrl: string;
  /**
   * True for entries that only point into another service's documentation and
   * therefore have no swagger document of their own to drive a playground.
   */
  docOnly?: boolean;
}

const publicRequestBase = environment.coreApiUrl;
const publicDisplayBase = location.protocol + '//' + location.host + environment.coreApiUrl;
// module and core APIs resolve inside the gateway network, not from a browser
const gatewayBase = 'http://core-api';
const docBase = environment.coreSwaggerUrl;

function publicApi(id: string, name: string, options: { requiresAuth?: boolean, path?: string, doc?: string } = {}): ApiEntry {
  const path = options.path ?? '/' + id;
  return {
    scope: 'public',
    id: id,
    name: name,
    requiresAuth: options.requiresAuth ?? true,
    requestBase: publicRequestBase + path,
    displayUrl: publicDisplayBase + path,
    docUrl: options.doc ?? docBase + '/public/' + id + '/index.html',
  };
}

function internalApi(scope: 'module' | 'internal', id: string, name: string): ApiEntry {
  return {
    scope: scope,
    id: id,
    name: name,
    requiresAuth: false,
    displayUrl: gatewayBase + '/' + id,
    docUrl: docBase + '/' + scope + '/' + id + '/index.html',
  };
}

export const PUBLIC_APIS: ApiEntry[] = [
  publicApi('auth-service', 'auth-service'),
  publicApi('ce-wrapper', 'ce-wrapper'),
  publicApi('core-manager', 'core-manager'),
  publicApi('host-manager', 'host-manager'),
  publicApi('module-manager', 'module-manager'),
  publicApi('secret-manager', 'secret-manager'),
  {
    // served next to the API rather than under it, and deliberately open
    scope: 'public',
    id: 'deployment-discovery',
    name: 'deployment-discovery',
    requiresAuth: false,
    // publicly reachable, just not under the /core/api prefix
    requestBase: '/core/discovery',
    displayUrl: location.protocol + '//' + location.host + '/core/discovery',
    docUrl: docBase + '/public/module-manager/index.html#/Deployment%20Advertisements/get_discovery',
    docOnly: true,
  },
];

export const MODULE_APIS: ApiEntry[] = [
  internalApi('module', 'host-manager', 'host-manager'),
  internalApi('module', 'module-manager', 'module-manager'),
];

export const INTERNAL_APIS: ApiEntry[] = [
  internalApi('internal', 'ce-wrapper', 'ce-wrapper'),
  internalApi('internal', 'c-manager', 'core-manager'),
  internalApi('internal', 'h-manager', 'host-manager'),
];

export const ALL_APIS: ApiEntry[] = [...PUBLIC_APIS, ...MODULE_APIS, ...INTERNAL_APIS];

export function findApi(scope: string, id: string): ApiEntry | undefined {
  return ALL_APIS.find(api => api.scope === scope && api.id === id);
}

/** The document the playground reads; index.html sits next to it. */
export function specUrl(api: ApiEntry): string {
  return docBase + '/' + api.scope + '/' + api.id + '/doc.json';
}

/** Only public APIs can be called from the browser. */
export function isExecutable(api: ApiEntry): boolean {
  return !!api.requestBase;
}

/** Entries with a swagger document of their own can open the playground. */
export function hasPlayground(api: ApiEntry): boolean {
  return !api.docOnly;
}
