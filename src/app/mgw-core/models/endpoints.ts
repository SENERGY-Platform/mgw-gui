export interface CoreEndpoint {
    id: string;
    parent_id: string;
    type: Number;
    host: string;
    int_path: string;
    ext_path: string;
    labels: Record<string, string>;
}

export interface CoreEndpointsResponse {
    [endpointID: string]: CoreEndpoint
}