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
