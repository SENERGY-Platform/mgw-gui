export interface ContainerInfo {
    image_id: string;
    state: string;
}
export interface Container {
    id: string;
    alias: string;
    order: number;
    info: null | ContainerInfo;
    srv_ref: string;
}
