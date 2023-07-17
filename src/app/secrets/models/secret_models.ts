export interface Secret {
    id: string;
    type: string;
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
    APIKey = 'api-key'
}

export interface SecretRequest {
    id: string;
    item?: string;
    ref?: string;
}