import api from './axios';
import type { Room } from '../types';

export const getMyRooms = () =>
  api.get<Room[]>('/api/rooms');

export const createRoom = (name: string, type: 'DIRECT' | 'GROUP', description?: string) =>
  api.post<Room>('/api/rooms', { name, type, description });

export const getOnlineMembers = (roomId: string) =>
  api.get<string[]>(`/api/rooms/${roomId}/members/online`);