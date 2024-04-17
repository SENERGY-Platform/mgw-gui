import { Container } from "src/app/container/models/container";
import { BaseRequest } from "src/app/core/models/base";

// Create a new Deployment
export interface DeploymentRequest extends BaseRequest {
    name: string;
    dependencies: Record<string, DeploymentRequest>;
}

// Deployment Details
export interface DeploymentConfigInfo {
    value: any;
    data_type: any;
    is_slice: boolean;
}

interface DeploymentVariantInfo {
    as_mount: boolean;
    as_env: boolean;
    item?: string;
}

interface DeploymentSecretInfo {
    id: string;
    variants: DeploymentVariantInfo[];
}

interface Module {
    id: string;
    version: string;
}
export interface Deployment {
    id: string;
    module: Module; 
    name: string;
    enabled: boolean;
    created: Date;
    updated: Date;
    host_resources: Record<string, string>;
    configs: Record<string, DeploymentConfigInfo>;
    secrets: Record<string, DeploymentSecretInfo>;
    required_dep: string[];
    dep_requiring: string[];
    containers: null | Record<string, Container>;
    state: null | string;
}

export interface DeploymentResponse {
    [deployment_id: string]: Deployment;
}

// Deployment Template -> Info for loading the form
export interface HostResourcesTemplate {
    name: string;
    description: string;
    group?: string;
    tags: string[];
    required: boolean;
    value?: any;
}

export interface SecretTemplate {
    name: string;
    description: string;
    group?: string;
    tags: string[];
    required: boolean;
    type: string;
    value?: any;
}

export interface ConfigTemplate {
    name: string;
    description: string;
    required: boolean;
    group?: string;
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
    input_groups: InputGroups;
}

export interface InputGroup {
    name: string;
    description: string;
    group?: string;
}

export interface InputGroups {
    [id: string]: InputGroup;
}

export interface DeploymentTemplate extends DeploymentTemplateBase {
}

export interface DeploymentUpdateTemplate extends DeploymentTemplateBase {
    name: string;
}

export interface ModuleUpdateTemplate extends DeploymentTemplate {}

