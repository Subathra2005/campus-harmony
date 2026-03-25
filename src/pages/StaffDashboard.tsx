import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Building2, BookOpen, Users } from 'lucide-react';

export default function StaffDashboard() {
  const { user } = useAuth();
  const { students, feePayments, hostelRooms, books, bookIssues } = useData();

  const role = user?.role || '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="module-header">Staff Dashboard</h1>
        <p className="text-muted-foreground text-sm capitalize">Welcome, {user?.name} ({role.replace('staff-', '')} staff)</p>
      </div>

      {(role === 'staff-accounts' || role === 'staff-faculty') && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Total Collected</span><DollarSign className="w-4 h-4 text-success" /></div>
            <p className="text-xl font-bold">₹{feePayments.reduce((s, f) => s + f.paidAmount, 0).toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Pending</span><DollarSign className="w-4 h-4 text-warning" /></div>
            <p className="text-xl font-bold">{feePayments.filter(f => f.status === 'pending').length}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Overdue</span><DollarSign className="w-4 h-4 text-destructive" /></div>
            <p className="text-xl font-bold">{feePayments.filter(f => f.status === 'overdue').length}</p>
          </div>
        </div>
      )}

      {role === 'staff-hostel' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Rooms</span><Building2 className="w-4 h-4 text-primary" /></div><p className="text-xl font-bold">{hostelRooms.length}</p></div>
          <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Available</span><Building2 className="w-4 h-4 text-success" /></div><p className="text-xl font-bold">{hostelRooms.filter(r => r.status === 'available').length}</p></div>
          <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Occupants</span><Users className="w-4 h-4 text-info" /></div><p className="text-xl font-bold">{hostelRooms.reduce((s, r) => s + r.occupants.length, 0)}</p></div>
        </div>
      )}

      {role === 'staff-library' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Total Books</span><BookOpen className="w-4 h-4 text-primary" /></div><p className="text-xl font-bold">{books.reduce((s, b) => s + b.totalCopies, 0)}</p></div>
          <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Issued</span><BookOpen className="w-4 h-4 text-info" /></div><p className="text-xl font-bold">{bookIssues.filter(bi => bi.status === 'issued').length}</p></div>
          <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Overdue</span><BookOpen className="w-4 h-4 text-destructive" /></div><p className="text-xl font-bold">{bookIssues.filter(bi => bi.status === 'overdue').length}</p></div>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Quick Stats</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Active Students</span><span className="font-medium">{students.filter(s => s.status === 'active').length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Students</span><span className="font-medium">{students.length}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
