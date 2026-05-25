export type UserStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'user';
export interface UserData {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

//GetMe
export interface GetMe {
  name: string;
  email: string;
  role: UserRole;
}
export interface GetMeResponse {
  success: boolean;
  status_code: number;
  data: GetMe;
  error: { 
    code: string; 
    detail: string; 
  }
}

//AdminUsers
export interface AdminUserItem {
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}
export interface AdminUsersResponse {
  success: boolean;
  status_code: number;
  data: {
    admins: AdminUserItem[];
    users: {
      pending: AdminUserItem[];
      approved: AdminUserItem[];
    };
  };
  error: null;
}

//AdminUserApprove
export interface AdminUserApproveResponse {
  success: boolean;
  status_code: number;
  data: UserData;
  error: { code: string; detail: string } | null;
}

//AdminUserReject
export interface AdminUserRejectResponse {
  success: boolean;
  status_code: number;
  data: UserData;
  error: { code: string; detail: string } | null;
}

//AdminUserDelete
export interface AdminUserDeleteResponse {
  success: boolean;
  status_code: number;
  data: null;
  error: null;
}

//AdminUserInquiry
export interface AdminUserInquiryResponse {
  success: boolean;
  status_code: number;
  data: UserData;
  error: { code: string; detail: string } | null;
}
