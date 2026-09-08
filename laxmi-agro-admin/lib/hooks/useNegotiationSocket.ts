import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketMessage {
  negotiationId: string;
  message: string;
  userId: string;
  userRole: 'admin' | 'wholesaler';
  timestamp: string;
  messageId: string;
}

interface TypingUser {
  userId: string;
  username: string;
  userRole: 'admin' | 'wholesaler';
}

export function useNegotiationSocket(
  negotiationId: string,
  userId: string,
  username: string,
  serverUrl: string = 'https://api.laxmiagroenterprises.com'
) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<SocketMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [readReceipts, setReadReceipts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!negotiationId || !userId) return;

    // Initialize Socket.io connection
    const socket = io(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('[Socket Admin] Connected:', socket.id);
      setIsConnected(true);

      // Join negotiation room
      socket.emit('join-negotiation', {
        negotiationId,
        userId,
        userRole: 'admin',
      });
    });

    socket.on('disconnect', () => {
      console.log('[Socket Admin] Disconnected');
      setIsConnected(false);
    });

    // Listen for messages
    socket.on('receive-message', (data: SocketMessage) => {
      console.log('[Socket Admin] Message received:', data);
      setMessages((prev) => [...prev, data]);
    });

    // Listen for typing indicators
    socket.on('user-typing', (data: TypingUser) => {
      console.log('[Socket Admin] User typing:', data);
      setTypingUsers((prev) => {
        // Remove if already exists, then add (to update timestamp)
        const filtered = prev.filter((u) => u.userId !== data.userId);
        return [...filtered, data];
      });
    });

    socket.on('stop-typing', (data: { userId: string }) => {
      console.log('[Socket Admin] User stopped typing:', data.userId);
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    // Listen for read receipts
    socket.on('message-read', (data: { messageId: string; userId: string }) => {
      console.log('[Socket Admin] Message read:', data);
      setReadReceipts((prev) => new Set([...prev, data.messageId]));
    });

    socketRef.current = socket;

    return () => {
      socket.emit('leave-negotiation', {
        negotiationId,
        userId,
        userRole: 'admin',
      });
      socket.disconnect();
    };
  }, [negotiationId, userId, serverUrl]);

  const sendMessage = (message: string) => {
    if (!socketRef.current?.connected) {
      console.error('[Socket Admin] Not connected');
      return;
    }

    socketRef.current.emit('send-message', {
      negotiationId,
      message,
      userId,
      userRole: 'admin',
    });
  };

  const emitTyping = () => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('typing', {
      negotiationId,
      userId,
      username,
      userRole: 'admin',
    });
  };

  const emitStopTyping = () => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('stop-typing', {
      negotiationId,
      userId,
    });
  };

  const markAsRead = (messageId: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('mark-read', {
      negotiationId,
      messageId,
      userId,
    });
  };

  return {
    isConnected,
    messages,
    typingUsers,
    readReceipts,
    sendMessage,
    emitTyping,
    emitStopTyping,
    markAsRead,
  };
}
