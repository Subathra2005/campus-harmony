import React, { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, AlertTriangle, Info, XCircle, Filter, MailCheck } from 'lucide-react';
import { resolveNotificationAudience, notificationVisibleToUser } from '@/lib/notifications';

const TYPE_OPTIONS = ['all', 'info', 'success', 'warning', 'error'] as const;

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markNotificationsRead, setNotificationReadState, students } = useData();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_OPTIONS)[number]>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');

  const audience = resolveNotificationAudience(user, students);

  const sortedNotifications = useMemo(() => {
    return [...notifications]
      .filter(n => notificationVisibleToUser(n, audience))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [notifications, audience]);

  const filtered = useMemo(() => {
    return sortedNotifications.filter(n => {
      const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'unread' ? !n.read : n.read;
      const matchesType = typeFilter === 'all' ? true : n.type === typeFilter;
      const text = `${n.title} ${n.message}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase().trim());
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [sortedNotifications, search, statusFilter, typeFilter]);

  const unreadCount = sortedNotifications.filter(n => !n.read).length;

  const icon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'error': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Info className="w-4 h-4 text-info" />;
    }
  };

  const typeBadge = (type: string) => {
    switch (type) {
      case 'success': return 'badge-success';
      case 'warning': return 'badge-warning';
      case 'error': return 'badge-destructive';
      default: return 'badge-info';
    }
  };

  const formatDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const markFilteredAsRead = () => {
    const unreadIds = filtered.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    markNotificationsRead(unreadIds);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="module-header">Notifications</h1>
          <p className="text-muted-foreground text-sm">{unreadCount} unread • {sortedNotifications.length} total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setStatusFilter('unread')}>
            <Filter className="w-4 h-4 mr-2" />Show unread
          </Button>
          <Button size="sm" onClick={markFilteredAsRead} disabled={filtered.every(n => n.read)}>
            <MailCheck className="w-4 h-4 mr-2" />Mark visible as read
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs uppercase text-muted-foreground">Unread</p>
            <p className="text-2xl font-semibold">{unreadCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs uppercase text-muted-foreground">Today</p>
            <p className="text-2xl font-semibold">{filtered.filter(n => {
              const date = new Date(n.date);
              const now = new Date();
              return date.toDateString() === now.toDateString();
            }).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs uppercase text-muted-foreground">Visible</p>
            <p className="text-2xl font-semibold">{filtered.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input placeholder="Search title or message" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={val => setStatusFilter(val as typeof statusFilter)}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={val => setTypeFilter(val as typeof typeFilter)}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map(opt => (
                <SelectItem key={opt} value={opt}>{opt === 'all' ? 'All types' : opt.charAt(0).toUpperCase() + opt.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No notifications match the selected filters.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(notification => (
                  <TableRow key={notification.id} className={notification.read ? 'opacity-70' : ''}>
                    <TableCell className="text-sm">{formatDate(notification.date)}</TableCell>
                    <TableCell className="font-medium flex items-center gap-2">
                      {icon(notification.type)}
                      <span>{notification.title}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{notification.message}</TableCell>
                    <TableCell><span className={typeBadge(notification.type)}>{notification.type}</span></TableCell>
                    <TableCell>
                      <span className={notification.read ? 'badge-info' : 'badge-warning'}>
                        {notification.read ? 'Read' : 'Unread'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => notification.read ? setNotificationReadState(notification.id, false) : markNotificationRead(notification.id)}
                      >
                        {notification.read ? 'Mark unread' : 'Mark read'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
