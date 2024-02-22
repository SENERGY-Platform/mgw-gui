export interface HumanUserMeta {
    first_name: string;
    last_name: string;
}

export interface DeviceUserMeta {
    model: string;
    manufacturer: string;
}

export interface User {
    id: string;
    created: string;
    updated: string;
    type: string;
    username: string;
    meta: HumanUserMeta | DeviceUserMeta;
}

export interface UsersResponse {
    [userID: string]: User
}

export interface UserRequest {
    username: string;
    meta: HumanUserMeta;
    secret: string;
    type: string;
}