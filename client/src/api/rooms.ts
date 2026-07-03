import api from './axios';
import type { Room, RoomMember, User } from '../types';

export const getMyRooms = () =>
  api.get<Room[]>('/api/rooms');

export const createRoom = (name: string, type: 'DIRECT' | 'GROUP', description?: string) =>
  api.post<Room>('/api/rooms', { name, type, description });

export const updateRoom = (roomId: string, name: string) =>
  api.patch<Room>(`/api/rooms/${roomId}`, { name });

export const getMembers = (roomId: string) =>
  api.get<RoomMember[]>(`/api/rooms/${roomId}/members`);

export const inviteMember = (roomId: string, userId: string) =>
  api.post<RoomMember>(`/api/rooms/${roomId}/members`, { userId });

export const removeMember = (roomId: string, userId: string) =>
  api.delete(`/api/rooms/${roomId}/members/${userId}`);

export const getOnlineMembers = (roomId: string) =>
  api.get<string[]>(`/api/rooms/${roomId}/members/online`);

export const getOrCreateDirect = (targetUserId: string) =>
  api.post<Room>(`/api/rooms/direct/${targetUserId}`);

export const searchUsers = (query: string) =>
  api.get<User[]>(`/api/users/search?query=${encodeURIComponent(query)}`);
