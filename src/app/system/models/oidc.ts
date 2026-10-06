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

// The core manager's single sign-on setting, rendered into the identity
// service's configuration.
export interface OidcSettings {
  enabled: boolean;
  issuer_url: string;
  client_id: string;
  // Empty when unset; must contain 'openid' when enabled.
  scope: string[] | null;
  external_url: string;
  // The secret itself is never returned.
  has_secret: boolean;
  // The identity service's id for the stored issuer, part of the callback URL.
  // Empty while nothing is stored; absent from older core managers.
  provider_id?: string;
}

export interface OidcSettingsRequest {
  enabled: boolean;
  issuer_url: string;
  client_id: string;
  // Left out to keep the stored secret.
  client_secret?: string;
  scope: string[];
  external_url: string;
}
