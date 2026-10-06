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
import {
  browserRedirect,
  csrfToken,
  flowFromError,
  flowExpiry,
  flowMessages,
  FLOW_EXPIRY_MARGIN_MS,
  isFlowId,
  isFlowUsable,
  KratosFlow,
  needsPrivilegedSession,
  oidcProvider,
  samePageUnder,
} from './kratos-flow';

const ORIGIN = 'https://gateway.example.org';

function flow(nodes: KratosFlow['ui']['nodes'], messages?: KratosFlow['ui']['messages']): KratosFlow {
  return {id: '7f3e2a10-0c1d-4c3b-9a55-2d6f2f4b9e01', ui: {nodes, messages}};
}

function redirectError(target: unknown, status = 422): HttpErrorResponse {
  return new HttpErrorResponse({
    status,
    error: {error: {id: 'browser_location_change_required'}, redirect_browser_to: target},
  });
}

describe('Kratos flow helpers', () => {
  describe('csrfToken', () => {
    it('finds the token by name wherever it sits among the nodes', () => {
      const f = flow([
        {type: 'input', group: 'oidc', attributes: {name: 'provider', value: 'sso'}},
        {type: 'input', group: 'default', attributes: {name: 'identifier', value: ''}},
        {type: 'input', group: 'default', attributes: {name: 'csrf_token', value: 'the-token'}},
      ]);

      expect(csrfToken(f)).toBe('the-token');
    });

    it('is empty when the flow carries none', () => {
      expect(csrfToken(flow([{type: 'input', group: 'oidc', attributes: {name: 'provider', value: 'sso'}}]))).toBe('');
    });
  });

  describe('oidcProvider', () => {
    const oidc = (name: string, value: unknown, group = 'oidc') => ({type: 'input', group, attributes: {name, value}});

    it('reads the provider id from the node, whatever follows the sso prefix', () => {
      expect(oidcProvider(flow([oidc('provider', 'sso-0123456789ab')]), 'provider')).toBe('sso-0123456789ab');
      expect(oidcProvider(flow([oidc('link', 'sso-0123456789ab')]), 'link')).toBe('sso-0123456789ab');
      expect(oidcProvider(flow([oidc('unlink', 'sso')]), 'unlink')).toBe('sso');
    });

    it('takes the first sso node when there are several', () => {
      const f = flow([
        oidc('provider', 'github'),
        oidc('provider', 'sso-aaaaaaaaaaaa'),
        oidc('provider', 'sso-bbbbbbbbbbbb'),
      ]);

      expect(oidcProvider(f, 'provider')).toBe('sso-aaaaaaaaaaaa');
    });

    it('ignores other providers, groups, names and values that are not text', () => {
      expect(oidcProvider(flow([oidc('provider', 'other')]), 'provider')).toBeNull();
      expect(oidcProvider(flow([oidc('provider', 'xsso')]), 'provider')).toBeNull();
      expect(oidcProvider(flow([oidc('provider', 'sso-0123456789ab', 'password')]), 'provider')).toBeNull();
      expect(oidcProvider(flow([oidc('link', 'sso-0123456789ab')]), 'unlink')).toBeNull();
      expect(oidcProvider(flow([oidc('provider', 42)]), 'provider')).toBeNull();
      expect(oidcProvider(null, 'provider')).toBeNull();
    });
  });

  describe('flow expiry', () => {
    const expiring = (expires_at?: string): KratosFlow => ({...flow([]), expires_at});
    const at = Date.parse('2026-10-06T12:00:00.123Z');

    it('reads RFC 3339 with nanoseconds, offsets and no fraction', () => {
      expect(flowExpiry(expiring('2026-10-06T12:00:00.123456789Z'))).toBe(at);
      expect(flowExpiry(expiring('2026-10-06T14:00:00.1234+02:00'))).toBe(at);
      expect(flowExpiry(expiring('2026-10-06T12:00:00.1Z'))).toBe(Date.parse('2026-10-06T12:00:00.100Z'));
      expect(flowExpiry(expiring('2026-10-06T12:00:00Z'))).toBe(Date.parse('2026-10-06T12:00:00.000Z'));
    });

    it('is usable only until the margin before it expires', () => {
      const f = expiring('2026-10-06T12:00:00.123Z');

      expect(isFlowUsable(f, at - FLOW_EXPIRY_MARGIN_MS - 1)).toBe(true);
      expect(isFlowUsable(f, at - FLOW_EXPIRY_MARGIN_MS)).toBe(false);
      expect(isFlowUsable(f, at + 1)).toBe(false);
    });

    it('treats a missing or unreadable expiry as expired', () => {
      expect(isFlowUsable(expiring(), 0)).toBe(false);
      expect(isFlowUsable(expiring('tomorrow'), 0)).toBe(false);
      expect(isFlowUsable(expiring('2026-10-06 12:00:00'), 0)).toBe(false);
    });
  });

  describe('browserRedirect', () => {
    it('follows a provider address whose callback is on this origin', () => {
      const target =
        'https://idp.example.com/auth?client_id=gw&redirect_uri=' +
        encodeURIComponent(ORIGIN + '/core/auth/self-service/methods/oidc/callback/sso');

      expect(browserRedirect(redirectError(target), ORIGIN)).toEqual({kind: 'follow', url: target});
    });

    it('follows a target without a redirect_uri', () => {
      expect(browserRedirect(redirectError('https://idp.example.com/auth'), ORIGIN)).toEqual({
        kind: 'follow',
        url: 'https://idp.example.com/auth',
      });
    });

    it('does not follow when the callback is on another origin', () => {
      const target =
        'https://idp.example.com/auth?redirect_uri=' +
        encodeURIComponent('https://gw.example.net/core/auth/self-service/methods/oidc/callback/sso');

      expect(browserRedirect(redirectError(target), ORIGIN)).toEqual({
        kind: 'other-origin',
        origin: 'https://gw.example.net',
      });
    });

    it('compares origins after normalisation, so case and default ports do not count', () => {
      const target =
        'https://idp.example.com/auth?redirect_uri=' + encodeURIComponent('https://GATEWAY.example.org:443/cb');

      expect(browserRedirect(redirectError(target), ORIGIN)?.kind).toBe('follow');
    });

    it('treats a port or scheme change as another origin', () => {
      const port =
        'https://idp.example.com/auth?redirect_uri=' + encodeURIComponent('https://gateway.example.org:8443/cb');
      const scheme = 'https://idp.example.com/auth?redirect_uri=' + encodeURIComponent('http://gateway.example.org/cb');

      expect(browserRedirect(redirectError(port), ORIGIN)?.kind).toBe('other-origin');
      expect(browserRedirect(redirectError(scheme), ORIGIN)?.kind).toBe('other-origin');
    });

    it('refuses targets that are not http(s)', () => {
      expect(browserRedirect(redirectError('javascript:alert(1)'), ORIGIN)).toEqual({kind: 'invalid'});
      expect(browserRedirect(redirectError('/relative'), ORIGIN)).toEqual({kind: 'invalid'});
      expect(browserRedirect(redirectError(42), ORIGIN)).toEqual({kind: 'invalid'});
      const badCallback = 'https://idp.example.com/auth?redirect_uri=' + encodeURIComponent('javascript:x');
      expect(browserRedirect(redirectError(badCallback), ORIGIN)).toEqual({kind: 'invalid'});
    });

    it('ignores any other answer', () => {
      expect(browserRedirect(redirectError('https://idp.example.com/auth', 400), ORIGIN)).toBeNull();
      expect(browserRedirect(new HttpErrorResponse({status: 422, error: {}}), ORIGIN)).toBeNull();
      expect(browserRedirect(new Error('x'), ORIGIN)).toBeNull();
    });
  });

  describe('samePageUnder', () => {
    it('keeps path and query but drops the flow', () => {
      expect(
        samePageUnder('https://gw.example.net', {
          pathname: '/core/web-ui/login',
          search: '?flow=abc&return_to=%2Fcore%2Fweb-ui%2Fmodules',
        }),
      ).toBe('https://gw.example.net/core/web-ui/login?return_to=%2Fcore%2Fweb-ui%2Fmodules');
    });

    it('cannot be steered to another host by the path', () => {
      const url = new URL(samePageUnder('https://gw.example.net', {pathname: '//evil.example.com/login', search: ''}));

      expect(url.host).toBe('gw.example.net');
    });
  });

  it('collects flow and node messages', () => {
    const f = flow(
      [
        {
          type: 'input',
          group: 'oidc',
          attributes: {name: 'provider', value: 'sso'},
          messages: [{id: 2, text: 'node', type: 'error'}],
        },
      ],
      [{id: 1, text: 'flow', type: 'error'}],
    );

    expect(flowMessages(f).map((m) => m.text)).toEqual(['flow', 'node']);
    expect(flowMessages(null)).toEqual([]);
  });

  it('reads the updated flow out of an error answer', () => {
    const f = flow([]);

    expect(flowFromError(new HttpErrorResponse({status: 400, error: f}))).toEqual(f);
    expect(flowFromError(new HttpErrorResponse({status: 400, error: 'text'}))).toBeNull();
  });

  it('recognises the request for a recent sign-in', () => {
    expect(
      needsPrivilegedSession(new HttpErrorResponse({status: 403, error: {error: {id: 'session_refresh_required'}}})),
    ).toBe(true);
    expect(
      needsPrivilegedSession(new HttpErrorResponse({status: 403, error: {error: {id: 'security_csrf_violation'}}})),
    ).toBe(false);
  });

  it('accepts only UUIDs as flow ids', () => {
    expect(isFlowId('7f3e2a10-0c1d-4c3b-9a55-2d6f2f4b9e01')).toBe(true);
    expect(isFlowId('7f3e2a10&return_to=x')).toBe(false);
    expect(isFlowId(null)).toBe(false);
  });
});
