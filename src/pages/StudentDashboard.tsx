import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, BookOpen, Building2, Bell } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { students, feePayments, hostelRooms, bookIssues, notifications } = useData();

  // Find student record by email match
  const student = students.find(s => s.email === user?.email) || students[0];
  const myFees = feePayments.filter(f => f.studentId === student?.id);
  const myRoom = hostelRooms.find(r => r.id === student?.hostelRoomId);
  const myBooks = bookIssues.filter(bi => bi.studentId === student?.id && bi.status !== 'returned');
  const myNotifications = notifications.filter(n => !n.read && (!n.userId || n.userId === student?.id));

  const totalDue = myFees.filter(f => f.status !== 'paid').reduce((s, f) => s + (f.amount - f.paidAmount), 0);
  const totalPaid = myFees.filter(f => f.status === 'paid').reduce((s, f) => s + f.paidAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="module-header">Student Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back, {student?.name || user?.name}</p>
      </div>

      {student && (
        <Card>
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground block text-xs">Student ID</span><span className="font-medium">{student.studentId}</span></div>
              <div><span className="text-muted-foreground block text-xs">Course</span><span className="font-medium">{student.course}</span></div>
              <div><span className="text-muted-foreground block text-xs">Year / Sem</span><span className="font-medium">Year {student.year} / Sem {student.semester}</span></div>
              <div><span className="text-muted-foreground block text-xs">Status</span><span className="badge-success">{student.status}</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase">Fee Paid</span>
            <DollarSign className="w-4 h-4 text-success" />
          </div>
          <p className="text-xl font-bold">₹{totalPaid.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase">Fee Due</span>
            <DollarSign className="w-4 h-4 text-warning" />
          </div>
          <p className="text-xl font-bold">₹{totalDue.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase">Books Borrowed</span>
            <BookOpen className="w-4 h-4 text-info" />
          </div>
          <p className="text-xl font-bold">{myBooks.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase">Notifications</span>
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-bold">{myNotifications.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Fee History</CardTitle></CardHeader>
          <CardContent>
            {myFees.length === 0 ? <p className="text-sm text-muted-foreground">No fee records</p> : (
              <div className="space-y-3">
                {myFees.map(f => (
                  <div key={f.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">Installment {f.installmentNo}</p>
                      <p className="text-xs text-muted-foreground">Due: {f.dueDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{f.amount.toLocaleString()}</p>
                      <span className={f.status === 'paid' ? 'badge-success' : f.status === 'overdue' ? 'badge-destructive' : 'badge-warning'}>{f.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Hostel Info</CardTitle></CardHeader>
          <CardContent>
            {myRoom ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Room</span><span className="font-medium">{myRoom.roomNumber}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Block</span><span className="font-medium">{myRoom.block}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium capitalize">{myRoom.type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Monthly Rent</span><span className="font-medium">₹{myRoom.monthlyRent}</span></div>
              </div>
            ) : <p className="text-sm text-muted-foreground">No hostel room assigned</p>}
          </CardContent>
        </Card>
      </div>

      {myBooks.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Borrowed Books</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myBooks.map(bi => (
                <div key={bi.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{bi.bookTitle}</p>
                    <p className="text-xs text-muted-foreground">Due: {bi.dueDate}</p>
                  </div>
                  <span className={bi.status === 'overdue' ? 'badge-destructive' : 'badge-info'}>{bi.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
