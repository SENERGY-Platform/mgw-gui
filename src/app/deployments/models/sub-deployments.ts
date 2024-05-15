import { ContainerInfo } from "src/app/container/models/container";
import { Configs, Labels, Volumes } from "src/app/core/models/base";

export interface AuxDepRunConfig {
    command: string;
    pseudo_tty: boolean;
}

export interface AuxDeploymentBase {
    id: string;
    dep_id: string; 
    name: string;
    enabled: boolean;
    created: Date;
    updated: Date;
    image: string;
    labels: Labels;
    configs: Configs;
    volumes: Volumes;
    ref: string;
    run_config: AuxDepRunConfig;
}

export interface AuxDepContainer {
    id: string;
    alias: string;
    info: null | ContainerInfo;
}

export interface AuxDeployment extends AuxDeploymentBase {
    container: AuxDepContainer;
}

export interface AuxDeploymentResponse {
    [depID: string]: AuxDeployment;
}