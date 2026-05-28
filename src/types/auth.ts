// Logout
export type LogoutRequest = {
  refresh_token: string;
}

export type LogoutResponse = {
  success: boolean;
  status_code: number;
  data: null;
  error: {
    code: string;
    detail: string;
  }
}

// Refresh
export type RefreshRequest = {
  refresh_token: string;
}

export type RefreshResponse = {
  success: boolean;
  status_code: number;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
  };
  error: {
    code: string;
    detail: string;
  };
}

// Signup
export type SignupRequest = {
  name: string;
  email: string;
  password: string;
}

export type SignupResponse = {
  success: boolean;
  status_code: number;
  data: null;
  error: null;
}

// Login
export type LoginRequest = {
  email: string;
  password: string;
}

export type LoginResponse = {
  success: boolean;
  status_code: number;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
  };
  error: { code: string; detail: string } | null;
}