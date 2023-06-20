export interface Module {
    id: string;
    name: string;
    description: string;
    tags: string[];
    licence: string;
    author: string;
    version: string;
    type: string;
    deployment_type: string; 
}

export interface AddModule {
    id?: string;
    version?: string;
}