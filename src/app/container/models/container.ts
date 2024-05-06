export interface ContainerInfo {
    image_id: string;
    state: string;
}
export interface ContainerBase {
    id: string;
    alias: string;
    info: null | ContainerInfo;
}

export interface Container extends ContainerBase {
    order: number;
    srv_ref: string;
}

export interface SubDeploymentContainer extends ContainerBase {
    
}