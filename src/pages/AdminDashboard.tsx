import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Users, DollarSign, Building2, BookOpen, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['hsl(175,55%,38%)', 'hsl(220,60%,25%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(205,80%,50%)'];

export default function AdminDashboard() {
  const { students, admissions, feePayments, hostelRooms, books, bookIssues } = useData();

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const pendingAdmissions = admissions.filter(a => a.status === 'applied' || a.status === 'verified').length;
  const totalRevenue = feePayments.filter(f => f.status === 'paid').reduce((s, f) => s + f.paidAmount, 0);
  const pendingFees = feePayments.filter(f => f.status === 'pending' || f.status === 'overdue').reduce((s, f) => s + (f.amount - f.paidAmount), 0);
  const overdueCount = feePayments.filter(f => f.status === 'overdue').length;
  const totalRooms = hostelRooms.length;
  const occupiedRooms = hostelRooms.filter(r => r.status === 'occupied').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const totalBooks = books.reduce((s, b) => s + b.totalCopies, 0);
  const issuedBooks = bookIssues.filter(bi => bi.status === 'issued' || bi.status === 'overdue').length;

  const feeStatusData = [
    { name: 'Paid', value: feePayments.filter(f => f.status === 'paid').length },
    { name: 'Pending', value: feePayments.filter(f => f.status === 'pending').length },
    { name: 'Overdue', value: feePayments.filter(f => f.status === 'overdue').length },
    { name: 'Partial', value: feePayments.filter(f => f.status === 'partial').length },
  ].filter(d => d.value > 0);

  const courseData = ['B.Tech CS', 'B.Tech ECE', 'BBA', 'MBA'].map(course => ({
    course: course.replace('B.Tech ', ''),
    students: students.filter(s => s.course === course).length,
  }));

  const stats = [
    { label: 'Total Students', value: totalStudents, sub: `${activeStudents} active`, icon: Users, color: 'text-primary' },
    { label: 'Revenue Collected', value: `₹${(totalRevenue / 1000).toFixed(0)}K`, sub: `₹${(pendingFees / 1000).toFixed(0)}K pending`, icon: DollarSign, color: 'text-success' },
    { label: 'Hostel Occupancy', value: `${occupancyRate}%`, sub: `${occupiedRooms}/${totalRooms} rooms`, icon: Building2, color: 'text-info' },
    { label: 'Pending Admissions', value: pendingAdmissions, sub: `${admissions.length} total`, icon: FileText, color: 'text-warning' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="module-header">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of all college operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</span>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {overdueCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">{overdueCount} overdue fee payment(s)</p>
            <p className="text-xs text-muted-foreground">Students with overdue payments need follow-up</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Fee Payment Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={feeStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {feeStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Students by Course</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={courseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,88%)" />
                <XAxis dataKey="course" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="students" fill="hsl(220,60%,25%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Library</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Books</span><span className="font-medium">{totalBooks}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Currently Issued</span><span className="font-medium">{issuedBooks}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Overdue</span><span className="font-medium text-destructive">{bookIssues.filter(bi => bi.status === 'overdue').length}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Admissions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {admissions.slice(0, 3).map(a => (
              <div key={a.id} className="flex justify-between items-center text-sm">
                <span className="truncate mr-2">{a.applicantName}</span>
                <span className={a.status === 'approved' ? 'badge-success' : a.status === 'verified' ? 'badge-info' : 'badge-warning'}>
                  {a.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Hostel Overview</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Available</span><span className="font-medium text-success">{hostelRooms.filter(r => r.status === 'available').length}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Occupied</span><span className="font-medium">{occupiedRooms}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Maintenance</span><span className="font-medium text-warning">{hostelRooms.filter(r => r.status === 'maintenance').length}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
