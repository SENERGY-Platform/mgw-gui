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
    added: Date;
    indirect: boolean;
    updated: Date;
}

export interface AddModule {
    id?: string;
    version?: string;
}