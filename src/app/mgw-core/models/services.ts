export interface CoreService {
    name: string;
    container: CoreServiceContainer[];
}

interface CoreServiceContainer {
    id: string;
    name: string;
    state: string;
}

export interface CoreServicesResponse {
    [serviceID: string]: CoreService
}