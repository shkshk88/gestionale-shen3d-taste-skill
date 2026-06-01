import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { CaseMessage } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { getAccessToken } from '@/lib/auth';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface UseChatOptions {
  caseId: string;
  onNewMessage?: (message: CaseMessage) => void;
}

interface SendMessageData {
  messageText: string;
  fileId?: string;
}

export function useChat({ caseId, onNewMessage }: UseChatOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  // Initialize socket connection
  useEffect(() => {
    if (!user?.id) return;

    const socket = io(SOCKET_URL, {
      query: { userId: user.id },
      // Polling only — WebSocket upgrade blocked by browser when Vercel (HTTPS) proxies to VPS (HTTP).
      transports: ['polling'],
      upgrade: false,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Join the case room
      socket.emit('joinCase', caseId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('newMessage', (message: CaseMessage) => {
      setMessages((prev) => {
        // Avoid duplicates - check if message already exists
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;

        // Replace optimistic message with real one if same content from same user
        // This handles both the sender's optimistic update and other users' messages
        const withoutOptimistic = prev.filter((m) => {
          if (m.id.startsWith('temp-') && m.senderId === message.senderId) {
            return false;
          }
          return true;
        });

        return [...withoutOptimistic, message];
      });
      onNewMessage?.(message);
    });

    // Handle message errors
    socket.on('messageError', (error: { error: string }) => {
      console.error('Message error:', error.error);
    });

    // Cleanup on unmount
    return () => {
      socket.emit('leaveCase', caseId);
      socket.disconnect();
    };
  }, [caseId, user?.id, onNewMessage]);

  // Fetch existing messages
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/cases/${caseId}/messages`, {
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        } else {
          // For demo, use mock messages if API fails
          setMessages(getMockMessages(caseId, user?.id || ''));
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        // For demo, use mock messages if API fails
        setMessages(getMockMessages(caseId, user?.id || ''));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [caseId, user?.id]);

  // Send message
  const sendMessage = useCallback(
    async ({ messageText, fileId }: SendMessageData): Promise<void> => {
      if (!user?.id || !messageText.trim()) return;

      const trimmedText = messageText.trim();
      const tempId = `temp-${Date.now()}`;

      // Create optimistic message for immediate UI feedback
      const optimisticMessage: CaseMessage = {
        id: tempId,
        caseId,
        senderId: user.id,
        sender: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          language: user.language || 'it',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        messageText: trimmedText,
        messageType: fileId ? 'file' : 'text',
        fileId,
        isRead: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add message to state immediately (optimistic update)
      setMessages((prev) => [...prev, optimisticMessage]);

      // Try to send via WebSocket with acknowledgment
      if (socketRef.current?.connected) {
        return new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Socket timeout'));
          }, 10000);

          socketRef.current!.emit('sendMessage', {
            caseId,
            senderId: user.id,
            messageText: trimmedText,
            fileId,
          }, (response: any) => {
            clearTimeout(timeout);
            if (response && response.error) {
              reject(new Error(response.error));
            } else {
              resolve();
            }
          });
        }).catch((error) => {
          console.warn('WebSocket send failed, falling back to REST:', error);
          // Fallback to REST if WebSocket fails
          return sendMessageViaREST(trimmedText, fileId, tempId);
        });
      } else {
        // Use REST API if WebSocket is not connected
        return sendMessageViaREST(trimmedText, fileId, tempId);
      }
    },
    [caseId, user]
  );

  // Helper function to send message via REST API
  const sendMessageViaREST = async (messageText: string, fileId: string | undefined, tempId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageText, fileId }),
      });
      if (response.ok) {
        const newMessage = await response.json();
        // Replace optimistic message with real one
        setMessages((prev) => {
          const withoutOptimistic = prev.filter((m) => m.id !== tempId);
          return [...withoutOptimistic, newMessage];
        });
      } else {
        console.error('Failed to send message via REST');
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      await fetch(`${API_BASE_URL}/cases/${caseId}/messages/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      // Silently fail - not critical for demo
      console.debug('Error marking messages as read:', error);
    }
  }, [caseId, user?.id]);

  return {
    messages,
    isLoading,
    isConnected,
    sendMessage,
    markAsRead,
  };
}

// Mock messages for demo when API is not available
function getMockMessages(caseId: string, _currentUserId: string): CaseMessage[] {
  const now = new Date();
  return [
    {
      id: '1',
      caseId,
      senderId: 'lab-user-1',
      sender: {
        id: 'lab-user-1',
        name: 'Marco Rossi',
        email: 'marco@shen3d.com',
        role: 'operator',
        language: 'it',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      messageText: 'Buongiorno! Ho ricevuto il caso e inizierò la lavorazione oggi pomeriggio.',
      messageType: 'text',
      isRead: true,
      createdAt: new Date(now.getTime() - 3600000 * 24).toISOString(),
      updatedAt: new Date(now.getTime() - 3600000 * 24).toISOString(),
    },
    {
      id: '2',
      caseId,
      senderId: 'client-user-1',
      sender: {
        id: 'client-user-1',
        name: 'Dr. Bianchi',
        email: 'bianchi@studio.it',
        role: 'client',
        language: 'it',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      messageText: 'Perfetto, grazie! Mi raccomando il colore A2 per i denti anteriori.',
      messageType: 'text',
      isRead: true,
      createdAt: new Date(now.getTime() - 3600000 * 23).toISOString(),
      updatedAt: new Date(now.getTime() - 3600000 * 23).toISOString(),
    },
    {
      id: '3',
      caseId,
      senderId: 'lab-user-1',
      sender: {
        id: 'lab-user-1',
        name: 'Marco Rossi',
        email: 'marco@shen3d.com',
        role: 'operator',
        language: 'it',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      messageText: 'Certamente, ho annotato. Ho una domanda sulla preparazione del 21: il margine mi sembra un po\' sottile nella scansione. Può confermare?',
      messageType: 'text',
      isRead: true,
      createdAt: new Date(now.getTime() - 3600000 * 5).toISOString(),
      updatedAt: new Date(now.getTime() - 3600000 * 5).toISOString(),
    },
    {
      id: '4',
      caseId,
      senderId: 'client-user-1',
      sender: {
        id: 'client-user-1',
        name: 'Dr. Bianchi',
        email: 'bianchi@studio.it',
        role: 'client',
        language: 'it',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      messageText: 'Sì confermo, il paziente ha poco smalto residuo. Procedete pure con cautela.',
      messageType: 'text',
      isRead: false,
      createdAt: new Date(now.getTime() - 3600000 * 2).toISOString(),
      updatedAt: new Date(now.getTime() - 3600000 * 2).toISOString(),
    },
  ];
}

export default useChat;
