import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Student } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Pencil, Trash2, Download } from 'lucide-react';

const COURSES = ['B.Tech CS', 'B.Tech ECE', 'BBA', 'MBA'];

export default function StudentsPage() {
  const { students, addStudent, updateStudent, deleteStudent, addAuditLog } = useData();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  const emptyStudent: Omit<Student, 'id' | 'studentId'> = {
    name: '', email: '', phone: '', course: 'B.Tech CS', year: 1, semester: 1,
    dob: '', gender: 'Male', address: '', guardianName: '', guardianPhone: '',
    status: 'active', admissionDate: new Date().toISOString().split('T')[0], documents: [],
  };
  const [form, setForm] = useState(emptyStudent);

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchCourse = courseFilter === 'all' || s.course === courseFilter;
    return matchSearch && matchCourse;
  });

  const openAdd = () => { setEditing(null); setForm(emptyStudent); setDialogOpen(true); };
  const openEdit = (s: Student) => { setEditing(s); setForm(s); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.email) return;
    if (editing) {
      updateStudent({ ...editing, ...form });
      addAuditLog({ action: 'Updated student', module: 'Students', userId: user!.id, userName: user!.name, details: `Updated ${form.name}` });
    } else {
      const newStudent: Student = { ...form, id: crypto.randomUUID(), studentId: `STU${Date.now().toString().slice(-6)}` } as Student;
      addStudent(newStudent);
      addAuditLog({ action: 'Added student', module: 'Students', userId: user!.id, userName: user!.name, details: `Added ${form.name}` });
    }
    setDialogOpen(false);
  };

  const handleDelete = (s: Student) => {
    deleteStudent(s.id);
    addAuditLog({ action: 'Deleted student', module: 'Students', userId: user!.id, userName: user!.name, details: `Deleted ${s.name}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="module-header">Students</h1>
          <p className="text-muted-foreground text-sm">{students.length} total students</p>
        </div>
        {user?.role !== 'student' && (
          <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Add Student</Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, ID, or email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by course" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {COURSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Course</TableHead>
                  <TableHead className="hidden md:table-cell">Year</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead>Status</TableHead>
                  {user?.role !== 'student' && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.studentId}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{s.course}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">Year {s.year}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{s.phone}</TableCell>
                    <TableCell>
                      <span className={s.status === 'active' ? 'badge-success' : s.status === 'graduated' ? 'badge-info' : 'badge-warning'}>{s.status}</span>
                    </TableCell>
                    {user?.role !== 'student' && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(s)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No students found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Student' : 'Add Student'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label>Full Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Course</Label>
              <Select value={form.course} onValueChange={v => setForm({ ...form, course: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COURSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Year</Label><Input type="number" min={1} max={4} value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Date of Birth</Label><Input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1"><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div className="space-y-1"><Label>Guardian Name</Label><Input value={form.guardianName} onChange={e => setForm({ ...form, guardianName: e.target.value })} /></div>
            <div className="space-y-1"><Label>Guardian Phone</Label><Input value={form.guardianPhone} onChange={e => setForm({ ...form, guardianPhone: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add'} Student</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
