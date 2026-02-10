import { useEffect, useRef } from 'react';
import type { ClaudeCodeStatus } from '../types/events.js';

export function useNotifications(status: ClaudeCodeStatus | null, sessionName: string | null) {
  const permissionRef = useRef<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      permissionRef.current = Notification.permission;
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    permissionRef.current = result;
    return result === 'granted';
  };

  useEffect(() => {
    // Only notify when the page is hidden (user switched tab/app)
    if (!document.hidden) return;
    if (permissionRef.current !== 'granted') return;

    if (status === 'waiting_input' || status === 'approval_needed') {
      const title = status === 'approval_needed'
        ? 'RCCB: Approvazione richiesta'
        : 'RCCB: Input richiesto';
      const body = sessionName
        ? `La sessione "${sessionName}" attende una risposta`
        : 'Claude Code attende una risposta';

      const notification = new Notification(title, {
        body,
        icon: '/icon-192.png',
        tag: 'rccb-input-request', // Replace previous notification
        requireInteraction: status === 'approval_needed',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }, [status, sessionName]);

  return { requestPermission, isSupported: 'Notification' in window };
}
