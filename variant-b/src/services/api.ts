import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper to get auth state from Zustand store (localStorage)
const getAuthState = () => {
  const authStorage = localStorage.getItem('auth-storage');
  if (!authStorage) return null;
  try {
    const parsed = JSON.parse(authStorage);
    return parsed.state;
  } catch {
    return null;
  }
};

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - aggiunge JWT token
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Get token from auth-storage (Zustand persist)
        const state = getAuthState();
        const token = state?.accessToken;

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // For FormData uploads, remove the JSON default Content-Type so the browser
        // sets `multipart/form-data; boundary=...`. Without the boundary the server
        // (multer/FilesInterceptor) can't parse the body and receives zero files.
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - gestisce errori e refresh token
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Se errore 401 e non è già un retry, in DEV mode ignora l'errore
        if (error.response?.status === 401 && !originalRequest._retry) {
          // In development mode, skip authentication errors
          if (import.meta.env.DEV) {
            console.warn('401 error in DEV mode - authentication disabled for development');
            // Return empty data to avoid breaking the app
            return Promise.resolve({ data: null } as any);
          }

          originalRequest._retry = true;

          try {
            const state = getAuthState();
            const refreshToken = state?.refreshToken;

            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refresh_token: refreshToken,
              });

              const { access_token, refresh_token: newRefreshToken } = response.data;

              // Update auth storage
              const authStorage = localStorage.getItem('auth-storage');
              if (authStorage) {
                const parsed = JSON.parse(authStorage);
                parsed.state.accessToken = access_token;
                if (newRefreshToken) {
                  parsed.state.refreshToken = newRefreshToken;
                }
                localStorage.setItem('auth-storage', JSON.stringify(parsed));
              }

              // Riprova la richiesta originale
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
              }
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh token fallito, redirect a login
            localStorage.removeItem('auth-storage');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Metodi GET
  public async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  // Metodi POST
  public async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  // Metodi PUT
  public async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  // Metodi PATCH
  public async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.patch<T>(url, data, config);
    return response.data;
  }

  // Metodi DELETE
  public async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }

  // Upload file con progress
  public async uploadFile<T>(
    url: string,
    file: File,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.api.post<T>(url, formData, {
      onUploadProgress,
    });

    return response.data;
  }

  // Upload multipli file
  public async uploadFiles<T>(
    url: string,
    files: File[],
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<T> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await this.api.post<T>(url, formData, {
      onUploadProgress,
    });

    return response.data;
  }

  // Download file
  public async downloadFile(url: string, filename?: string): Promise<void> {
    const response = await this.api.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Get Axios instance per usi avanzati
  public getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;
