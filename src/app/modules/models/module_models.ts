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

export interface ModuleUpdate {
    pending: boolean;
    pending_version: Record<string, string>;
    checked: Date;
    versions: string[];
}

export interface ModuleUpdates {
    [module_id: string]: ModuleUpdate;
}

export interface ModuleUpdatePrepare {
    version: string
}

