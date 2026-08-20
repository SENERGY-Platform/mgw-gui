export interface HumanUserMeta {
  first_name: string;
  last_name: string;
}

export interface DeviceUserMeta {
  model: string;
  manufacturer: string;
}

export interface BaseUser {
  id: string;
  created: string;
  updated: string;
  type: string;
  username: string;
}

export interface HumanUser extends BaseUser {
  meta: HumanUserMeta;
}

export interface DeviceUser extends BaseUser {
  meta: DeviceUserMeta;
}

export type HumanUsersResponse = Record<string, HumanUser>;

export type DeviceUsersResponse = Record<string, DeviceUser>;

export interface UserRequest {
  username: string;
  meta: HumanUserMeta;
  secret: string;
  type: string;
}
