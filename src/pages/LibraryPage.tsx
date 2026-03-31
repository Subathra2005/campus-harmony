import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Book, BookIssue, Notification, UserRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Search, Plus, RotateCcw, BookMarked, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function LibraryPage() {
  const { books, bookIssues, students, addBook, updateBook, addBookIssue, updateBookIssue, addAuditLog, addNotification } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [addBookDialog, setAddBookDialog] = useState(false);
  const [issueDialog, setIssueDialog] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '', category: '', totalCopies: '1', shelf: '' });
  const [issueForm, setIssueForm] = useState({ bookId: '', studentId: '' });

  const notify = (payload: { title: string; message: string; type: Notification['type']; userId?: string; targetRole?: UserRole }) => {
    addNotification({ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], read: false, ...payload });
  };
  const isStudent = user?.role === 'student';
  const isLibrarian = user?.role === 'staff-library';
  const currentStudent = isStudent ? students.find(s => s.email === user?.email) : null;
  const totalBooks = books.reduce((s, b) => s + b.totalCopies, 0);
  const issuedCount = bookIssues.filter(bi => bi.status === 'issued' || bi.status === 'overdue').length;
  const overdueCount = bookIssues.filter(bi => bi.status === 'overdue').length;
  const pendingIssues = bookIssues.filter(bi => bi.status === 'pending');
  const visibleIssues = isStudent && currentStudent ? bookIssues.filter(bi => bi.studentId === currentStudent.id) : bookIssues;
  const hasProfile = !!currentStudent;
  const pendingCountForBook = (bookId: string) => bookIssues.filter(bi => bi.bookId === bookId && bi.status === 'pending').length;
  const canBorrowBook = (book: Book) => {
    if (!currentStudent || !isStudent) return false;
    const alreadyBorrowed = bookIssues.some(bi => bi.bookId === book.id && bi.studentId === currentStudent.id && bi.status !== 'returned' && bi.status !== 'rejected');
    const effectiveAvailability = book.availableCopies - pendingCountForBook(book.id);
    return effectiveAvailability > 0 && !alreadyBorrowed;
  };

  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase()));
  const statusBadge = (status: BookIssue['status']) => {
    switch (status) {
      case 'returned': return 'badge-success';
      case 'overdue': return 'badge-destructive';
      case 'pending': return 'badge-warning';
      case 'rejected': return 'badge-destructive';
      default: return 'badge-info';
    }
  };

  const handleAddBook = () => {
    if (!isLibrarian) {
      toast({ title: 'Action restricted', description: 'Only the librarian can manage the catalog.', variant: 'destructive' });
      return;
    }
    const book: Book = { id: crypto.randomUUID(), ...newBook, totalCopies: Number(newBook.totalCopies), availableCopies: Number(newBook.totalCopies) };
    addBook(book);
    setAddBookDialog(false);
    setNewBook({ title: '', author: '', isbn: '', category: '', totalCopies: '1', shelf: '' });
  };

  const handleIssue = () => {
    if (!isLibrarian) {
      toast({ title: 'Action restricted', description: 'Only the librarian can issue books.', variant: 'destructive' });
      return;
    }
    const book = books.find(b => b.id === issueForm.bookId);
    const student = students.find(s => s.id === issueForm.studentId);
    if (!book || !student || book.availableCopies <= 0) return;
    const issue: BookIssue = {
      id: crypto.randomUUID(), bookId: book.id, bookTitle: book.title,
      studentId: student.id, studentName: student.name,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'issued', fine: 0,
    };
    addBookIssue(issue);
    updateBook({ ...book, availableCopies: book.availableCopies - 1 });
    addAuditLog({ action: 'Book issued', module: 'Library', userId: user!.id, userName: user!.name, details: `${book.title} → ${student.name}` });
    notify({
      title: 'Library issue update',
      message: `${book.title} has been issued to you.`,
      type: 'success',
      userId: student.id,
    });
    setIssueDialog(false);
    setIssueForm({ bookId: '', studentId: '' });
  };

  const handleReturn = (issue: BookIssue) => {
    if (!['issued', 'overdue'].includes(issue.status)) return;
    updateBookIssue({ ...issue, status: 'returned', returnDate: new Date().toISOString().split('T')[0] });
    const book = books.find(b => b.id === issue.bookId);
    if (book) updateBook({ ...book, availableCopies: book.availableCopies + 1 });
    addAuditLog({ action: 'Book returned', module: 'Library', userId: user!.id, userName: user!.name, details: `${issue.bookTitle} by ${issue.studentName}` });
    notify({
      title: 'Book returned by student',
      message: `${issue.studentName} returned ${issue.bookTitle}.`,
      type: 'info',
      targetRole: 'staff-library',
    });
  };

  const handleStudentBorrow = (bookId: string) => {
    if (!currentStudent) return;
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    const alreadyBorrowed = bookIssues.some(bi => bi.bookId === bookId && bi.studentId === currentStudent.id && bi.status !== 'returned' && bi.status !== 'rejected');
    const effectiveAvailability = book.availableCopies - pendingCountForBook(book.id);
    if (effectiveAvailability <= 0 || alreadyBorrowed) {
      toast({ title: 'Request unavailable', description: 'No copies are currently available for request.', variant: 'destructive' });
      return;
    }
    const issueDate = new Date().toISOString().split('T')[0];
    const issue: BookIssue = {
      id: crypto.randomUUID(),
      bookId: book.id,
      bookTitle: book.title,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      issueDate,
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'pending',
      fine: 0,
    };
    addBookIssue(issue);
    addAuditLog({ action: 'Book request', module: 'Library', userId: user?.id ?? currentStudent.id, userName: currentStudent.name, details: `Requested ${book.title}` });
    toast({ title: 'Request submitted', description: 'The librarian will review your request soon.' });
    notify({
      title: 'Book request pending approval',
      message: `${currentStudent.name} requested ${book.title}.`,
      type: 'info',
      targetRole: 'staff-library',
    });
  };

  const handleApproveBorrow = (issue: BookIssue) => {
    if (!isLibrarian) {
      toast({ title: 'Action restricted', description: 'Only the librarian can approve requests.', variant: 'destructive' });
      return;
    }
    if (issue.status !== 'pending') return;
    const book = books.find(b => b.id === issue.bookId);
    if (!book || book.availableCopies <= 0) {
      toast({ title: 'No copies available', description: 'All copies are currently issued. Please try later.', variant: 'destructive' });
      return;
    }
    const issueDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    updateBookIssue({ ...issue, status: 'issued', issueDate, dueDate });
    updateBook({ ...book, availableCopies: book.availableCopies - 1 });
    addAuditLog({ action: 'Book request approved', module: 'Library', userId: user!.id, userName: user!.name, details: `${issue.bookTitle} → ${issue.studentName}` });
    notify({
      title: 'Library request approved',
      message: `${issue.bookTitle} has been issued to you. Due on ${dueDate}.`,
      type: 'success',
      userId: issue.studentId,
    });
  };

  const handleRejectBorrow = (issue: BookIssue) => {
    if (!isLibrarian) {
      toast({ title: 'Action restricted', description: 'Only the librarian can reject requests.', variant: 'destructive' });
      return;
    }
    if (issue.status !== 'pending') return;
    updateBookIssue({ ...issue, status: 'rejected' });
    addAuditLog({ action: 'Book request rejected', module: 'Library', userId: user!.id, userName: user!.name, details: `${issue.bookTitle} - ${issue.studentName}` });
    notify({
      title: 'Library request update',
      message: `Your request for ${issue.bookTitle} was rejected. Please contact the librarian for details.`,
      type: 'error',
      userId: issue.studentId,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div><h1 className="module-header">Library</h1><p className="text-muted-foreground text-sm">{books.length} titles in catalog</p></div>
        {isLibrarian && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIssueDialog(true)}><BookMarked className="w-4 h-4 mr-2" />Issue Book</Button>
            <Button onClick={() => setAddBookDialog(true)}><Plus className="w-4 h-4 mr-2" />Add Book</Button>
          </div>
        )}
      </div>

        {isStudent && !hasProfile && (
          <Card>
            <CardContent className="text-sm text-muted-foreground">
              Library access will unlock once your admission is approved.
            </CardContent>
          </Card>
        )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Total Books</span><BookOpen className="w-4 h-4 text-primary" /></div><p className="text-xl font-bold">{totalBooks}</p></div>
        <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Issued</span><BookMarked className="w-4 h-4 text-info" /></div><p className="text-xl font-bold">{issuedCount}</p></div>
        <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Overdue</span><BookOpen className="w-4 h-4 text-destructive" /></div><p className="text-xl font-bold">{overdueCount}</p></div>
      </div>

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="issued">Issued Books</TabsTrigger>
          {isLibrarian && <TabsTrigger value="requests">Requests</TabsTrigger>}
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Search books..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Card><CardContent className="p-0"><div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Title</TableHead><TableHead className="hidden md:table-cell">Author</TableHead><TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Available</TableHead><TableHead className="hidden lg:table-cell">Shelf</TableHead>
                {isStudent && hasProfile && <TableHead className="text-right">Action</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {filteredBooks.map(b => (
                  <TableRow key={b.id}>
                    <TableCell><div><p className="font-medium text-sm">{b.title}</p><p className="text-xs text-muted-foreground md:hidden">{b.author}</p></div></TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{b.author}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{b.category}</TableCell>
                    <TableCell><span className={b.availableCopies > 0 ? 'badge-success' : 'badge-destructive'}>{b.availableCopies}/{b.totalCopies}</span></TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{b.shelf}</TableCell>
                    {isStudent && hasProfile && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" disabled={!canBorrowBook(b)} onClick={() => handleStudentBorrow(b.id)}>
                          Borrow
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div></CardContent></Card>
        </TabsContent>

        <TabsContent value="issued">
          <Card><CardContent className="p-0"><div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Book</TableHead><TableHead>Student</TableHead><TableHead className="hidden md:table-cell">Issue Date</TableHead>
                <TableHead>Due Date</TableHead><TableHead>Status</TableHead>{isStudent && hasProfile && <TableHead className="text-right">Action</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {visibleIssues.map(bi => (
                  <TableRow key={bi.id}>
                    <TableCell className="font-medium text-sm">{bi.bookTitle}</TableCell>
                    <TableCell className="text-sm">{bi.studentName}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{bi.issueDate}</TableCell>
                    <TableCell className="text-sm">{bi.dueDate}</TableCell>
                    <TableCell><span className={statusBadge(bi.status)}>{bi.status}</span></TableCell>
                    {isStudent && hasProfile && (
                      <TableCell className="text-right">
                        {bi.studentId === currentStudent?.id && (
                          <>
                            {['issued', 'overdue'].includes(bi.status) && (
                              <Button variant="ghost" size="sm" onClick={() => handleReturn(bi)}>
                                <RotateCcw className="w-3 h-3 mr-1" />Return
                              </Button>
                            )}
                            {bi.status === 'pending' && <span className="text-xs text-muted-foreground">Awaiting approval</span>}
                            {bi.status === 'rejected' && <span className="text-xs text-destructive">Request rejected</span>}
                          </>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div></CardContent></Card>
        </TabsContent>

        {isLibrarian && (
          <TabsContent value="requests">
            <Card>
              <CardHeader><CardTitle className="text-base">Pending Requests</CardTitle></CardHeader>
              <CardContent className="p-0">
                {pendingIssues.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-6">No pending requests right now.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Book</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Requested On</TableHead>
                          <TableHead>Planned Due</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingIssues.map(request => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium text-sm">{request.bookTitle}</TableCell>
                            <TableCell className="text-sm">{request.studentName}</TableCell>
                            <TableCell className="text-sm">{request.issueDate}</TableCell>
                            <TableCell className="text-sm">{request.dueDate}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleApproveBorrow(request)} title="Approve">
                                  <CheckCircle className="w-4 h-4 text-success" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleRejectBorrow(request)} title="Reject">
                                  <XCircle className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog
        open={isLibrarian && addBookDialog}
        onOpenChange={open => {
          if (!isLibrarian) return;
          setAddBookDialog(open);
        }}
      >
        <DialogContent>
          <DialogHeader><DialogTitle>Add Book</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label>Title</Label><Input value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} /></div>
            <div className="space-y-1"><Label>Author</Label><Input value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} /></div>
            <div className="space-y-1"><Label>ISBN</Label><Input value={newBook.isbn} onChange={e => setNewBook({ ...newBook, isbn: e.target.value })} /></div>
            <div className="space-y-1"><Label>Category</Label><Input value={newBook.category} onChange={e => setNewBook({ ...newBook, category: e.target.value })} /></div>
            <div className="space-y-1"><Label>Copies</Label><Input type="number" value={newBook.totalCopies} onChange={e => setNewBook({ ...newBook, totalCopies: e.target.value })} /></div>
            <div className="space-y-1"><Label>Shelf</Label><Input value={newBook.shelf} onChange={e => setNewBook({ ...newBook, shelf: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setAddBookDialog(false)}>Cancel</Button><Button onClick={handleAddBook}>Add Book</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isLibrarian && issueDialog}
        onOpenChange={open => {
          if (!isLibrarian) return;
          setIssueDialog(open);
        }}
      >
        <DialogContent>
          <DialogHeader><DialogTitle>Issue Book</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Book</Label><Select value={issueForm.bookId} onValueChange={v => setIssueForm({ ...issueForm, bookId: v })}><SelectTrigger><SelectValue placeholder="Select book" /></SelectTrigger><SelectContent>{books.filter(b => b.availableCopies > 0).map(b => <SelectItem key={b.id} value={b.id}>{b.title} ({b.availableCopies} available)</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Student</Label><Select value={issueForm.studentId} onValueChange={v => setIssueForm({ ...issueForm, studentId: v })}><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger><SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.studentId})</SelectItem>)}</SelectContent></Select></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setIssueDialog(false)}>Cancel</Button><Button onClick={handleIssue}>Issue Book</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
