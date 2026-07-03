import api from './axios';
import type { PagedMessages } from '../types';

export const getMessages = (roomId: string, before?: string) =>
  api.get<PagedMessages>(`/api/rooms/${roomId}/messages`, {
    params: before ? { before } : {},
  });

export const sendMessage = (roomId: string, content: string, replyToId?: string) =>
  api.post(`/api/rooms/${roomId}/messages`, { content, type: 'TEXT', replyToId });

export const deleteMessage = (roomId: string, messageId: string) =>
  api.delete(`/api/rooms/${roomId}/messages/${messageId}`);