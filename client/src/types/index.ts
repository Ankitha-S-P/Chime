export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  type: 'DIRECT' | 'GROUP';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  replyToId?: string;
  replyToContent?: string;
  deleted: boolean;
  editedAt?: string;
  createdAt: string;
}

export interface PagedMessages {
  messages: Message[];
  nextCursor?: string;
  hasMore: boolean;
}
