import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { FeePayment, Notification, UserRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Search, CreditCard, Download, Plus } from 'lucide-react';

export default function FeesPage() {
  const { feePayments, feeStructures, students, addFeePayment, updateFeePayment, addAuditLog, addNotification } = useData();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payDialog, setPayDialog] = useState<FeePayment | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [addDialog, setAddDialog] = useState(false);
  const [newFee, setNewFee] = useState({ studentId: '', amount: '', dueDate: '', installmentNo: '1' });

  const notify = (payload: { title: string; message: string; type: Notification['type']; userId?: string; targetRole?: UserRole }) => {
    addNotification({ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], read: false, ...payload });
  };

  const isStudent = user?.role === 'student';
  const studentProfile = isStudent ? students.find(s => s.email === user?.email) : null;
  const visibleFees = isStudent
    ? (studentProfile ? feePayments.filter(f => f.studentId === studentProfile.id) : [])
    : feePayments;

  const filtered = visibleFees.filter(f => {
    const matchSearch = f.studentName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCollected = feePayments.reduce((s, f) => s + f.paidAmount, 0);
  const totalPending = feePayments.filter(f => f.status !== 'paid').reduce((s, f) => s + (f.amount - f.paidAmount), 0);
  const overdueTotal = feePayments.filter(f => f.status === 'overdue').reduce((s, f) => s + (f.amount - f.paidAmount), 0);
  const studentPendingTotal = visibleFees.filter(f => f.status !== 'paid').reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0);
  const studentOverdueTotal = visibleFees.filter(f => f.status === 'overdue').reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0);
  const studentInstallmentsDue = visibleFees.filter(f => f.status !== 'paid').length;

  const handlePay = () => {
    if (!payDialog || !payAmount) return;
    const amount = Number(payAmount);
    const newPaid = payDialog.paidAmount + amount;
    const updated: FeePayment = {
      ...payDialog,
      paidAmount: newPaid,
      status: newPaid >= payDialog.amount ? 'paid' : 'partial',
      paidDate: new Date().toISOString().split('T')[0],
      receiptNo: `RCP${Date.now().toString().slice(-6)}`,
      method: 'Online',
    };
    updateFeePayment(updated);
    addAuditLog({ action: 'Fee payment', module: 'Fees', userId: user!.id, userName: user!.name, details: `₹${amount} paid for ${payDialog.studentName}` });
    notify({
      title: 'Fee payment received',
      message: `${payDialog.studentName} paid ₹${amount.toLocaleString()}.`,
      type: 'info',
      targetRole: 'staff-accounts',
    });
    setPayDialog(null);
    setPayAmount('');
  };

  const handleAddFee = () => {
    const student = students.find(s => s.id === newFee.studentId);
    if (!student || !newFee.amount) return;
    const fee: FeePayment = {
      id: crypto.randomUUID(), studentId: student.id, studentName: student.name,
      amount: Number(newFee.amount), paidAmount: 0, dueDate: newFee.dueDate,
      status: 'pending', installmentNo: Number(newFee.installmentNo),
    };
    addFeePayment(fee);
    notify({
      title: 'New fee installment',
      message: `Installment ${fee.installmentNo} for ₹${fee.amount.toLocaleString()} is due on ${fee.dueDate}.`,
      type: 'warning',
      userId: student.id,
    });
    setAddDialog(false);
    setNewFee({ studentId: '', amount: '', dueDate: '', installmentNo: '1' });
  };

  const handleDownloadReceipt = (fee: FeePayment) => {
    if (!fee.receiptNo) return;
    const paidDate = fee.paidDate || new Date().toISOString().split('T')[0];
    const content = [
      'EduManager College ERP Receipt',
      '------------------------------',
      `Receipt No: ${fee.receiptNo}`,
      `Student: ${fee.studentName}`,
      `Installment: ${fee.installmentNo}`,
      `Total Amount: ₹${fee.amount.toLocaleString()}`,
      `Paid Amount: ₹${fee.paidAmount.toLocaleString()}`,
      `Status: ${fee.status.toUpperCase()}`,
      `Payment Date: ${paidDate}`,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = fee.studentName.replace(/\s+/g, '-').toLowerCase();
    link.download = `${fee.receiptNo}-${safeName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="module-header">Fee Management</h1>
          <p className="text-muted-foreground text-sm">{feePayments.length} payment records</p>
        </div>
        {!isStudent && <Button onClick={() => setAddDialog(true)}><Plus className="w-4 h-4 mr-2" />Add Fee</Button>}
      </div>

        {isStudent && !studentProfile && (
          <Card>
            <CardContent className="text-sm text-muted-foreground">
              Your admission is pending approval. Once the admin confirms your enrollment, your personalized fee schedule
              will appear here for payment.
            </CardContent>
          </Card>
        )}

      {!isStudent && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Collected</span><DollarSign className="w-4 h-4 text-success" /></div>
            <p className="text-xl font-bold">₹{totalCollected.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Pending</span><DollarSign className="w-4 h-4 text-warning" /></div>
            <p className="text-xl font-bold">₹{totalPending.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Overdue</span><DollarSign className="w-4 h-4 text-destructive" /></div>
            <p className="text-xl font-bold">₹{overdueTotal.toLocaleString()}</p>
          </div>
        </div>
      )}

      {isStudent && studentProfile && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Pending Amount</span><DollarSign className="w-4 h-4 text-warning" /></div>
            <p className="text-xl font-bold">₹{studentPendingTotal.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Installments Due</span><DollarSign className="w-4 h-4 text-info" /></div>
            <p className="text-xl font-bold">{studentInstallmentsDue}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Overdue</span><DollarSign className="w-4 h-4 text-destructive" /></div>
            <p className="text-xl font-bold">₹{studentOverdueTotal.toLocaleString()}</p>
          </div>
        </div>
      )}

      {!isStudent && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Search student..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="all">All Status</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="overdue">Overdue</SelectItem><SelectItem value="partial">Partial</SelectItem>
          </SelectContent></Select>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Student</TableHead><TableHead>Amount</TableHead><TableHead className="hidden md:table-cell">Paid</TableHead>
                <TableHead className="hidden md:table-cell">Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map(f => (
                  <TableRow key={f.id}>
                    <TableCell><div><p className="font-medium text-sm">{f.studentName}</p><p className="text-xs text-muted-foreground">Installment {f.installmentNo}</p></div></TableCell>
                    <TableCell className="font-medium text-sm">₹{f.amount.toLocaleString()}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">₹{f.paidAmount.toLocaleString()}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{f.dueDate}</TableCell>
                    <TableCell><span className={f.status === 'paid' ? 'badge-success' : f.status === 'overdue' ? 'badge-destructive' : f.status === 'partial' ? 'badge-info' : 'badge-warning'}>{f.status}</span></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {isStudent && studentProfile && f.studentId === studentProfile.id && f.status !== 'paid' && (
                          <Button variant="ghost" size="sm" onClick={() => { setPayDialog(f); setPayAmount(String(f.amount - f.paidAmount)); }}>
                            <CreditCard className="w-4 h-4 mr-1" />Pay
                          </Button>
                        )}
                        {f.receiptNo && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Download Receipt"
                            onClick={() => handleDownloadReceipt(f)}
                            aria-label={`Download receipt ${f.receiptNo}`}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                      {isStudent ? 'No fee schedule available yet.' : 'No fee records found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Fee Structure */}
      <Card>
        <CardHeader><CardTitle className="text-base">Fee Structure</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feeStructures.map(fs => (
              <div key={fs.id} className="p-4 rounded-lg border border-border/50">
                <h3 className="font-medium mb-2">{fs.course}</h3>
                <p className="text-lg font-bold mb-2">₹{fs.totalAmount.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">({fs.installments} installments)</span></p>
                <div className="space-y-1">
                  {fs.components.map((c, i) => (
                    <div key={i} className="flex justify-between text-xs text-muted-foreground"><span>{c.name}</span><span>₹{c.amount.toLocaleString()}</span></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pay Dialog */}
      <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Make Payment</DialogTitle></DialogHeader>
          {payDialog && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Student:</span> {payDialog.studentName}</p>
                <p><span className="text-muted-foreground">Total:</span> ₹{payDialog.amount.toLocaleString()}</p>
                <p><span className="text-muted-foreground">Balance:</span> ₹{(payDialog.amount - payDialog.paidAmount).toLocaleString()}</p>
              </div>
              <div className="space-y-1"><Label>Payment Amount</Label><Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPayDialog(null)}>Cancel</Button>
                <Button onClick={handlePay}><CreditCard className="w-4 h-4 mr-2" />Pay Now</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Fee Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Fee Record</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Student</Label>
              <Select value={newFee.studentId} onValueChange={v => setNewFee({ ...newFee, studentId: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.studentId})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Amount</Label><Input type="number" value={newFee.amount} onChange={e => setNewFee({ ...newFee, amount: e.target.value })} /></div>
            <div className="space-y-1"><Label>Due Date</Label><Input type="date" value={newFee.dueDate} onChange={e => setNewFee({ ...newFee, dueDate: e.target.value })} /></div>
            <div className="space-y-1"><Label>Installment No.</Label><Input type="number" value={newFee.installmentNo} onChange={e => setNewFee({ ...newFee, installmentNo: e.target.value })} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
              <Button onClick={handleAddFee}>Add Fee</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
