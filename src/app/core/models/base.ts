export interface BaseRequest {
    host_resources: Record<string, string> | null;
    configs: Record<string, any> | null;
    secrets: Record<string, string> | null;
    module_id: string;
}