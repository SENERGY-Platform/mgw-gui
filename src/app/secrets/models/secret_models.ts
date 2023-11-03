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

export type SecretTypeDisplayDictionary<T extends string | symbol | number, U> = {
    [K in T]: U;
};
export var SecretTypesDisplayNames: SecretTypeDisplayDictionary<SecretTypes, string> = {
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