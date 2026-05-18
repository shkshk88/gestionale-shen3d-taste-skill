import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { getAccessToken } from '@/lib/auth';
import type { Notification } from '@/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Notification sound (base64 encoded short beep)
const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR0UMlqOv9PChFwwPIe3ybyLW0NRm6+rhlk2Wo+1wauJa0pjqKiaf1w4R3yiv8KjgmRXd5+ol31vXXGalIhzZWhtjo1/cWhtgIN5cGlven94cmhwfn93dXByfn91dXN0fX53dnR0fX53eHV1fH53eHZ2fH55eXd3fH54eXh4fH56enh4fH56e3l5e355e3p6e356fHt7e357fHx8fH58fX19fX59fn5+fn5+fn9/f39/f4CAgICAgICAgYGBgYGBgYKCgoKCgoKCg4ODg4ODg4OEhISEhISEhIWFhYWFhYWFhoaGhoaGhoaHh4eHh4eHh4iIiIiIiIiIiYmJiYmJiYmKioqKioqKiouLi4uLi4uLjIyMjIyMjIyNjY2NjY2NjY6Ojo6Ojo6Oj4+Pj4+Pj4+QkJCQkJCQkJGRkZGRkZGRkpKSkpKSkpKTk5OTk5OTk5SUlJSUlJSUlZWVlZWVlZWWlpaWlpaWlpeXl5eXl5eXmJiYmJiYmJiZmZmZmZmZmZqampqampqam5ubm5ubm5ucnJycnJycnJ2dnZ2dnZ2dnp6enp6enp6fn5+fn5+fn6CgoKCgoKCgoaGhoaGhoaGioqKioqKioqOjo6Ojo6OjpKSkpKSkpKSlpaWlpaWlpaampqampqampqenp6enp6enqKioqKioqKipqampqampqaqqqqqqqqqqq6urq6urq6usrKysrKysrK2tra2tra2trq6urq6urq6vr6+vr6+vr7CwsLCwsLCwsbGxsbGxsbGysrKysrKysrOzs7Ozs7Ozt7e3t7e3t7e4uLi4uLi4uLm5ubm5ubm5urq6urq6urq7u7u7u7u7u7y8vLy8vLy8vb29vb29vb2+vr6+vr6+vr+/v7+/v7+/wMDAwMDAwMDBwcHBwcHBwcLCwsLCwsLCw8PDw8PDw8PExMTExMTExMXFxcXFxcXFxsbGxsbGxsbHx8fHx8fHx8jIyMjIyMjIycnJycnJycnKysrKysrKysvLy8vLy8vLzMzMzMzMzMzNzc3Nzc3Nzc7Ozs7Ozs7Oz8/Pz8/Pz8/Q0NDQ0NDQ0NHR0dHR0dHR0tLS0tLS0tLT09PT09PT09TU1NTU1NTU1dXV1dXV1dXW1tbW1tbW1tfX19fX19fX2NjY2NjY2NjZ2dnZ2dnZ2dra2tra2tra29vb29vb29vc3Nzc3Nzc3N3d3d3d3d3d3t7e3t7e3t7f39/f39/f3+Dg4ODg4ODg4eHh4eHh4eHi4uLi4uLi4uPj4+Pj4+Pj5OTk5OTk5OTl5eXl5eXl5ebm5ubm5ubm5+fn5+fn5+fo6Ojo6Ojo6Onp6enp6enp6urq6urq6urr6+vr6+vr6+zs7Ozs7Ozs7e3t7e3t7e3u7u7u7u7u7u/v7+/v7+/v8PDw8PDw8PDx8fHx8fHx8fLy8vLy8vLy8/Pz8/Pz8/P09PT09PT09PX19fX19fX19vb29vb29vb39/f39/f39/j4+Pj4+Pj4+fn5+fn5+fn6+vr6+vr6+vv7+/v7+/v7/Pz8/Pz8/Pz9/f39/f39/f7+/v7+/v7+////';

interface UseNotificationsOptions {
  enableSound?: boolean;
  enableToast?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { enableSound = true, enableToast = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    setNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  // Initialize audio
  useEffect(() => {
    if (enableSound && typeof window !== 'undefined') {
      audioRef.current = new Audio(NOTIFICATION_SOUND);
      audioRef.current.volume = 0.5;
    }
  }, [enableSound]);

  // Play notification sound
  const playSound = useCallback(() => {
    if (enableSound && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }, [enableSound]);

  // Show toast notification
  const showToast = useCallback((notification: Notification) => {
    if (!enableToast) return;

    // Use browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo-shen3d.png',
        tag: notification.id,
      });
    }
  }, [enableToast]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user?.id, setNotifications]);

  // Mark notification as read via API
  const markAsReadApi = useCallback(async (id: string) => {
    markAsRead(id);

    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
        },
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [markAsRead]);

  // Mark all as read via API
  const markAllAsReadApi = useCallback(async () => {
    markAllAsRead();

    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
        },
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [markAllAsRead]);

  // Initialize socket connection for real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    // Fetch initial notifications
    fetchNotifications();

    // Request notification permission
    requestPermission();

    // Connect to WebSocket
    const socket = io(SOCKET_URL, {
      query: { userId: user.id },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Listen for new notifications
    socket.on('notification', (notification: Notification) => {
      addNotification(notification);
      playSound();
      showToast(notification);
    });

    // Listen for new messages (create notification)
    socket.on('newMessage', (message: any) => {
      // Only notify if message is from someone else
      if (message.senderId !== user.id) {
        const notification: Notification = {
          id: `msg-${message.id}`,
          userId: user.id,
          notificationType: 'new_message',
          title: 'Nuovo messaggio',
          message: `${message.sender?.name || 'Utente'}: ${message.messageText.substring(0, 50)}...`,
          link: `/admin/cases/${message.caseId}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        addNotification(notification);
        playSound();
        showToast(notification);
      }
    });

    // Listen for case status changes
    socket.on('statusChanged', (data: { caseId: string; newStatus: string }) => {
      const notification: Notification = {
        id: `status-${data.caseId}-${Date.now()}`,
        userId: user.id,
        notificationType: 'status_change',
        title: 'Stato caso aggiornato',
        message: `Il caso è stato aggiornato a: ${data.newStatus}`,
        link: `/admin/cases/${data.caseId}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      addNotification(notification);
      playSound();
      showToast(notification);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, fetchNotifications, requestPermission, addNotification, playSound, showToast]);

  return {
    notifications,
    unreadCount,
    markAsRead: markAsReadApi,
    markAllAsRead: markAllAsReadApi,
    refetch: fetchNotifications,
    requestPermission,
  };
}

export default useNotifications;
