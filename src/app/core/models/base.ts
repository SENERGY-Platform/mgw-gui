export interface BaseRequest {
  host_resources: Record<string, string> | null;
  configs: Record<string, any> | null;
  secrets: Record<string, string> | null;
  module_id: string;
}

export type Labels = Record<string, string>;

export type Configs = Record<string, string>;

export type Volumes = Record<string, string>;
