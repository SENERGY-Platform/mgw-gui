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

export interface Secret {
  id: string;
  type: SecretTypes;
  name: string;
  value: string;
}

export interface CreateSecret {
  type: string;
  name: string;
  value: string;
}

export interface SecretType {
  name: string;
  id: string;
}

export enum SecretTypes {
  Certificate = 'certificate',
  BasicAuth = 'basic-auth',
  APIKey = 'api-key',
  ClientID = 'client-id',
  PrivateKey = 'private-key',
}

// translation keys, not display text - the template applies the `transloco`
// pipe where it renders each entry
export var SecretTypesDisplayNames: Record<SecretTypes, string> = {
  [SecretTypes.Certificate]: 'secrets.types.certificate',
  [SecretTypes.BasicAuth]: 'secrets.types.basicAuth',
  [SecretTypes.APIKey]: 'secrets.types.apiKey',
  [SecretTypes.ClientID]: 'secrets.types.clientId',
  [SecretTypes.PrivateKey]: 'secrets.types.privateKey',
};

export interface SecretRequest {
  id: string;
  item?: string;
  ref?: string;
}
