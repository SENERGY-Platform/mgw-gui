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

import {HttpErrorResponse} from '@angular/common/http';

export interface KratosText {
  id: number;
  text: string;
  type: string;
  context?: {reason?: string};
}

// Registration is disabled, so an identity provider account that is not linked
// to an identity ends in this generic error; its reason is the only marker.
const REGISTRATION_DISABLED_REASON = 'Registration is not allowed because it was disabled.';

export function isUnlinkedAccount(message: KratosText): boolean {
  return message.context?.reason === REGISTRATION_DISABLED_REASON;
}

export interface KratosNode {
  type: string;
  group: string;
  attributes: {name?: string; value?: unknown};
  messages?: KratosText[];
}

export interface KratosFlow {
  id: string;
  // RFC 3339, with up to nanosecond precision.
  expires_at?: string;
  ui: {nodes: KratosNode[]; messages?: KratosText[]};
}

// Flow ids are UUIDs. Anything else in a ?flow= parameter is not ours and is
// not put into a request URL.
const FLOW_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isFlowId(v: string | null | undefined): v is string {
  return typeof v === 'string' && FLOW_ID.test(v);
}

export function isKratosFlow(v: unknown): v is KratosFlow {
  const flow = v as KratosFlow | null;
  return (
    typeof flow === 'object' &&
    flow !== null &&
    typeof flow.id === 'string' &&
    typeof flow.ui === 'object' &&
    flow.ui !== null &&
    Array.isArray(flow.ui.nodes)
  );
}

// Looked up by name: the order of the nodes depends on which methods are
// enabled, so the token is not reliably the first one.
export function csrfToken(flow: KratosFlow): string {
  const node = flow.ui.nodes.find((n) => n.attributes?.name === 'csrf_token');
  return typeof node?.attributes.value === 'string' ? node.attributes.value : '';
}

// The gateway's provider ids start with 'sso' (the core manager derives them
// from the issuer); any other oidc node is not ours.
const GATEWAY_PROVIDER = /^sso/;

// The gateway's provider id as offered by the flow: 'provider' in a login
// flow, 'link' or 'unlink' in a settings flow. Null means single sign-on is
// not offered there.
export function oidcProvider(flow: KratosFlow | null, name: 'provider' | 'link' | 'unlink'): string | null {
  for (const n of flow?.ui.nodes ?? []) {
    const value = n.attributes?.value;
    if (
      n.group === 'oidc' &&
      n.attributes?.name === name &&
      typeof value === 'string' &&
      GATEWAY_PROVIDER.test(value)
    ) {
      return value;
    }
  }
  return null;
}

// Submitting in the last moments of a flow's life risks a refusal in flight.
export const FLOW_EXPIRY_MARGIN_MS = 30_000;

// RFC 3339 with the fraction cut to milliseconds: Kratos sends nanoseconds,
// which Date.parse is not required to accept.
const RFC3339 = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/i;

export function flowExpiry(flow: KratosFlow): number {
  const m = typeof flow.expires_at === 'string' ? RFC3339.exec(flow.expires_at) : null;
  if (!m) {
    return NaN;
  }
  const millis = m[2] === undefined ? '' : '.' + m[2].slice(0, 3).padEnd(3, '0');
  return Date.parse(m[1] + millis + m[3].toUpperCase());
}

// A flow without a readable expiry counts as expired, so a new one is fetched
// rather than one submitted that may be dead.
export function isFlowUsable(flow: KratosFlow, now: number): boolean {
  const expiry = flowExpiry(flow);
  return Number.isFinite(expiry) && now < expiry - FLOW_EXPIRY_MARGIN_MS;
}

export function flowMessages(flow: KratosFlow | null): KratosText[] {
  if (!flow) {
    return [];
  }
  const nodeMessages = flow.ui.nodes.flatMap((n) => n.messages ?? []);
  return [...(flow.ui.messages ?? []), ...nodeMessages].filter((m) => typeof m?.text === 'string');
}

// The updated flow Kratos sends along with a 400, so its messages can be shown.
export function flowFromError(err: unknown): KratosFlow | null {
  return err instanceof HttpErrorResponse && isKratosFlow(err.error) ? err.error : null;
}

export function needsPrivilegedSession(err: unknown): boolean {
  return err instanceof HttpErrorResponse && err.status === 403 && err.error?.error?.id === 'session_refresh_required';
}

export type BrowserRedirect =
  | {kind: 'follow'; url: string}
  // The identity provider would call back to another origin, where the CSRF
  // cookie set on this one does not exist; the flow would fail there.
  | {kind: 'other-origin'; origin: string}
  | {kind: 'invalid'};

function httpUrl(v: unknown): URL | null {
  if (typeof v !== 'string') {
    return null;
  }
  try {
    const url = new URL(v);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

// Kratos answers an OIDC submit from a script with 422 and the identity
// provider's authorization URL. Returns null for any other answer.
export function browserRedirect(err: unknown, currentOrigin: string): BrowserRedirect | null {
  if (!(err instanceof HttpErrorResponse) || err.status !== 422) {
    return null;
  }
  const target = err.error?.redirect_browser_to;
  if (target === undefined) {
    return null;
  }
  // Only http(s): the value ends up in location.href, where a javascript:
  // URL would run.
  const url = httpUrl(target);
  if (!url) {
    return {kind: 'invalid'};
  }
  const redirectUri = url.searchParams.get('redirect_uri');
  if (redirectUri !== null) {
    const callback = httpUrl(redirectUri);
    if (!callback) {
      return {kind: 'invalid'};
    }
    if (callback.origin !== currentOrigin) {
      return {kind: 'other-origin', origin: callback.origin};
    }
  }
  return {kind: 'follow', url: url.href};
}

// The page the user is on, under another origin. The flow parameter is
// dropped: that flow belongs to this origin's cookies. Path and query are set
// as parts rather than parsed as a relative URL, so a path starting with '//'
// cannot change the host.
export function samePageUnder(origin: string, location: Pick<Location, 'pathname' | 'search'>): string {
  const url = new URL(origin);
  url.pathname = location.pathname;
  url.search = location.search;
  url.searchParams.delete('flow');
  return url.href;
}
