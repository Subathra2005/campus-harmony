import React from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, markNotificationRead } = useData();
  const { user } = useAuth();

  const myNotifications = notifications.filter(n => !n.userId || n.userId === user?.id || user?.role === 'admin');

  const icon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />;
      case 'error': return <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />;
      default: return <Info className="w-5 h-5 text-info flex-shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="module-header">Notifications</h1><p className="text-muted-foreground text-sm">{myNotifications.filter(n => !n.read).length} unread</p></div>
      <div className="space-y-3">
        {myNotifications.length === 0 && <p className="text-muted-foreground text-center py-8">No notifications</p>}
        {myNotifications.map(n => (
          <Card key={n.id} className={`transition-colors ${n.read ? 'opacity-60' : ''}`}>
            <CardContent className="flex items-start gap-3 py-4">
              {icon(n.type)}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-sm">{n.title}</h3>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{n.date}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
              </div>
              {!n.read && (
                <Button variant="ghost" size="sm" onClick={() => markNotificationRead(n.id)} className="flex-shrink-0">
                  Mark read
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
