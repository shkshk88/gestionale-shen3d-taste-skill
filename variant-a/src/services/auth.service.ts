import api from './api';
import { useAuthStore } from '@/store/authStore';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    language: string;
    clientId?: string;
    client?: {
      id: string;
      studioName: string;
      contactPerson: string;
      address: string;
      city: string;
      postalCode: string;
      country: string;
      phone: string;
      email: string;
      whatsapp?: string;
      vatNumber?: string;
      taxCode?: string;
      active: boolean;
      createdAt: string;
      updatedAt: string;
    };
    avatarUrl?: string;
  };
}

export interface GoogleAuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    language: string;
    clientId?: string;
    avatarUrl?: string;
  };
}

class AuthService {
  // Login con Google OAuth
  async loginWithGoogle(googleToken: string): Promise<LoginResponse> {
    try {
      const response = await api.post<GoogleAuthResponse>('/auth/google', {
        token: googleToken,
      });

      // Update Zustand store (single source of truth)
      useAuthStore.getState().login(response.user as any, response.access_token, response.refresh_token);

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  // Logout
  logout(): void {
    // Clear Zustand store (includes refreshToken)
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  // Get current user from Zustand store
  getCurrentUser(): LoginResponse['user'] | null {
    return useAuthStore.getState().user as LoginResponse['user'] | null;
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated;
  }

  // Get access token
  getAccessToken(): string | null {
    return useAuthStore.getState().accessToken;
  }

  // Refresh token
  async refreshToken(): Promise<LoginResponse> {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await api.post<LoginResponse>('/auth/refresh', {
        refresh_token: refreshToken,
      });

      // Update Zustand store (with new refresh token if provided)
      useAuthStore.getState().login(
        response.user as any,
        response.access_token,
        response.refresh_token || refreshToken
      );

      return response;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  // Get user profile
  async getProfile(): Promise<LoginResponse['user']> {
    try {
      const response = await api.get<LoginResponse['user']>('/auth/me');
      // Update user in Zustand store while preserving token
      const currentToken = useAuthStore.getState().accessToken;
      useAuthStore.getState().login(response as any, currentToken || '');
      return response;
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw error;
    }
  }
}

const authService = new AuthService();
export default authService;
