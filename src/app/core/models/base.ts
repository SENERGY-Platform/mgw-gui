export interface BaseRequest {
  host_resources: Record<string, string> | null;
  configs: Record<string, any> | null;
  secrets: Record<string, string> | null;
  module_id: string;
}

export interface Labels {
  [label_key: string]: string;
}

export interface Configs {
  [config_key: string]: string;
}

export interface Volumes {
  [volume_key: string]: string;
}
