export interface LoginRequest {
  identifier: string;
  method: string;
  password: string;
  csrf_token: string;
}

interface RegisterTraits {
  username: string;
  meta: HumanMeta;
}

interface HumanMeta {
  first_name?: string;
  last_name?: string;
}

export interface RegisterRequest {
  method: string;
  password: string;
  csrf_token: string;
  traits: RegisterTraits;
}

export interface InitLogoutResponse {
  logout_token: string;
  logout_url: string;
}
