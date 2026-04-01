import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { HostelRoom, HostelRequest, Notification, UserRole } from '@/types';
import HostelBulkUpload from '@/components/HostelBulkUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, Users, Wrench, Plus, UserPlus, Send, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function HostelPage() {
  const {
    hostelRooms,
    hostelRequests,
    students,
    addHostelRoom,
    updateHostelRoom,
    deleteHostelRoom,
    updateStudent,
    addHostelRequest,
    updateHostelRequest,
    addAuditLog,
    addNotification,
  } = useData();
  const { user } = useAuth();
  const [addDialog, setAddDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState<HostelRoom | null>(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [requestRoom, setRequestRoom] = useState<HostelRoom | null>(null);
  const [newRoom, setNewRoom] = useState({ roomNumber: '', block: 'A', floor: '1', capacity: '2', type: 'double' as const, monthlyRent: '5000' });
  const [editRoom, setEditRoom] = useState<HostelRoom | null>(null);
  const [editRoomForm, setEditRoomForm] = useState<{ roomNumber: string; block: string; floor: string; capacity: string; type: HostelRoom['type']; monthlyRent: string; status: HostelRoom['status']; }>(
    { roomNumber: '', block: 'A', floor: '1', capacity: '2', type: 'double', monthlyRent: '5000', status: 'available' }
  );
  const [roomToDelete, setRoomToDelete] = useState<HostelRoom | null>(null);
  const { toast } = useToast();
  const notify = (payload: { title: string; message: string; type: Notification['type']; userId?: string; targetRole?: UserRole }) => {
    addNotification({ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], read: false, ...payload });
  };

  const derivedStatus = (room: HostelRoom) => {
    if (room.status === 'maintenance') return 'maintenance';
    return room.occupants.length >= room.capacity ? 'occupied' : 'available';
  };

  const findStudentById = (id: string) => students.find(s => s.id === id);

  const isGenderCompatible = (room: HostelRoom, studentId: string) => {
    const student = findStudentById(studentId);
    if (!student) return true;
    const occupantGenders = room.occupants
      .map(id => findStudentById(id)?.gender)
      .filter((gender): gender is string => Boolean(gender));
    return occupantGenders.every(gender => gender === student.gender);
  };

  const canAssignToRoom = (room: HostelRoom, studentId: string) =>
    room.status !== 'maintenance' && derivedStatus(room) === 'available' && isGenderCompatible(room, studentId);

  const isStudent = user?.role === 'student';
  const isHostelStaff = user?.role === 'staff-hostel';
  const available = hostelRooms.filter(r => derivedStatus(r) === 'available').length;
  const occupied = hostelRooms.filter(r => derivedStatus(r) === 'occupied').length;
  const maintenance = hostelRooms.filter(r => derivedStatus(r) === 'maintenance').length;
  const studentProfile = isStudent ? students.find(s => s.email === user?.email) : null;
  const myRoom = studentProfile?.hostelRoomId ? hostelRooms.find(r => r.id === studentProfile.hostelRoomId) : null;
  const myPendingRequest = studentProfile ? hostelRequests.find(r => r.studentId === studentProfile.id && r.status === 'pending') : null;
  const pendingRequests = hostelRequests.filter(r => r.status === 'pending');

  const canAccessHostel = !isStudent || studentProfile?.residencyStatus === 'hosteller';
  const unassignedStudents = students.filter(s => s.residencyStatus === 'hosteller' && !s.hostelRoomId && s.status === 'active');

  const handleAddRoom = () => {
    if (!isHostelStaff) {
      toast({ title: 'Action restricted', description: 'Only the hostel warden can manage rooms.', variant: 'destructive' });
      return;
    }
    const room: HostelRoom = {
      id: crypto.randomUUID(), roomNumber: newRoom.roomNumber, block: newRoom.block,
      floor: Number(newRoom.floor), capacity: Number(newRoom.capacity), occupants: [],
      type: newRoom.type as any, status: 'available', monthlyRent: Number(newRoom.monthlyRent),
    };
    addHostelRoom(room);
    setAddDialog(false);
  };

  const startEditRoom = (room: HostelRoom) => {
    setEditRoom(room);
    setEditRoomForm({
      roomNumber: room.roomNumber,
      block: room.block,
      floor: String(room.floor),
      capacity: String(room.capacity),
      type: room.type,
      monthlyRent: String(room.monthlyRent),
      status: room.status,
    });
  };

  const handleUpdateRoom = () => {
    if (!isHostelStaff || !editRoom) {
      toast({ title: 'Action restricted', description: 'Only the hostel warden can manage rooms.', variant: 'destructive' });
      return;
    }
    const floor = Number(editRoomForm.floor);
    const capacity = Number(editRoomForm.capacity);
    const monthlyRent = Number(editRoomForm.monthlyRent);
    if (!Number.isFinite(capacity) || capacity <= 0) {
      toast({ title: 'Invalid capacity', description: 'Capacity must be at least 1.', variant: 'destructive' });
      return;
    }
    if (editRoom.occupants.length > capacity) {
      toast({ title: 'Cannot reduce capacity', description: 'Capacity cannot be lower than the current occupant count.', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(floor)) {
      toast({ title: 'Invalid floor', description: 'Floor should be a valid number.', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(monthlyRent) || monthlyRent < 0) {
      toast({ title: 'Invalid rent', description: 'Monthly rent must be zero or greater.', variant: 'destructive' });
      return;
    }
    const updated: HostelRoom = {
      ...editRoom,
      roomNumber: editRoomForm.roomNumber.trim(),
      block: editRoomForm.block.trim(),
      floor,
      capacity,
      type: editRoomForm.type,
      monthlyRent,
      status: editRoomForm.status,
    };
    updateHostelRoom(updated);
    addAuditLog({ action: 'Hostel room updated', module: 'Hostel', userId: user!.id, userName: user!.name, details: updated.roomNumber });
    toast({ title: 'Room updated', description: `${updated.roomNumber} was updated successfully.` });
    setEditRoom(null);
  };

  const requestDeleteRoom = (room: HostelRoom) => {
    if (!isHostelStaff) {
      toast({ title: 'Action restricted', description: 'Only the hostel warden can manage rooms.', variant: 'destructive' });
      return;
    }
    if (room.occupants.length > 0) {
      toast({ title: 'Cannot delete room', description: 'Unassign all occupants before deleting this room.', variant: 'destructive' });
      return;
    }
    const pendingRequestsForRoom = hostelRequests.some(request => request.roomId === room.id && request.status === 'pending');
    if (pendingRequestsForRoom) {
      toast({ title: 'Pending requests exist', description: 'Resolve pending requests tied to this room before deleting it.', variant: 'destructive' });
      return;
    }
    setRoomToDelete(room);
  };

  const handleConfirmDeleteRoom = () => {
    if (!roomToDelete || !isHostelStaff) return;
    deleteHostelRoom(roomToDelete.id);
    addAuditLog({ action: 'Hostel room deleted', module: 'Hostel', userId: user!.id, userName: user!.name, details: roomToDelete.roomNumber });
    toast({ title: 'Room deleted', description: `${roomToDelete.roomNumber} has been removed.` });
    setRoomToDelete(null);
  };

  const handleAssign = () => {
    if (!isHostelStaff) {
      toast({ title: 'Action restricted', description: 'Only the hostel warden can assign rooms.', variant: 'destructive' });
      return;
    }
    if (!assignDialog || !selectedStudent) return;
    if (!isGenderCompatible(assignDialog, selectedStudent)) {
      toast({ title: 'Cannot assign student', description: 'Room occupants must share the same gender.', variant: 'destructive' });
      return;
    }
    const newOccupants = [...assignDialog.occupants, selectedStudent];
    const room = {
      ...assignDialog,
      occupants: newOccupants,
      status: newOccupants.length >= assignDialog.capacity ? 'occupied' : 'available',
    } as HostelRoom;
    updateHostelRoom(room);
    const student = students.find(s => s.id === selectedStudent);
    if (student) updateStudent({ ...student, hostelRoomId: assignDialog.id });
    addAuditLog({ action: 'Room assigned', module: 'Hostel', userId: user!.id, userName: user!.name, details: `${student?.name} → ${assignDialog.roomNumber}` });
    setAssignDialog(null);
    setSelectedStudent('');
  };

  const handleStudentRequest = () => {
    if (!requestRoom || !studentProfile) return;
    if (studentProfile.residencyStatus !== 'hosteller') {
      toast({ title: 'Hostel access restricted', description: 'Only hostellers can request accommodation.', variant: 'destructive' });
      setRequestRoom(null);
      return;
    }
    if (!isGenderCompatible(requestRoom, studentProfile.id)) {
      toast({ title: 'Room unavailable', description: 'This room currently houses students of another gender.', variant: 'destructive' });
      setRequestRoom(null);
      return;
    }
    const request: HostelRequest = {
      id: crypto.randomUUID(),
      studentId: studentProfile.id,
      studentName: studentProfile.name,
      preferredType: requestRoom.type,
      roomId: requestRoom.id,
      status: 'pending',
      requestedDate: new Date().toISOString().split('T')[0],
    };
    addHostelRequest(request);
    addAuditLog({ action: 'Hostel request', module: 'Hostel', userId: user?.id ?? studentProfile.id, userName: studentProfile.name, details: `Requested ${requestRoom.roomNumber}` });
     notify({
       title: 'New hostel request',
       message: `${studentProfile.name} requested ${requestRoom.roomNumber || requestRoom.type.toUpperCase()} (${requestRoom.type}).`,
       type: 'info',
       targetRole: 'staff-hostel',
     });
    setRequestRoom(null);
  };

  const handleCancelRequest = () => {
    if (!myPendingRequest) return;
    updateHostelRequest({ ...myPendingRequest, status: 'rejected' });
     notify({
       title: 'Hostel request cancelled',
       message: `${studentProfile?.name ?? 'A student'} cancelled their hostel request.`,
       type: 'warning',
       targetRole: 'staff-hostel',
     });
  };

  const handleApproveRequest = (request: HostelRequest) => {
    if (!isHostelStaff) {
      toast({ title: 'Action restricted', description: 'Only the hostel warden can approve requests.', variant: 'destructive' });
      return;
    }
    const currentRoom = request.roomId ? hostelRooms.find(r => r.id === request.roomId) : undefined;
    const primaryRoom = currentRoom && canAssignToRoom(currentRoom, request.studentId) ? currentRoom : undefined;
    const fallbackRoom = hostelRooms.find(r => r.type === request.preferredType && canAssignToRoom(r, request.studentId));
    const room = primaryRoom ?? fallbackRoom;
    if (!room) {
      toast({ title: 'No suitable room', description: 'All rooms of this type are full or incompatible right now.', variant: 'destructive' });
      return;
    }
    const newOccupants = [...room.occupants, request.studentId];
    const updatedRoom: HostelRoom = {
      ...room,
      occupants: newOccupants,
      status: newOccupants.length >= room.capacity ? 'occupied' : 'available',
    };
    updateHostelRoom(updatedRoom);
    const student = students.find(s => s.id === request.studentId);
    if (student) updateStudent({ ...student, hostelRoomId: updatedRoom.id });
    updateHostelRequest({ ...request, status: 'approved', roomId: updatedRoom.id });
    addAuditLog({ action: 'Hostel request approved', module: 'Hostel', userId: user!.id, userName: user!.name, details: `${request.studentName} → ${updatedRoom.roomNumber}` });
    notify({
      title: 'Hostel request approved',
      message: `You have been assigned room ${updatedRoom.roomNumber}.`,
      type: 'success',
      userId: request.studentId,
    });
  };

  const handleRejectRequest = (request: HostelRequest) => {
    if (!isHostelStaff) {
      toast({ title: 'Action restricted', description: 'Only the hostel warden can reject requests.', variant: 'destructive' });
      return;
    }
    updateHostelRequest({ ...request, status: 'rejected' });
    notify({
      title: 'Hostel request update',
      message: 'Your hostel request was rejected. Please contact the warden for details.',
      type: 'error',
      userId: request.studentId,
    });
  };

  const statusColor = (status: string) => {
    switch (status) { case 'available': return 'border-success/30 bg-success/5'; case 'occupied': return 'border-primary/30 bg-primary/5'; default: return 'border-warning/30 bg-warning/5'; }
  };

  const openRequestDialog = (room: HostelRoom) => {
    if (!studentProfile || studentProfile.residencyStatus !== 'hosteller') return;
    if (!isGenderCompatible(room, studentProfile.id)) {
      toast({ title: 'Room unavailable', description: 'This room currently houses students of another gender.', variant: 'destructive' });
      return;
    }
    setRequestRoom(room);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div><h1 className="module-header">Hostel Management</h1><p className="text-muted-foreground text-sm">{hostelRooms.length} rooms</p></div>
        {isHostelStaff && <Button onClick={() => setAddDialog(true)}><Plus className="w-4 h-4 mr-2" />Add Room</Button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Total Rooms</span><Building2 className="w-4 h-4 text-primary" /></div><p className="text-xl font-bold">{hostelRooms.length}</p></div>
        <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Available</span><Building2 className="w-4 h-4 text-success" /></div><p className="text-xl font-bold">{available}</p></div>
        <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Occupied</span><Users className="w-4 h-4 text-info" /></div><p className="text-xl font-bold">{occupied}</p></div>
        <div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase">Maintenance</span><Wrench className="w-4 h-4 text-warning" /></div><p className="text-xl font-bold">{maintenance}</p></div>
      </div>

      {isHostelStaff && <HostelBulkUpload />}

      {isStudent && (
        <Card>
          <CardContent className="space-y-2 text-sm">
            {myRoom ? (
              <div>
                <p className="font-medium">You currently occupy {myRoom.roomNumber}</p>
                <p className="text-muted-foreground">Block {myRoom.block} • Floor {myRoom.floor} • {myRoom.type.toUpperCase()} room</p>
              </div>
            ) : myPendingRequest ? (
              <div className="flex flex-col gap-2">
                <p className="font-medium">Hostel request pending approval.</p>
                <p className="text-muted-foreground">Requested on {myPendingRequest.requestedDate}</p>
                <Button variant="outline" size="sm" onClick={handleCancelRequest}>Cancel Request</Button>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Send className="w-4 h-4 mt-1 text-primary" />
                <div>
                  <p className="font-medium">Choose an available room below to send a request.</p>
                  <p className="text-muted-foreground">The hostel team will confirm once a slot is assigned.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isHostelStaff && (
        <Card>
          <CardHeader><CardTitle className="text-base">Pending Hostel Requests</CardTitle></CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No new requests.</p>
            ) : (
              <div className="space-y-3 text-sm">
                {pendingRequests.map(request => {
                  const room = request.roomId ? hostelRooms.find(r => r.id === request.roomId) : null;
                  return (
                    <div key={request.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <p className="font-medium">{request.studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          Prefers {request.preferredType} • {room ? `Room ${room.roomNumber}` : 'Any available'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleApproveRequest(request)} title="Approve"><CheckCircle className="w-4 h-4 text-success" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleRejectRequest(request)} title="Reject"><XCircle className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {hostelRooms.map(room => {
          const displayStatus = derivedStatus(room);
          const showAssignAction = isHostelStaff && displayStatus === 'available';
          const canStudentRequest = isStudent && studentProfile?.residencyStatus === 'hosteller' && !myRoom && !myPendingRequest && displayStatus === 'available';
          return (
            <Card key={room.id} className={`border-2 ${statusColor(displayStatus)}`}>
            <CardContent className="pt-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{room.roomNumber}</h3>
                  <p className="text-xs text-muted-foreground">Block {room.block} • Floor {room.floor}</p>
                </div>
                <div className="flex items-center gap-1">
                  {isHostelStaff && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => startEditRoom(room)} title="Edit room">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => requestDeleteRoom(room)} title="Delete room">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </>
                  )}
                  <span className={displayStatus === 'available' ? 'badge-success' : displayStatus === 'occupied' ? 'badge-info' : 'badge-warning'}>{displayStatus}</span>
                </div>
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
              {showAssignAction && (
                <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => { setAssignDialog(room); setSelectedStudent(''); }}>
                  <UserPlus className="w-3 h-3 mr-1" />Assign Student
                </Button>
              )}
              {canStudentRequest && (
                <Button size="sm" className="w-full mt-3" onClick={() => openRequestDialog(room)}>
                  <Send className="w-3 h-3 mr-1" />Request This Room
                </Button>
              )}
            </CardContent>
          </Card>
        );
        })}
      </div>

      <Dialog
        open={isHostelStaff && addDialog}
        onOpenChange={open => {
          if (!isHostelStaff) return;
          setAddDialog(open);
        }}
      >
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

      <Dialog
        open={isHostelStaff && !!editRoom}
        onOpenChange={open => {
          if (!isHostelStaff) return;
          if (!open) setEditRoom(null);
        }}
      >
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Room</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Room Number</Label><Input value={editRoomForm.roomNumber} onChange={e => setEditRoomForm({ ...editRoomForm, roomNumber: e.target.value })} /></div>
            <div className="space-y-1"><Label>Block</Label><Input value={editRoomForm.block} onChange={e => setEditRoomForm({ ...editRoomForm, block: e.target.value })} /></div>
            <div className="space-y-1"><Label>Floor</Label><Input type="number" value={editRoomForm.floor} onChange={e => setEditRoomForm({ ...editRoomForm, floor: e.target.value })} /></div>
            <div className="space-y-1"><Label>Capacity</Label><Input type="number" value={editRoomForm.capacity} onChange={e => setEditRoomForm({ ...editRoomForm, capacity: e.target.value })} /></div>
            <div className="space-y-1"><Label>Type</Label><Select value={editRoomForm.type} onValueChange={v => setEditRoomForm({ ...editRoomForm, type: v as HostelRoom['type'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="single">Single</SelectItem><SelectItem value="double">Double</SelectItem><SelectItem value="triple">Triple</SelectItem></SelectContent></Select></div>
            <div className="space-y-1"><Label>Status</Label><Select value={editRoomForm.status} onValueChange={v => setEditRoomForm({ ...editRoomForm, status: v as HostelRoom['status'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="occupied">Occupied</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem></SelectContent></Select></div>
            <div className="space-y-1"><Label>Monthly Rent</Label><Input type="number" value={editRoomForm.monthlyRent} onChange={e => setEditRoomForm({ ...editRoomForm, monthlyRent: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setEditRoom(null)}>Cancel</Button><Button onClick={handleUpdateRoom}>Save changes</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!requestRoom} onOpenChange={() => setRequestRoom(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request {requestRoom?.roomNumber}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p>Block {requestRoom?.block} • Floor {requestRoom?.floor}</p>
            <p>Type: {requestRoom?.type.toUpperCase()} • Rent ₹{requestRoom?.monthlyRent}/mo</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRequestRoom(null)}>Cancel</Button>
              <Button onClick={handleStudentRequest}>Send Request</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isHostelStaff && !!assignDialog}
        onOpenChange={open => {
          if (!isHostelStaff) return;
          if (!open) setAssignDialog(null);
        }}
      >
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

      <AlertDialog open={!!roomToDelete} onOpenChange={open => { if (!open) setRoomToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete hostel room?</AlertDialogTitle>
            <AlertDialogDescription>
              {roomToDelete ? `This will remove ${roomToDelete.roomNumber} from the hostel inventory.` : 'This will remove the selected room.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteRoom} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
