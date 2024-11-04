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
  PrivateKey = 'private-key'
}


export var SecretTypesDisplayNames: { [key in SecretTypes]: string } = {
  [SecretTypes.Certificate]: "Certificate",
  [SecretTypes.BasicAuth]: "Credentials",
  [SecretTypes.APIKey]: "API Key",
  [SecretTypes.ClientID]: "Client ID",
  [SecretTypes.PrivateKey]: "Private Key",

}

export interface SecretRequest {
  id: string;
  item?: string;
  ref?: string;
}
