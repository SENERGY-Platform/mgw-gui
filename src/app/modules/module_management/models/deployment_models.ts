export interface DeploymentRequest {
    name: string;
    host_resources: any;
    configs: any;
    secrets: any;
}
export interface Deployment {
    id: string;
    module_id: string; 
    name: string;
    stopped: boolean;
    indirect: boolean;
    created: Date;
    updated: Date;
    host_resources: any;
    configs: any;
    secrets: any;
    required_dep: string[];
    dep_requiring: string[];
}

export interface DeploymentTemplate {

}