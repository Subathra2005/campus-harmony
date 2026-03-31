import { Notification, Student, User, UserRole } from '@/types';

export interface NotificationAudience {
  studentProfile: Student | null;
  recipientId?: string;
  userRole?: UserRole;
}

export function resolveNotificationAudience(user: User | null, students: Student[]): NotificationAudience {
  const studentProfile = user?.role === 'student'
    ? students.find(s => s.email === user?.email) ?? null
    : null;
  const recipientId = user?.role === 'student' ? studentProfile?.id : user?.id;
  return { studentProfile, recipientId, userRole: user?.role };
}

export function notificationVisibleToUser(notification: Notification, audience: NotificationAudience): boolean {
  if (audience.userRole === 'admin') return true;
  if (!notification.userId && !notification.targetRole) return true;
  if (notification.targetRole && audience.userRole && notification.targetRole === audience.userRole) return true;
  if (notification.userId && audience.recipientId) return notification.userId === audience.recipientId;
  return false;
}
