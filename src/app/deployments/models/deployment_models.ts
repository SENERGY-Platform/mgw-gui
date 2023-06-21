export interface DeploymentRequest {
    name: string;
    host_resources: Record<string, string>;
    configs: Record<string, any>;
    secrets: Record<string, string>;
    module_id: string;
}

export interface DeploymentConfig {
    value: any;
    data_type: any;
    is_slice: boolean;
}

export interface Deployment {
    id: string;
    module_id: string; 
    name: string;
    stopped: boolean;
    indirect: boolean;
    created: Date;
    updated: Date;
    host_resources: Record<string, string>;
    configs: Record<string, DeploymentConfig>;
    secrets: Record<string, string>;
    required_dep: string[];
    dep_requiring: string[];
}

export interface HostResourcesTemplate {
    name: string;
    description: string;
    group: string;
    tags: string[];
    required: boolean;
    value?: any;
}

export interface SecretTemplate {
    name: string;
    description: string;
    group: string;
    tags: string[];
    required: boolean;
    type: string;
    value?: any;
}

export interface ConfigTemplate {
    name: string;
    description: string;
    required: boolean;
    group: string;
    default: any;
    options: any,
    opt_ext: boolean;
    type: string;
    type_opt: any;
    data_type: string;
    is_list: boolean;
    value?: any;
}

// Deployment Template and Deployment Update Template
export interface DeploymentTemplateBase {
    host_resources: Record<string, HostResourcesTemplate>;
    secrets: Record<string, SecretTemplate>;
    configs: Record<string, ConfigTemplate>;
    dependencies?: Record<string, DeploymentTemplateBase>;
}

export interface DeploymentTemplate extends DeploymentTemplateBase {
}

export interface DeploymentUpdateTemplate extends DeploymentTemplateBase {
    name: string;
}
