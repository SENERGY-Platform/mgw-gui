import { BaseRequest } from "src/app/core/models/base";

export interface Module {
    id: string;
    name: string;
    description: string;
    tags: string[];
    license: string;
    author: string;
    version: string;
    type: string;
    deployment_type: string; 
    added: Date;
    updated: Date;
}

export interface AddModule {
    id?: string;
    version?: string;
}

export interface ModuleUpdate {
    pending: boolean;
    pending_versions: Record<string, string>;
    checked: Date;
    versions: string[];
}

export interface ModuleUpdates {
    [module_id: string]: ModuleUpdate;
}

export interface ModuleUpdatePrepare {
    version: string
}

export interface ModuleUpdateRequest extends BaseRequest {
    dependencies: Record<string, BaseRequest> | null;

}

