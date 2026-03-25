import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { HostelRoom } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, Users, Wrench, Plus, UserPlus } from 'lucide-react';

export default function HostelPage() {
  const { hostelRooms, students, addHostelRoom, updateHostelRoom, updateStudent, addAuditLog } = useData();
  const { user } = useAuth();
  const [addDialog, setAddDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState<HostelRoom | null>(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [newRoom, setNewRoom] = useState({ roomNumber: '', block: 'A', floor: '1', capacity: '2', type: 'double' as const, monthlyRent: '5000' });

  const isStudent = user?.role === 'student';
  const available = hostelRooms.filter(r => r.status === 'available').length;
  const occupied = hostelRooms.filter(r => r.status === 'occupied').length;
  const maintenance = hostelRooms.filter(r => r.status === 'maintenance').length;
  const totalOccupants = hostelRooms.reduce((s, r) => s + r.occupants.length, 0);

  const unassignedStudents = students.filter(s => !s.hostelRoomId && s.status === 'active');

  const handleAddRoom = () => {
    const room: HostelRoom = {
      id: crypto.randomUUID(), roomNumber: newRoom.roomNumber, block: newRoom.block,
      floor: Number(newRoom.floor), capacity: Number(newRoom.capacity), occupants: [],
      type: newRoom.type as any, status: 'available', monthlyRent: Number(newRoom.monthlyRent),
    };
    addHostelRoom(room);
    setAddDialog(false);
  };

  const handleAssign = () => {
    if (!assignDialog || !selectedStudent) return;
    const room = { ...assignDialog, occupants: [...assignDialog.occupants, selectedStudent], status: 'occupied' as const };
    updateHostelRoom(room);
    const student = students.find(s => s.id === selectedStudent);
    if (student) updateStudent({ ...student, hostelRoomId: assignDialog.id });
    addAuditLog({ action: 'Room assigned', module: 'Hostel', userId: user!.id, userName: user!.name, details: `${student?.name} → ${assignDialog.roomNumber}` });
    setAssignDialog(null);
    setSelectedStudent('');
  };

  const statusColor = (status: string) => {
    switch (status) { case 'available': return 'border-success/30 bg-success/5'; case 'occupied': return 'border-primary/30 bg-primary/5'; default: return 'border-warning/30 bg-warning/5'; }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div><h1 className="module-header">Hostel Management</h1><p className="text-muted-foreground text-sm">{hostelRooms.length} rooms</p></div>
        {!isStudent && <Button onClick={() => setAddDialog(true)}><Plus className="w-4 h-4 mr-2" />Add Room</Button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Total Rooms</span><Building2 className="w-4 h-4 text-primary" /></div><p className="text-xl font-bold">{hostelRooms.length}</p></div>
        <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Available</span><Building2 className="w-4 h-4 text-success" /></div><p className="text-xl font-bold">{available}</p></div>
        <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Occupied</span><Users className="w-4 h-4 text-info" /></div><p className="text-xl font-bold">{occupied}</p></div>
        <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Maintenance</span><Wrench className="w-4 h-4 text-warning" /></div><p className="text-xl font-bold">{maintenance}</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {hostelRooms.map(room => (
          <Card key={room.id} className={`border-2 ${statusColor(room.status)}`}>
            <CardContent className="pt-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{room.roomNumber}</h3>
                  <p className="text-xs text-muted-foreground">Block {room.block} • Floor {room.floor}</p>
                </div>
                <span className={room.status === 'available' ? 'badge-success' : room.status === 'occupied' ? 'badge-info' : 'badge-warning'}>{room.status}</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{room.type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Capacity</span><span>{room.occupants.length}/{room.capacity}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Rent</span><span>₹{room.monthlyRent}/mo</span></div>
              </div>
              {room.occupants.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Occupants:</p>
                  {room.occupants.map(sid => {
                    const s = students.find(st => st.id === sid);
                    return <p key={sid} className="text-xs font-medium">{s?.name || sid}</p>;
                  })}
                </div>
              )}
              {!isStudent && room.status !== 'maintenance' && room.occupants.length < room.capacity && (
                <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => { setAssignDialog(room); setSelectedStudent(''); }}>
                  <UserPlus className="w-3 h-3 mr-1" />Assign Student
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Room</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Room Number</Label><Input value={newRoom.roomNumber} onChange={e => setNewRoom({ ...newRoom, roomNumber: e.target.value })} placeholder="A-101" /></div>
            <div className="space-y-1"><Label>Block</Label><Input value={newRoom.block} onChange={e => setNewRoom({ ...newRoom, block: e.target.value })} /></div>
            <div className="space-y-1"><Label>Floor</Label><Input type="number" value={newRoom.floor} onChange={e => setNewRoom({ ...newRoom, floor: e.target.value })} /></div>
            <div className="space-y-1"><Label>Capacity</Label><Input type="number" value={newRoom.capacity} onChange={e => setNewRoom({ ...newRoom, capacity: e.target.value })} /></div>
            <div className="space-y-1"><Label>Type</Label><Select value={newRoom.type} onValueChange={v => setNewRoom({ ...newRoom, type: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="single">Single</SelectItem><SelectItem value="double">Double</SelectItem><SelectItem value="triple">Triple</SelectItem></SelectContent></Select></div>
            <div className="space-y-1"><Label>Monthly Rent</Label><Input type="number" value={newRoom.monthlyRent} onChange={e => setNewRoom({ ...newRoom, monthlyRent: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button><Button onClick={handleAddRoom}>Add Room</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Student to {assignDialog?.roomNumber}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>{unassignedStudents.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.studentId})</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setAssignDialog(null)}>Cancel</Button><Button onClick={handleAssign}>Assign</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
