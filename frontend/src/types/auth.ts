export interface ApiUser {
  id: string;
  email: string;
  is_email_verified?: boolean;
  [key: string]: unknown;
}

export interface LoginResponse {
  access_token: string;
  user: ApiUser;
}
