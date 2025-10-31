import axios from 'axios';
import {
  User,
  LoginCredentials,
  RegisterData,
  TokenResponse,
} from '../types/auth.types';

// Use empty string to make requests relative to current origin
// Vite proxy will forward /api/* requests to backend
const API_BASE_URL = '';

class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  /**
   * Login user with credentials
   */
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    try {
      // Create form data for OAuth2 password flow
      const formData = new FormData();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await axios.post<TokenResponse>(
        `${API_BASE_URL}/api/auth/login`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, token_type, user } = response.data;

      // Store token and user info
      if (credentials.rememberMe) {
        localStorage.setItem(this.tokenKey, access_token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
        console.log('[AuthService] Token saved to localStorage');
      } else {
        sessionStorage.setItem(this.tokenKey, access_token);
        sessionStorage.setItem(this.userKey, JSON.stringify(user));
        console.log('[AuthService] Token saved to sessionStorage');
      }

      return response.data;
    } catch (error: any) {
      console.error('[AuthService] Login failed:', error);
      if (error.response?.status === 401) {
        throw new Error('Invalid username or password');
      }
      throw new Error(error.response?.data?.detail || 'Login failed, please try again later');
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<User> {
    try {
      const response = await axios.post<User>(
        `${API_BASE_URL}/api/auth/register`,
        {
          username: userData.username,
          email: userData.email,
          password: userData.password,
          user_type: userData.user_type || 'general',
        }
      );

      console.log('[AuthService] Registration successful');
      return response.data;
    } catch (error: any) {
      console.error('[AuthService] Registration failed:', error);
      if (error.response?.status === 400) {
        throw new Error(error.response.data.detail || 'Registration failed');
      }
      throw new Error('Registration failed, please try again later');
    }
  }

  /**
   * Get current user profile from server
   */
  async getCurrentUserFromServer(): Promise<User> {
    try {
      const response = await axios.get<User>(
        `${API_BASE_URL}/api/auth/me`,
        {
          headers: this.getAuthHeader(),
        }
      );

      // Update stored user info
      const token = this.getToken();
      const userStr = JSON.stringify(response.data);

      if (localStorage.getItem(this.tokenKey)) {
        localStorage.setItem(this.userKey, userStr);
      } else if (sessionStorage.getItem(this.tokenKey)) {
        sessionStorage.setItem(this.userKey, userStr);
      }

      return response.data;
    } catch (error: any) {
      console.error('[AuthService] Failed to get current user:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load user profile');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: { email?: string; user_type?: string }): Promise<User> {
    try {
      const response = await axios.put<User>(
        `${API_BASE_URL}/api/auth/me`,
        updates,
        {
          headers: this.getAuthHeader(),
        }
      );

      // Update stored user info
      const userStr = JSON.stringify(response.data);

      if (localStorage.getItem(this.tokenKey)) {
        localStorage.setItem(this.userKey, userStr);
      } else if (sessionStorage.getItem(this.tokenKey)) {
        sessionStorage.setItem(this.userKey, userStr);
      }

      console.log('[AuthService] Profile updated successfully');
      return response.data;
    } catch (error: any) {
      console.error('[AuthService] Failed to update profile:', error);
      if (error.response?.status === 400) {
        throw new Error(error.response.data.detail || 'Update failed');
      }
      throw new Error(error.response?.data?.detail || 'Failed to update profile');
    }
  }

  /**
   * Logout current user
   */
  logout(): void {
    console.log('[AuthService] Logging out...');
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
    console.log('[AuthService] All authentication data cleared');
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    const userStr =
      localStorage.getItem(this.userKey) ||
      sessionStorage.getItem(this.userKey);

    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    const localToken = localStorage.getItem(this.tokenKey);
    const sessionToken = sessionStorage.getItem(this.tokenKey);
    const token = localToken || sessionToken;

    // DEBUG: Log token check
    console.log('[AuthService] Token Check:', {
      localToken: localToken ? 'exists' : 'not found',
      sessionToken: sessionToken ? 'exists' : 'not found',
      finalToken: token ? 'Authenticated' : 'Not authenticated',
      timestamp: new Date().toISOString(),
    });

    return token;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const hasToken = this.getToken() !== null;
    console.log('[AuthService] isAuthenticated:', hasToken);
    return hasToken;
  }

  /**
   * Get authorization header
   */
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): {
    isValid: boolean;
    message: string;
  } {
    if (password.length < 6) {
      return {
        isValid: false,
        message: 'Password must be at least 6 characters',
      };
    }

    if (password.length > 50) {
      return {
        isValid: false,
        message: 'Password must not exceed 50 characters',
      };
    }

    // Check for at least one letter and one number
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasLetter || !hasNumber) {
      return {
        isValid: false,
        message: 'Password must contain both letters and numbers',
      };
    }

    return {
      isValid: true,
      message: 'Password strength is good',
    };
  }
}

export const authService = new AuthService();
export default authService;
