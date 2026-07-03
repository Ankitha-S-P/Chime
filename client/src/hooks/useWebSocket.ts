import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
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

  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onTypingRef.current = onTyping; }, [onTyping]);

  useEffect(() => {
    if (!accessToken || !roomId) return;

    console.log('[WS] Connecting for room:', roomId);

    const client = new Client({
      // Native WebSocket — no SockJS, no CORS preflight complexity
      brokerURL: 'ws://localhost:8080/ws/websocket',
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,

      onConnect: (frame) => {
        console.log('[WS] Connected:', frame.command);

        client.subscribe(`/topic/room.${roomId}`, (frame) => {
          console.log('[WS] Message received:', frame.body);
          onMessageRef.current(JSON.parse(frame.body));
        });

        client.subscribe(`/topic/room.${roomId}.typing`, (frame) => {
          onTypingRef.current(JSON.parse(frame.body));
        });

        console.log('[WS] Subscribed to room:', roomId);
      },

      onDisconnect: () => console.log('[WS] Disconnected'),
      onStompError: (frame) => console.error('[WS] STOMP error:', frame.headers['message']),
      onWebSocketError: (e) => console.error('[WS] WS error:', e),
      onWebSocketClose: (e) => console.log('[WS] WS closed:', (e as CloseEvent).reason),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
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
