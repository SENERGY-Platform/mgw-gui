export interface CoreEndpoint {
  id: string;
  parent_id: string;
  type: number;
  host: string;
  int_path: string;
  ext_path: string;
  labels: Record<string, string>;
  ref: string;
  port: number;
}

export type CoreEndpointsResponse = Record<string, CoreEndpoint>;

export interface CoreEndpointAliasReq {
  parent_id: string;
  path: string;
}
