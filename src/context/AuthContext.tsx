import { createContext, useState, useContext, type PropsWithChildren } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { LOCAL_STORAGE_KEY } from '../constants/key';
import { login as loginApi, logout as logoutApi } from '../api/services/auth';
import type { LoginRequest } from '../types/auth';
//import { useNavigate } from 'react-router';
import { href } from 'react-router';

interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  login: (signInData: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  accessToken: null,
  refreshToken: null,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const {
    getItem: getAccessTokenFromStorage,
    setItem: setAccessTokenInStorage,
    removeItem: removeAccessTokenFromStorage,
  } = useLocalStorage(LOCAL_STORAGE_KEY.ACCESS_TOKEN);

  const {
    getItem: getRefreshTokenFromStorage,
    setItem: setRefreshTokenInStorage,
    removeItem: removeRefreshTokenFromStorage,
  } = useLocalStorage(LOCAL_STORAGE_KEY.REFRESH_TOKEN);

  const [accessToken, setAccessToken] = useState<string | null>(
    getAccessTokenFromStorage(),
  );

  const [refreshToken, setRefreshToken] = useState<string | null>(
    getRefreshTokenFromStorage(),
  );

  const login = async (signInData: LoginRequest) => {
  const response = await loginApi(signInData);
  if (response.data) {
    const { access_token, refresh_token } = response.data;
    setAccessTokenInStorage(access_token);
    setRefreshTokenInStorage(refresh_token);
    setAccessToken(access_token);
    setRefreshToken(refresh_token);
    window.location.href='/chat'
  }
};

const logout = async () => {
  if (refreshToken) {
    await logoutApi({ refresh_token: refreshToken });
  }
  removeAccessTokenFromStorage();
  removeRefreshTokenFromStorage();
  setAccessToken(null);
  setRefreshToken(null);
};

return (
  <AuthContext.Provider value={{ accessToken, refreshToken, login, logout }}>
    {children}
  </AuthContext.Provider>
);
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("authcontext를 찾을 수 없습니다.");
    }
    return context;
}