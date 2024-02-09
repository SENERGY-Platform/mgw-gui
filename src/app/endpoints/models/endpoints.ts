export interface CoreEndpoint {
    id: string;
    parent_id: string;
    type: Number;
    host: string;
    int_path: string;
    ext_path: string;
    labels: Record<string, string>;
    ref: string;
    port: number;
}

export interface CoreEndpointsResponse {
    [endpointID: string]: CoreEndpoint
}

export interface CoreEndpointAliasReq {
    parent_id: string;
    path: string; 
}