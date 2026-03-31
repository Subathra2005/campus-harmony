import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, BookOpen, Bell, ListChecks } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { students, feePayments, bookIssues, notifications } = useData();

  const student = user?.role === 'student'
    ? students.find(s => s.email === user.email)
    : null;

  const studentId = student?.id;
  const myFees = studentId ? feePayments.filter(f => f.studentId === studentId) : [];
  const pendingFees = myFees.filter(f => f.status !== 'paid');
  const pendingFeeAmount = pendingFees.reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0);

  const pendingBooks = studentId
    ? bookIssues.filter(bi => bi.studentId === studentId && bi.status !== 'returned')
    : [];

  const notificationKey = studentId || user?.id;
  const unreadNotifications = notifications.filter(n => !n.read && (!n.userId || (notificationKey && n.userId === notificationKey)));

  const pendingInstallments = pendingFees.length;
  const studentName = student?.name || user?.name || 'Student';
  const isProfileMissing = user?.role === 'student' && !student;
  const nothingPending = pendingFees.length === 0 && pendingBooks.length === 0 && unreadNotifications.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="module-header">Student Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back, {studentName}</p>
      </div>
      {isProfileMissing && (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            We couldn't match this login to a campus profile yet. Once the admin approves your admission, your course
            and enrollment details will appear here automatically.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase">Pending Fee</span>
            <DollarSign className="w-4 h-4 text-warning" />
          </div>
          <p className="text-xl font-bold">₹{pendingFeeAmount.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase">Installments Due</span>
            <ListChecks className="w-4 h-4 text-info" />
          </div>
          <p className="text-xl font-bold">{pendingInstallments}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase">Books to Return</span>
            <BookOpen className="w-4 h-4 text-info" />
          </div>
          <p className="text-xl font-bold">{pendingBooks.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase">Unread Alerts</span>
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-bold">{unreadNotifications.length}</p>
        </div>
      </div>

      {nothingPending ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground py-6 text-center">
            You're all caught up. We'll notify you here whenever new fee installments, books, or alerts need your
            attention.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Pending Fee Actions</CardTitle></CardHeader>
            <CardContent>
              {pendingFees.length === 0 ? (
                <p className="text-sm text-muted-foreground">No unpaid installments right now.</p>
              ) : (
                <div className="space-y-3">
                  {pendingFees.map(f => (
                    <div key={f.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">Installment {f.installmentNo}</p>
                        <p className="text-xs text-muted-foreground">Due: {f.dueDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{(f.amount - f.paidAmount).toLocaleString()}</p>
                        <span className={f.status === 'overdue' ? 'badge-destructive' : 'badge-warning'}>{f.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Books To Return</CardTitle></CardHeader>
            <CardContent>
              {pendingBooks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No outstanding books.</p>
              ) : (
                <div className="space-y-3">
                  {pendingBooks.map(bi => (
                    <div key={bi.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{bi.bookTitle}</p>
                        <p className="text-xs text-muted-foreground">Due: {bi.dueDate}</p>
                      </div>
                      <span className={bi.status === 'overdue' ? 'badge-destructive' : 'badge-info'}>{bi.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Unread Notifications</CardTitle></CardHeader>
            <CardContent>
              {unreadNotifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending alerts.</p>
              ) : (
                <div className="space-y-3">
                  {unreadNotifications.map(n => (
                    <div key={n.id} className="text-sm">
                      <p className="font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
