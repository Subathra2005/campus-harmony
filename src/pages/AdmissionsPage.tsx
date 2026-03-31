import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Admission, Notification, UserRole } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, CheckCircle, XCircle, Eye } from 'lucide-react';

const COURSES = ['B.Tech CS', 'B.Tech ECE', 'BBA', 'MBA'];

export default function AdmissionsPage() {
  const { admissions, addAdmission, updateAdmission, approveAdmission, addAuditLog, students, addNotification } = useData();
  const { user } = useAuth();
    const notify = (payload: { title: string; message: string; type: Notification['type']; userId?: string; targetRole?: UserRole }) => {
      addNotification({ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], read: false, ...payload });
    };
    const studentProfile = user?.role === 'student' ? students.find(s => s.email === user?.email) : null;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewItem, setViewItem] = useState<Admission | null>(null);

  const emptyForm = {
    applicantName: '', email: '', phone: '', course: 'B.Tech CS', dob: '', gender: 'Male',
    address: '', guardianName: '', guardianPhone: '', notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const filtered = admissions.filter(a => {
    const matchSearch = a.applicantName.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSubmit = () => {
    if (!form.applicantName || !form.email) return;
    const linkedStudent = students.find(s => s.email === form.email) ?? studentProfile ?? null;
    const admission: Admission = {
      ...form, id: crypto.randomUUID(), status: 'applied',
      appliedDate: new Date().toISOString().split('T')[0], documents: [],
      studentId: linkedStudent?.id,
    };
    addAdmission(admission);
    addAuditLog({ action: 'New admission', module: 'Admissions', userId: user!.id, userName: user!.name, details: `Application from ${form.applicantName}` });
    notify({
      title: 'New admission application',
      message: `${form.applicantName} applied for ${form.course}.`,
      type: 'info',
      targetRole: 'admin',
    });
    setDialogOpen(false);
    setForm(emptyForm);
  };

  const handleApprove = (admission: Admission) => {
    approveAdmission(admission.id);
    addAuditLog({ action: 'Approved admission', module: 'Admissions', userId: user!.id, userName: user!.name, details: `Approved application ${admission.id}` });
    if (admission.studentId) {
      notify({
        title: 'Admission approved',
        message: `Your application for ${admission.course} has been approved.`,
        type: 'success',
        userId: admission.studentId,
      });
    }
  };

  const handleReject = (a: Admission) => {
    updateAdmission({ ...a, status: 'rejected' });
    addAuditLog({ action: 'Rejected admission', module: 'Admissions', userId: user!.id, userName: user!.name, details: `Rejected ${a.applicantName}` });
    if (a.studentId) {
      notify({
        title: 'Admission update',
        message: 'Your admission application was rejected. Please contact the admin office for details.',
        type: 'error',
        userId: a.studentId,
      });
    }
  };

  const handleVerify = (a: Admission) => {
    updateAdmission({ ...a, status: 'verified' });
    if (a.studentId) {
      notify({
        title: 'Admission update',
        message: 'Your admission documents were verified.',
        type: 'info',
        userId: a.studentId,
      });
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved': case 'enrolled': return 'badge-success';
      case 'verified': return 'badge-info';
      case 'rejected': return 'badge-destructive';
      default: return 'badge-warning';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="module-header">Admissions</h1>
          <p className="text-muted-foreground text-sm">{admissions.length} applications</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />New Application</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search applications..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead className="hidden md:table-cell">Course</TableHead>
                  <TableHead className="hidden md:table-cell">Applied Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div><p className="font-medium text-sm">{a.applicantName}</p><p className="text-xs text-muted-foreground">{a.email}</p></div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{a.course}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{a.appliedDate}</TableCell>
                    <TableCell><span className={statusBadge(a.status)}>{a.status}</span></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewItem(a)}><Eye className="w-4 h-4" /></Button>
                        {a.status === 'applied' && (
                          <Button variant="ghost" size="icon" onClick={() => handleVerify(a)} title="Verify"><CheckCircle className="w-4 h-4 text-info" /></Button>
                        )}
                        {(a.status === 'applied' || a.status === 'verified') && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleApprove(a)} title="Approve"><CheckCircle className="w-4 h-4 text-success" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleReject(a)} title="Reject"><XCircle className="w-4 h-4 text-destructive" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Application Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Admission Application</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label>Full Name</Label><Input value={form.applicantName} onChange={e => setForm({ ...form, applicantName: e.target.value })} /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Course</Label>
              <Select value={form.course} onValueChange={v => setForm({ ...form, course: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COURSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1"><Label>Date of Birth</Label><Input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div className="space-y-1"><Label>Guardian Name</Label><Input value={form.guardianName} onChange={e => setForm({ ...form, guardianName: e.target.value })} /></div>
            <div className="space-y-1"><Label>Guardian Phone</Label><Input value={form.guardianPhone} onChange={e => setForm({ ...form, guardianPhone: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Submit Application</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Application Details</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground text-xs">Name</span><p className="font-medium">{viewItem.applicantName}</p></div>
                <div><span className="text-muted-foreground text-xs">Email</span><p>{viewItem.email}</p></div>
                <div><span className="text-muted-foreground text-xs">Phone</span><p>{viewItem.phone}</p></div>
                <div><span className="text-muted-foreground text-xs">Course</span><p>{viewItem.course}</p></div>
                <div><span className="text-muted-foreground text-xs">Status</span><p><span className={statusBadge(viewItem.status)}>{viewItem.status}</span></p></div>
                <div><span className="text-muted-foreground text-xs">Applied</span><p>{viewItem.appliedDate}</p></div>
              </div>
              {viewItem.notes && <div><span className="text-muted-foreground text-xs">Notes</span><p>{viewItem.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
