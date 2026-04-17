import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Student, Admission, FeePayment, FeeStructure, HostelRoom, Book, BookIssue, Notification, AuditLog, HostelRequest } from '@/types';
import { seedData } from '@/lib/seedData';

export interface BulkInsertSummary<T> {
  inserted: T[];
  duplicates: string[];
}

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
  addStudentsBulk: (s: Student[]) => BulkInsertSummary<Student>;
  updateStudent: (s: Student) => void;
  deleteStudent: (id: string) => void;
  addAdmission: (a: Admission) => void;
  updateAdmission: (a: Admission) => void;
  addFeePayment: (f: FeePayment) => void;
  updateFeePayment: (f: FeePayment) => void;
  addFeeStructure: (f: FeeStructure) => void;
  addHostelRoom: (r: HostelRoom) => void;
  addHostelRoomsBulk: (rooms: HostelRoom[]) => BulkInsertSummary<HostelRoom>;
  updateHostelRoom: (r: HostelRoom) => void;
  deleteHostelRoom: (id: string) => void;
  addHostelRequest: (r: HostelRequest) => void;
  updateHostelRequest: (r: HostelRequest) => void;
  addBook: (b: Book) => void;
  addBooksBulk: (books: Book[]) => BulkInsertSummary<Book>;
  updateBook: (b: Book) => void;
  deleteBook: (id: string) => void;
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

  const addStudent = useCallback((student: Student) => {
    const normalized = normalizeStudents([student])[0];
    setStudents(prev => {
      const next = [...prev, normalized];
      persist('erp_students', next);
      return next;
    });
    createFeeSchedule(normalized, normalized.course);
  }, [createFeeSchedule]);

  const addStudentsBulk = useCallback((batch: Student[]): BulkInsertSummary<Student> => {
    if (batch.length === 0) return { inserted: [], duplicates: [] };
    const normalized = normalizeStudents(batch);
    const inserted: Student[] = [];
    const duplicates: string[] = [];
    setStudents(prev => {
      const existingEmails = new Set(prev.map(s => s.email.toLowerCase()));
      const existingIds = new Set(prev.map(s => s.studentId.toLowerCase()));
      normalized.forEach(student => {
        const emailKey = student.email.toLowerCase();
        const idKey = student.studentId.toLowerCase();
        if (existingEmails.has(emailKey) || existingIds.has(idKey)) {
          duplicates.push(student.studentId || student.email);
          return;
        }
        existingEmails.add(emailKey);
        existingIds.add(idKey);
        inserted.push(student);
      });
      if (inserted.length === 0) return prev;
      const next = [...prev, ...inserted];
      persist('erp_students', next);
      return next;
    });
    inserted.forEach(student => createFeeSchedule(student, student.course));
    return { inserted, duplicates };
  }, [createFeeSchedule]);

  const updateStudent = useCallback((s: Student) => update(setStudents, 'erp_students')(p => p.map(x => x.id === s.id ? s : x)), []);
  const deleteStudent = useCallback((id: string) => update(setStudents, 'erp_students')(p => p.filter(x => x.id !== id)), []);

  const addAdmission = useCallback((a: Admission) => update(setAdmissions, 'erp_admissions')(p => [...p, ensureAdmissionResidency(a)]), []);
  const updateAdmission = useCallback((a: Admission) => update(setAdmissions, 'erp_admissions')(p => p.map(x => x.id === a.id ? ensureAdmissionResidency(a) : x)), []);

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
  const addHostelRoomsBulk = useCallback((rooms: HostelRoom[]): BulkInsertSummary<HostelRoom> => {
    if (rooms.length === 0) return { inserted: [], duplicates: [] };
    const inserted: HostelRoom[] = [];
    const duplicates: string[] = [];
    setHostelRooms(prev => {
      const existing = new Set(prev.map(room => `${room.block}-${room.roomNumber}`.trim().toLowerCase()));
      rooms.forEach(room => {
        const keyBase = `${room.block}-${room.roomNumber}`.trim().toLowerCase();
        if (!room.roomNumber || existing.has(keyBase)) {
          duplicates.push(room.roomNumber || `${room.block}-${room.floor}`);
          return;
        }
        existing.add(keyBase);
        inserted.push(room);
      });
      if (inserted.length === 0) return prev;
      const next = [...prev, ...inserted];
      persist('erp_hostel', next);
      return next;
    });
    return { inserted, duplicates };
  }, []);
  const updateHostelRoom = useCallback((r: HostelRoom) => update(setHostelRooms, 'erp_hostel')(p => p.map(x => x.id === r.id ? r : x)), []);
  const deleteHostelRoom = useCallback((id: string) => {
    setHostelRooms(prev => {
      if (!prev.some(room => room.id === id)) return prev;
      const next = prev.filter(room => room.id !== id);
      persist('erp_hostel', next);
      return next;
    });
    update(setStudents, 'erp_students')(p => p.map(student => student.hostelRoomId === id ? { ...student, hostelRoomId: undefined } : student));
    update(setHostelRequests, 'erp_hostel_requests')(p => p.map(request => request.roomId === id ? { ...request, roomId: undefined, status: request.status === 'approved' ? 'pending' : request.status } : request));
  }, []);
  const addHostelRequest = useCallback((request: HostelRequest) => update(setHostelRequests, 'erp_hostel_requests')(p => [...p, request]), []);
  const updateHostelRequest = useCallback((request: HostelRequest) => update(setHostelRequests, 'erp_hostel_requests')(p => p.map(x => x.id === request.id ? request : x)), []);

  const addBook = useCallback((b: Book) => update(setBooks, 'erp_books')(p => [...p, b]), []);
  const addBooksBulk = useCallback((batch: Book[]): BulkInsertSummary<Book> => {
    if (batch.length === 0) return { inserted: [], duplicates: [] };
    const inserted: Book[] = [];
    const duplicates: string[] = [];
    setBooks(prev => {
      const existing = new Set(prev.map(book => (book.isbn?.trim().toLowerCase() || `${book.title}-${book.author}`.toLowerCase())));
      batch.forEach(book => {
        const isbnKey = book.isbn?.trim().toLowerCase();
        const fallbackKey = `${book.title}-${book.author}`.trim().toLowerCase();
        const key = isbnKey || fallbackKey;
        if (!book.title || existing.has(key)) {
          duplicates.push(book.isbn || book.title);
          return;
        }
        existing.add(key);
        inserted.push(book);
      });
      if (inserted.length === 0) return prev;
      const next = [...prev, ...inserted];
      persist('erp_books', next);
      return next;
    });
    return { inserted, duplicates };
  }, []);
  const updateBook = useCallback((b: Book) => update(setBooks, 'erp_books')(p => p.map(x => x.id === b.id ? b : x)), []);
  const deleteBook = useCallback((id: string) => {
    setBooks(prev => {
      if (!prev.some(book => book.id === id)) return prev;
      const next = prev.filter(book => book.id !== id);
      persist('erp_books', next);
      return next;
    });
    update(setBookIssues, 'erp_book_issues')(p => p.filter(issue => issue.bookId !== id));
  }, []);
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
      addStudent, addStudentsBulk, updateStudent, deleteStudent,
      addAdmission, updateAdmission, approveAdmission,
      addFeePayment, updateFeePayment, addFeeStructure,
      addHostelRoom, addHostelRoomsBulk, updateHostelRoom, deleteHostelRoom, addHostelRequest, updateHostelRequest,
      addBook, addBooksBulk, updateBook, deleteBook, addBookIssue, updateBookIssue,
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
