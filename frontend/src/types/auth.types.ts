/**
 * Authentication Type Definitions
 */

export type UserType = 'general' | 'student' | 'young_professional' | 'pregnant_woman';

export interface User {
  id: string;
  username: string;
  email: string;
  user_type?: UserType;
  createdAt?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  user_type?: UserType;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ValidationErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}
