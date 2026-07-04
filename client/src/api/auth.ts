import api from './axios';
import type { AuthResponse } from '../types';

export const register = (email: string, username: string, password: string) =>
  api.post<AuthResponse>('/api/auth/register', { email, username, password });

export const login = (email: string, password: string) =>
  api.post<AuthResponse>('/api/auth/login', { email, password });

export const logout = (refreshToken: string) =>
  api.post('/api/auth/logout', { refreshToken });

export const forgotPassword = (email: string) =>
  api.post<{ message: string }>('/api/auth/forgot-password', { email });

export const resetPassword = (email: string, otp: string, newPassword: string) =>
  api.post<{ message: string }>('/api/auth/reset-password', { email, otp, newPassword });