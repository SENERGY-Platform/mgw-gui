export interface HostResource {
    id: string;
    name: string;
    tags: string[] | null;
    path: string;
    type: string;
}