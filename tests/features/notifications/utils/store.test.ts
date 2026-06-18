import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNotificationStore } from '@/features/notifications/utils/store';
import type { Notification } from '@/features/notifications/utils/store';

describe('notifications store', () => {
  // Capture immutable snapshot at module load
  const INITIAL_NOTIFICATIONS: Notification[] = useNotificationStore
    .getState()
    .notifications.map((n) => ({ ...n, actions: n.actions ? [...n.actions] : undefined }));

  beforeEach(() => {
    useNotificationStore.setState({
      notifications: INITIAL_NOTIFICATIONS.map((n) => ({ ...n, actions: n.actions ? [...n.actions] : undefined }))
    });
  });

  describe('initial state', () => {
    it('has 5 notifications', () => {
      expect(useNotificationStore.getState().notifications).toHaveLength(5);
    });

    it('has 3 notifications with status unread (ids 1, 2, 3)', () => {
      const unread = useNotificationStore.getState().notifications.filter((n) => n.status === 'unread');
      expect(unread).toHaveLength(3);
      expect(unread.map((n) => n.id)).toEqual(['1', '2', '3']);
    });

    it('has 2 notifications with status read (ids 4, 5)', () => {
      const read = useNotificationStore.getState().notifications.filter((n) => n.status === 'read');
      expect(read).toHaveLength(2);
      expect(read.map((n) => n.id)).toEqual(['4', '5']);
    });
  });

  describe('markAsRead', () => {
    it('sets the matching notification status to read', () => {
      useNotificationStore.getState().markAsRead('1');
      const notif = useNotificationStore.getState().notifications.find((n) => n.id === '1');
      expect(notif?.status).toBe('read');
    });

    it('other notifications unchanged', () => {
      const notif2Before = useNotificationStore.getState().notifications.find((n) => n.id === '2')?.status;
      useNotificationStore.getState().markAsRead('1');
      const notif2After = useNotificationStore.getState().notifications.find((n) => n.id === '2')?.status;
      expect(notif2After).toBe(notif2Before);
    });

    it('marking an already-read notification stays read with no error', () => {
      expect(() => useNotificationStore.getState().markAsRead('4')).not.toThrow();
      const notif = useNotificationStore.getState().notifications.find((n) => n.id === '4');
      expect(notif?.status).toBe('read');
    });

    it('marking a non-existent id causes no change with no error', () => {
      const allBefore = useNotificationStore.getState().notifications.map((n) => ({ id: n.id, status: n.status }));
      expect(() => useNotificationStore.getState().markAsRead('non-existent')).not.toThrow();
      const allAfter = useNotificationStore.getState().notifications.map((n) => ({ id: n.id, status: n.status }));
      expect(allAfter).toEqual(allBefore);
    });
  });

  describe('markAllAsRead', () => {
    it('all notifications become read', () => {
      useNotificationStore.getState().markAllAsRead();
      const states = useNotificationStore.getState().notifications.map((n) => n.status);
      expect(states).toEqual(['read', 'read', 'read', 'read', 'read']);
    });

    it('count of unread becomes 0', () => {
      useNotificationStore.getState().markAllAsRead();
      expect(useNotificationStore.getState().unreadCount()).toBe(0);
    });

    it('no notifications removed (length unchanged)', () => {
      const countBefore = useNotificationStore.getState().notifications.length;
      useNotificationStore.getState().markAllAsRead();
      expect(useNotificationStore.getState().notifications.length).toBe(countBefore);
    });
  });

  describe('removeNotification', () => {
    it('removes the matching notification', () => {
      useNotificationStore.getState().removeNotification('3');
      const ids = useNotificationStore.getState().notifications.map((n) => n.id);
      expect(ids).not.toContain('3');
    });

    it('other notifications unchanged', () => {
      useNotificationStore.getState().removeNotification('3');
      const remaining = useNotificationStore.getState().notifications.map((n) => n.id);
      expect(remaining).toEqual(['1', '2', '4', '5']);
    });

    it('removing a non-existent id causes no change', () => {
      const allBefore = useNotificationStore.getState().notifications.map((n) => n.id);
      useNotificationStore.getState().removeNotification('non-existent');
      const allAfter = useNotificationStore.getState().notifications.map((n) => n.id);
      expect(allAfter).toEqual(allBefore);
    });

    it('after remove, unreadCount reflects only remaining notifications', () => {
      // id '3' is unread, remove it, unreadCount should be 2
      useNotificationStore.getState().removeNotification('3');
      expect(useNotificationStore.getState().unreadCount()).toBe(2);
    });
  });

  describe('addNotification', () => {
    it('prepends to the list (becomes index 0)', () => {
      useNotificationStore.getState().addNotification({
        id: 'new-notif',
        title: 'New notification',
        body: 'This is a new notification',
        createdAt: new Date().toISOString()
      });
      expect(useNotificationStore.getState().notifications[0].id).toBe('new-notif');
    });

    it('new notification has status unread regardless of input', () => {
      useNotificationStore.getState().addNotification({
        id: 'new-notif-2',
        title: 'Test',
        body: 'Body',
        createdAt: new Date().toISOString(),
        status: 'read' as // @ts-expect-error - intentionally passing wrong status to test override
         unknown as 'unread'
      });
      expect(useNotificationStore.getState().notifications[0].status).toBe('unread');
    });

    it('preserves all other fields', () => {
      useNotificationStore.getState().addNotification({
        id: 'new-notif-3',
        title: 'Custom Title',
        body: 'Custom body text',
        createdAt: '2026-06-18T10:00:00.000Z'
      });
      const added = useNotificationStore.getState().notifications[0];
      expect(added.title).toBe('Custom Title');
      expect(added.body).toBe('Custom body text');
      expect(added.createdAt).toBe('2026-06-18T10:00:00.000Z');
    });

    it('after add, unreadCount increments by 1', () => {
      const countBefore = useNotificationStore.getState().unreadCount();
      useNotificationStore.getState().addNotification({
        id: 'new-notif-4',
        title: 'Test',
        body: 'Body',
        createdAt: new Date().toISOString()
      });
      expect(useNotificationStore.getState().unreadCount()).toBe(countBefore + 1);
    });

    it('notification with actions array preserves actions', () => {
      useNotificationStore.getState().addNotification({
        id: 'new-notif-5',
        title: 'With actions',
        body: 'Has action buttons',
        createdAt: new Date().toISOString(),
        actions: [{ id: 'action-1', label: 'View', type: 'redirect', style: 'primary' }]
      });
      const added = useNotificationStore.getState().notifications[0];
      expect(added.actions).toHaveLength(1);
      expect(added.actions?.[0].label).toBe('View');
    });

    it('notification without actions has undefined actions', () => {
      useNotificationStore.getState().addNotification({
        id: 'new-notif-6',
        title: 'No actions',
        body: 'Body only',
        createdAt: new Date().toISOString()
      });
      const added = useNotificationStore.getState().notifications[0];
      expect(added.actions).toBeUndefined();
    });
  });

  describe('unreadCount', () => {
    it('returns count of notifications with status unread', () => {
      expect(useNotificationStore.getState().unreadCount()).toBe(3);
    });

    it('returns 0 when all read', () => {
      useNotificationStore.getState().markAllAsRead();
      expect(useNotificationStore.getState().unreadCount()).toBe(0);
    });

    it('updates after markAsRead (decrements)', () => {
      useNotificationStore.getState().markAsRead('1');
      expect(useNotificationStore.getState().unreadCount()).toBe(2);
    });

    it('updates after markAllAsRead (becomes 0)', () => {
      useNotificationStore.getState().markAllAsRead();
      expect(useNotificationStore.getState().unreadCount()).toBe(0);
    });

    it('updates after removeNotification (may decrement if removed was unread)', () => {
      // id '2' is unread, removing it should drop count from 3 to 2
      useNotificationStore.getState().removeNotification('2');
      expect(useNotificationStore.getState().unreadCount()).toBe(2);
    });

    it('updates after addNotification (increments)', () => {
      const before = useNotificationStore.getState().unreadCount();
      useNotificationStore.getState().addNotification({
        id: 'new-notif-7',
        title: 'Test',
        body: 'Body',
        createdAt: new Date().toISOString()
      });
      expect(useNotificationStore.getState().unreadCount()).toBe(before + 1);
    });
  });
});