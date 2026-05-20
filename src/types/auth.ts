// Logout
export type LogoutRequest = {
  refresh_token: string;
}

export type LogoutResponse = {
  code: number;
  message: string;
}

// Refresh
export type RefreshRequest = {
  refresh_token: string;
}

export type RefreshResponse = {
  access_token: string;
  token_type: string;
}

// Signup
export type SignupRequest = {
  email: string;
  password: string;
}

export type SignupResponse = {
  user_id: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

// Login
export type LoginRequest = {
  email: string;
  password: string;
}

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
}