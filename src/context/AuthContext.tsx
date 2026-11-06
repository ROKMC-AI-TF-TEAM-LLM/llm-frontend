import { useState, useEffect, useCallback, useMemo, type PropsWithChildren } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { LOCAL_STORAGE_KEY } from '../constants/key';
import { login as loginApi, logout as logoutApi } from '../api/services/auth';
import { logError } from '../utils/logError';
import { scheduleTokenRefresh } from '../api/lib/axios';
import { clearStoredChatData } from '../utils/chatStorage';
import type { LoginRequest } from '../types/auth';
import { AuthContext } from './useAuth';

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const {
    getItem: getAccessTokenFromStorage,
    setItem: setAccessTokenInStorage,
    removeItem: removeAccessTokenFromStorage,
  } = useLocalStorage<string>(LOCAL_STORAGE_KEY.ACCESS_TOKEN, 'session');

  const {
    getItem: getRefreshTokenFromStorage,
    setItem: setRefreshTokenInStorage,
    removeItem: removeRefreshTokenFromStorage,
  } = useLocalStorage<string>(LOCAL_STORAGE_KEY.REFRESH_TOKEN);

  const [accessToken, setAccessToken] = useState<string | null>(
    getAccessTokenFromStorage(),
  );

  const [refreshToken, setRefreshToken] = useState<string | null>(
    getRefreshTokenFromStorage(),
  );

  useEffect(() => {
    if (accessToken) scheduleTokenRefresh();
  }, [accessToken]);

  const login = useCallback(async (signInData: LoginRequest) => {
    const response = await loginApi(signInData);
    const { access_token, refresh_token } = response.data.data;
    setAccessTokenInStorage(access_token);
    setRefreshTokenInStorage(refresh_token);
    setAccessToken(access_token);
    setRefreshToken(refresh_token);
    scheduleTokenRefresh();
  }, [setAccessTokenInStorage, setRefreshTokenInStorage]);

  const logout = useCallback(async () => {
    const currentRefreshToken = getRefreshTokenFromStorage();
    if (currentRefreshToken) {
      try {
        await logoutApi({ refresh_token: currentRefreshToken });
      } catch (e) { logError('logout', e); }
    }
    removeAccessTokenFromStorage();
    removeRefreshTokenFromStorage();
    clearStoredChatData();
    setAccessToken(null);
    setRefreshToken(null);
    window.location.href = '/';
  }, [getRefreshTokenFromStorage, removeAccessTokenFromStorage, removeRefreshTokenFromStorage]);

  const value = useMemo(
    () => ({ accessToken, refreshToken, login, logout }),
    [accessToken, refreshToken, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
