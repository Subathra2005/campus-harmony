import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Book, BookIssue } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Search, Plus, RotateCcw, BookMarked } from 'lucide-react';

export default function LibraryPage() {
  const { books, bookIssues, students, addBook, updateBook, addBookIssue, updateBookIssue, addAuditLog } = useData();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [addBookDialog, setAddBookDialog] = useState(false);
  const [issueDialog, setIssueDialog] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '', category: '', totalCopies: '1', shelf: '' });
  const [issueForm, setIssueForm] = useState({ bookId: '', studentId: '' });

  const isStudent = user?.role === 'student';
  const totalBooks = books.reduce((s, b) => s + b.totalCopies, 0);
  const issuedCount = bookIssues.filter(bi => bi.status === 'issued' || bi.status === 'overdue').length;
  const overdueCount = bookIssues.filter(bi => bi.status === 'overdue').length;

  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase()));

  const handleAddBook = () => {
    const book: Book = { id: crypto.randomUUID(), ...newBook, totalCopies: Number(newBook.totalCopies), availableCopies: Number(newBook.totalCopies) };
    addBook(book);
    setAddBookDialog(false);
    setNewBook({ title: '', author: '', isbn: '', category: '', totalCopies: '1', shelf: '' });
  };

  const handleIssue = () => {
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
    setIssueDialog(false);
    setIssueForm({ bookId: '', studentId: '' });
  };

  const handleReturn = (issue: BookIssue) => {
    updateBookIssue({ ...issue, status: 'returned', returnDate: new Date().toISOString().split('T')[0] });
    const book = books.find(b => b.id === issue.bookId);
    if (book) updateBook({ ...book, availableCopies: book.availableCopies + 1 });
    addAuditLog({ action: 'Book returned', module: 'Library', userId: user!.id, userName: user!.name, details: `${issue.bookTitle} by ${issue.studentName}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div><h1 className="module-header">Library</h1><p className="text-muted-foreground text-sm">{books.length} titles in catalog</p></div>
        {!isStudent && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIssueDialog(true)}><BookMarked className="w-4 h-4 mr-2" />Issue Book</Button>
            <Button onClick={() => setAddBookDialog(true)}><Plus className="w-4 h-4 mr-2" />Add Book</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Total Books</span><BookOpen className="w-4 h-4 text-primary" /></div><p className="text-xl font-bold">{totalBooks}</p></div>
        <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Issued</span><BookMarked className="w-4 h-4 text-info" /></div><p className="text-xl font-bold">{issuedCount}</p></div>
        <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Overdue</span><BookOpen className="w-4 h-4 text-destructive" /></div><p className="text-xl font-bold">{overdueCount}</p></div>
      </div>

      <Tabs defaultValue="catalog">
        <TabsList><TabsTrigger value="catalog">Catalog</TabsTrigger><TabsTrigger value="issued">Issued Books</TabsTrigger></TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Search books..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Card><CardContent className="p-0"><div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Title</TableHead><TableHead className="hidden md:table-cell">Author</TableHead><TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Available</TableHead><TableHead className="hidden lg:table-cell">Shelf</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredBooks.map(b => (
                  <TableRow key={b.id}>
                    <TableCell><div><p className="font-medium text-sm">{b.title}</p><p className="text-xs text-muted-foreground md:hidden">{b.author}</p></div></TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{b.author}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{b.category}</TableCell>
                    <TableCell><span className={b.availableCopies > 0 ? 'badge-success' : 'badge-destructive'}>{b.availableCopies}/{b.totalCopies}</span></TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{b.shelf}</TableCell>
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
                <TableHead>Due Date</TableHead><TableHead>Status</TableHead>{!isStudent && <TableHead className="text-right">Action</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {bookIssues.map(bi => (
                  <TableRow key={bi.id}>
                    <TableCell className="font-medium text-sm">{bi.bookTitle}</TableCell>
                    <TableCell className="text-sm">{bi.studentName}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{bi.issueDate}</TableCell>
                    <TableCell className="text-sm">{bi.dueDate}</TableCell>
                    <TableCell><span className={bi.status === 'returned' ? 'badge-success' : bi.status === 'overdue' ? 'badge-destructive' : 'badge-info'}>{bi.status}</span></TableCell>
                    {!isStudent && (
                      <TableCell className="text-right">
                        {bi.status !== 'returned' && <Button variant="ghost" size="sm" onClick={() => handleReturn(bi)}><RotateCcw className="w-3 h-3 mr-1" />Return</Button>}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div></CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={addBookDialog} onOpenChange={setAddBookDialog}>
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

      <Dialog open={issueDialog} onOpenChange={setIssueDialog}>
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
