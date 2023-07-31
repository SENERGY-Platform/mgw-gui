export interface Container {
    id: string;
    ref: string;
    order: number;
}

export interface Instance {
    id: string;
    created: Date;
    containers: Container[]
}

/*
export interface Instances {
    [depoyment_id: string]: Instance
}*/

export interface ContainerHealth {
    id: string;
    ref: string;
    state: string;
}

export interface ContainerWithHealth extends Container {
    state: string;
}