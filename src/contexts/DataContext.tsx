import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Student, Admission, FeePayment, FeeStructure, HostelRoom, Book, BookIssue, Notification, AuditLog, HostelRequest } from '@/types';
import { seedData } from '@/lib/seedData';

interface DataContextType {
  students: Student[];
  admissions: Admission[];
  feePayments: FeePayment[];
  feeStructures: FeeStructure[];
  hostelRooms: HostelRoom[];
  hostelRequests: HostelRequest[];
  books: Book[];
  bookIssues: BookIssue[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  addStudent: (s: Student) => void;
  updateStudent: (s: Student) => void;
  deleteStudent: (id: string) => void;
  addAdmission: (a: Admission) => void;
  updateAdmission: (a: Admission) => void;
  addFeePayment: (f: FeePayment) => void;
  updateFeePayment: (f: FeePayment) => void;
  addFeeStructure: (f: FeeStructure) => void;
  addHostelRoom: (r: HostelRoom) => void;
  updateHostelRoom: (r: HostelRoom) => void;
  addHostelRequest: (r: HostelRequest) => void;
  updateHostelRequest: (r: HostelRequest) => void;
  addBook: (b: Book) => void;
  updateBook: (b: Book) => void;
  addBookIssue: (bi: BookIssue) => void;
  updateBookIssue: (bi: BookIssue) => void;
  addNotification: (n: Notification) => void;
  markNotificationRead: (id: string) => void;
  markNotificationsRead: (ids: string[]) => void;
  setNotificationReadState: (id: string, read: boolean) => void;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  approveAdmission: (id: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

function loadOrSeed<T>(key: string, seed: T[]): T[] {
  const stored = sessionStorage.getItem(key);
  if (stored) return JSON.parse(stored);
  sessionStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

function persist<T>(key: string, data: T[]) {
  sessionStorage.setItem(key, JSON.stringify(data));
}

function normalizeStudents(list: (Student & Partial<{ residencyStatus: Student['residencyStatus'] }>)[]): Student[] {
  return list.map(student => ({ ...student, residencyStatus: student.residencyStatus ?? 'day-scholar' } as Student));
}

const ensureAdmissionResidency = (admission: Admission & Partial<{ residencyStatus: Student['residencyStatus'] }>): Admission =>
  ({ ...admission, residencyStatus: admission.residencyStatus ?? 'day-scholar' });

function normalizeAdmissions(list: (Admission & Partial<{ residencyStatus: Student['residencyStatus'] }>)[]): Admission[] {
  return list.map(admission => ensureAdmissionResidency(admission));
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(() => {
    const initial = normalizeStudents(loadOrSeed('erp_students', seedData.students));
    persist('erp_students', initial);
    return initial;
  });
  const [admissions, setAdmissions] = useState<Admission[]>(() => {
    const initial = normalizeAdmissions(loadOrSeed('erp_admissions', seedData.admissions));
    persist('erp_admissions', initial);
    return initial;
  });
  const [feePayments, setFeePayments] = useState<FeePayment[]>(() => loadOrSeed('erp_fees', seedData.feePayments));
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(() => loadOrSeed('erp_fee_structures', seedData.feeStructures));
  const [hostelRooms, setHostelRooms] = useState<HostelRoom[]>(() => loadOrSeed('erp_hostel', seedData.hostelRooms));
  const [hostelRequests, setHostelRequests] = useState<HostelRequest[]>(() => loadOrSeed('erp_hostel_requests', seedData.hostelRequests));
  const [books, setBooks] = useState<Book[]>(() => loadOrSeed('erp_books', seedData.books));
  const [bookIssues, setBookIssues] = useState<BookIssue[]>(() => loadOrSeed('erp_book_issues', seedData.bookIssues));
  const [notifications, setNotifications] = useState<Notification[]>(() => loadOrSeed('erp_notifications', seedData.notifications));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadOrSeed('erp_audit', []));

  const update = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, key: string) =>
    (fn: (prev: T[]) => T[]) => {
      setter(prev => { const next = fn(prev); persist(key, next); return next; });
    };

  const addStudent = useCallback((s: Student) => update(setStudents, 'erp_students')(p => [...p, s]), []);
  const updateStudent = useCallback((s: Student) => update(setStudents, 'erp_students')(p => p.map(x => x.id === s.id ? s : x)), []);
  const deleteStudent = useCallback((id: string) => update(setStudents, 'erp_students')(p => p.filter(x => x.id !== id)), []);

  const addAdmission = useCallback((a: Admission) => update(setAdmissions, 'erp_admissions')(p => [...p, ensureAdmissionResidency(a)]), []);
  const updateAdmission = useCallback((a: Admission) => update(setAdmissions, 'erp_admissions')(p => p.map(x => x.id === a.id ? ensureAdmissionResidency(a) : x)), []);

  const createFeeSchedule = useCallback((student: Student, course: string) => {
    const structure = feeStructures.find(fs => fs.course === course);
    if (!structure || structure.installments <= 0) return;
    setFeePayments(prev => {
      if (prev.some(fp => fp.studentId === student.id)) return prev;
      const baseAmount = Math.floor(structure.totalAmount / structure.installments);
      const remainder = structure.totalAmount - baseAmount * structure.installments;
      const entries: FeePayment[] = Array.from({ length: structure.installments }).map((_, idx) => {
        const due = new Date();
        due.setMonth(due.getMonth() + idx * 3);
        const amount = idx === structure.installments - 1 ? baseAmount + remainder : baseAmount;
        return {
          id: crypto.randomUUID(),
          studentId: student.id,
          studentName: student.name,
          amount,
          paidAmount: 0,
          dueDate: due.toISOString().split('T')[0],
          status: 'pending',
          installmentNo: idx + 1,
        };
      });
      const next = [...prev, ...entries];
      persist('erp_fees', next);
      return next;
    });
  }, [feeStructures]);

  const approveAdmission = useCallback((id: string) => {
    const admission = admissions.find(a => a.id === id);
    if (!admission) return;
    const approved = { ...admission, status: 'approved' as const };
    update(setAdmissions, 'erp_admissions')(p => p.map(a => a.id === id ? approved : a));

    const existingStudent = students.find(s => s.email === approved.email);
    if (existingStudent) return;

    const student: Student = {
      id: crypto.randomUUID(),
      studentId: `STU${Date.now().toString().slice(-6)}`,
      name: approved.applicantName,
      email: approved.email,
      phone: approved.phone,
      course: approved.course,
      year: 1,
      semester: 1,
      dob: approved.dob,
      gender: approved.gender,
      address: approved.address,
      guardianName: approved.guardianName,
      guardianPhone: approved.guardianPhone,
      status: 'active',
      admissionDate: new Date().toISOString().split('T')[0],
      documents: approved.documents,
      residencyStatus: approved.residencyStatus ?? 'day-scholar',
    };
    setStudents(sp => { const next = [...sp, student]; persist('erp_students', next); return next; });
    createFeeSchedule(student, approved.course);
  }, [admissions, students, createFeeSchedule]);

  const addFeePayment = useCallback((f: FeePayment) => update(setFeePayments, 'erp_fees')(p => [...p, f]), []);
  const updateFeePayment = useCallback((f: FeePayment) => update(setFeePayments, 'erp_fees')(p => p.map(x => x.id === f.id ? f : x)), []);
  const addFeeStructure = useCallback((f: FeeStructure) => update(setFeeStructures, 'erp_fee_structures')(p => [...p, f]), []);

  const addHostelRoom = useCallback((r: HostelRoom) => update(setHostelRooms, 'erp_hostel')(p => [...p, r]), []);
  const updateHostelRoom = useCallback((r: HostelRoom) => update(setHostelRooms, 'erp_hostel')(p => p.map(x => x.id === r.id ? r : x)), []);
  const addHostelRequest = useCallback((request: HostelRequest) => update(setHostelRequests, 'erp_hostel_requests')(p => [...p, request]), []);
  const updateHostelRequest = useCallback((request: HostelRequest) => update(setHostelRequests, 'erp_hostel_requests')(p => p.map(x => x.id === request.id ? request : x)), []);

  const addBook = useCallback((b: Book) => update(setBooks, 'erp_books')(p => [...p, b]), []);
  const updateBook = useCallback((b: Book) => update(setBooks, 'erp_books')(p => p.map(x => x.id === b.id ? b : x)), []);
  const addBookIssue = useCallback((bi: BookIssue) => update(setBookIssues, 'erp_book_issues')(p => [...p, bi]), []);
  const updateBookIssue = useCallback((bi: BookIssue) => update(setBookIssues, 'erp_book_issues')(p => p.map(x => x.id === bi.id ? bi : x)), []);

  const addNotification = useCallback((n: Notification) => update(setNotifications, 'erp_notifications')(p => [...p, n]), []);
  const markNotificationRead = useCallback((id: string) =>
    update(setNotifications, 'erp_notifications')(p => p.map(x => x.id === id ? { ...x, read: true } : x)), []);
  const markNotificationsRead = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const lookup = new Set(ids);
    update(setNotifications, 'erp_notifications')(p => p.map(x => lookup.has(x.id) ? { ...x, read: true } : x));
  }, []);
  const setNotificationReadState = useCallback((id: string, read: boolean) => {
    update(setNotifications, 'erp_notifications')(p => p.map(x => x.id === id ? { ...x, read } : x));
  }, []);

  const addAuditLog = useCallback((log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const entry: AuditLog = { ...log, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
    update(setAuditLogs, 'erp_audit')(p => [entry, ...p]);
  }, []);

  return (
    <DataContext.Provider value={{
      students, admissions, feePayments, feeStructures, hostelRooms, hostelRequests, books, bookIssues, notifications, auditLogs,
      addStudent, updateStudent, deleteStudent,
      addAdmission, updateAdmission, approveAdmission,
      addFeePayment, updateFeePayment, addFeeStructure,
      addHostelRoom, updateHostelRoom, addHostelRequest, updateHostelRequest,
      addBook, updateBook, addBookIssue, updateBookIssue,
      addNotification, markNotificationRead, markNotificationsRead, setNotificationReadState, addAuditLog,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
