import api from './axios';
import type { AuthResponse } from '../types';

export const register = (email: string, username: string, password: string) =>
  api.post<AuthResponse>('/api/auth/register', { email, username, password });

export const login = (email: string, password: string) =>
  api.post<AuthResponse>('/api/auth/login', { email, password });

export const logout = (refreshToken: string) =>
  api.post('/api/auth/logout', { refreshToken });