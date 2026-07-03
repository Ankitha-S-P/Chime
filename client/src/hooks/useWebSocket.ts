import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../store/authStore';
import type { Message } from '../types';

interface TypingEvent {
  userId: string;
  username: string;
  roomId: string;
  typing: boolean;
}

interface UseWebSocketProps {
  roomId: string | null;
  onMessage: (message: Message) => void;
  onTyping: (event: TypingEvent) => void;
}

export const useWebSocket = ({ roomId, onMessage, onTyping }: UseWebSocketProps) => {
  const clientRef = useRef<Client | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken || !roomId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,

      onConnect: () => {
        client.subscribe(`/topic/room.${roomId}`, (frame) => {
          onMessage(JSON.parse(frame.body));
        });
        client.subscribe(`/topic/room.${roomId}.typing`, (frame) => {
          onTyping(JSON.parse(frame.body));
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
  }, [accessToken, roomId]);

  const sendTyping = useCallback((typing: boolean) => {
    if (!clientRef.current?.connected || !roomId) return;
    clientRef.current.publish({
      destination: `/app/typing.${roomId}`,
      body: JSON.stringify({ typing }),
    });
  }, [roomId]);

  return { sendTyping };
};