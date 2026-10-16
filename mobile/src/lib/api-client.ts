import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Storage } from './storage';
import { getBaseApiUrl } from './network-config';

export const ACCESS_TOKEN_KEY = 'fixmate_access_token';
export const REFRESH_TOKEN_KEY = 'fixmate_refresh_token';

/**
 * Standardized API Client with:
 * - Dynamic environment base URL resolution
 * - Thread-safe 401 token refresh queue (replays concurrent requests)
 * - Safe request headers injection
 */
export const apiClient = axios.create({
  baseURL: getBaseApiUrl(),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 60000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Access Token & handle FormData boundaries
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await Storage.getItem(ACCESS_TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // If sending FormData, delete Content-Type so Axios/browser computes multipart boundary
      const isFormData =
        config.data &&
        ((typeof FormData !== 'undefined' && config.data instanceof FormData) ||
          Boolean((config.data as any)?._parts));
      if (isFormData && config.headers) {
        if (typeof (config.headers as any).delete === 'function') {
          (config.headers as any).delete('Content-Type');
        } else {
          delete (config.headers as any)['Content-Type'];
        }
      }
    } catch (error) {
      console.warn('[ApiClient] Failed to read access token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Silent Token Refresh & Request Replay Queue
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Do not attempt refresh on auth entry routes
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh-token') ||
        originalRequest.url?.includes('/auth/register')
      ) {
        return Promise.reject(error);
      }

      // If a refresh is already in flight, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = await Storage.getItem(REFRESH_TOKEN_KEY);
        if (!storedRefreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshResponse = await axios.post(
          `${getBaseApiUrl()}/auth/refresh-token`,
          { refreshToken: storedRefreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;

        await Storage.setItem(ACCESS_TOKEN_KEY, accessToken);
        if (newRefreshToken) {
          await Storage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        try {
          await Storage.removeItem(ACCESS_TOKEN_KEY);
          await Storage.removeItem(REFRESH_TOKEN_KEY);
        } catch {
          // ignore
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const getErrorMessage = (error: unknown): string => {
  if (!error) return 'An unexpected error occurred.';
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err.response?.data?.message || err.message || 'An unexpected error occurred.';
};
