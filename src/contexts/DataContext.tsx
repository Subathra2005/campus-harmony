import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Student, Admission, FeePayment, FeeStructure, HostelRoom, Book, BookIssue, Notification, AuditLog } from '@/types';
import { seedData } from '@/lib/seedData';

interface DataContextType {
  students: Student[];
  admissions: Admission[];
  feePayments: FeePayment[];
  feeStructures: FeeStructure[];
  hostelRooms: HostelRoom[];
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
  addBook: (b: Book) => void;
  updateBook: (b: Book) => void;
  addBookIssue: (bi: BookIssue) => void;
  updateBookIssue: (bi: BookIssue) => void;
  addNotification: (n: Notification) => void;
  markNotificationRead: (id: string) => void;
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

export function DataProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(() => loadOrSeed('erp_students', seedData.students));
  const [admissions, setAdmissions] = useState<Admission[]>(() => loadOrSeed('erp_admissions', seedData.admissions));
  const [feePayments, setFeePayments] = useState<FeePayment[]>(() => loadOrSeed('erp_fees', seedData.feePayments));
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(() => loadOrSeed('erp_fee_structures', seedData.feeStructures));
  const [hostelRooms, setHostelRooms] = useState<HostelRoom[]>(() => loadOrSeed('erp_hostel', seedData.hostelRooms));
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

  const addAdmission = useCallback((a: Admission) => update(setAdmissions, 'erp_admissions')(p => [...p, a]), []);
  const updateAdmission = useCallback((a: Admission) => update(setAdmissions, 'erp_admissions')(p => p.map(x => x.id === a.id ? a : x)), []);

  const approveAdmission = useCallback((id: string) => {
    setAdmissions(prev => {
      const updated = prev.map(a => {
        if (a.id !== id) return a;
        return { ...a, status: 'approved' as const };
      });
      persist('erp_admissions', updated);
      return updated;
    });
    // Auto-create student
    setAdmissions(prev => {
      const admission = prev.find(a => a.id === id);
      if (admission && admission.status === 'approved') {
        const student: Student = {
          id: crypto.randomUUID(),
          studentId: `STU${Date.now().toString().slice(-6)}`,
          name: admission.applicantName,
          email: admission.email,
          phone: admission.phone,
          course: admission.course,
          year: 1, semester: 1,
          dob: admission.dob,
          gender: admission.gender,
          address: admission.address,
          guardianName: admission.guardianName,
          guardianPhone: admission.guardianPhone,
          status: 'active',
          admissionDate: new Date().toISOString().split('T')[0],
          documents: admission.documents,
        };
        setStudents(sp => { const n = [...sp, student]; persist('erp_students', n); return n; });
      }
      return prev;
    });
  }, []);

  const addFeePayment = useCallback((f: FeePayment) => update(setFeePayments, 'erp_fees')(p => [...p, f]), []);
  const updateFeePayment = useCallback((f: FeePayment) => update(setFeePayments, 'erp_fees')(p => p.map(x => x.id === f.id ? f : x)), []);
  const addFeeStructure = useCallback((f: FeeStructure) => update(setFeeStructures, 'erp_fee_structures')(p => [...p, f]), []);

  const addHostelRoom = useCallback((r: HostelRoom) => update(setHostelRooms, 'erp_hostel')(p => [...p, r]), []);
  const updateHostelRoom = useCallback((r: HostelRoom) => update(setHostelRooms, 'erp_hostel')(p => p.map(x => x.id === r.id ? r : x)), []);

  const addBook = useCallback((b: Book) => update(setBooks, 'erp_books')(p => [...p, b]), []);
  const updateBook = useCallback((b: Book) => update(setBooks, 'erp_books')(p => p.map(x => x.id === b.id ? b : x)), []);
  const addBookIssue = useCallback((bi: BookIssue) => update(setBookIssues, 'erp_book_issues')(p => [...p, bi]), []);
  const updateBookIssue = useCallback((bi: BookIssue) => update(setBookIssues, 'erp_book_issues')(p => p.map(x => x.id === bi.id ? bi : x)), []);

  const addNotification = useCallback((n: Notification) => update(setNotifications, 'erp_notifications')(p => [...p, n]), []);
  const markNotificationRead = useCallback((id: string) =>
    update(setNotifications, 'erp_notifications')(p => p.map(x => x.id === id ? { ...x, read: true } : x)), []);

  const addAuditLog = useCallback((log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const entry: AuditLog = { ...log, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
    update(setAuditLogs, 'erp_audit')(p => [entry, ...p]);
  }, []);

  return (
    <DataContext.Provider value={{
      students, admissions, feePayments, feeStructures, hostelRooms, books, bookIssues, notifications, auditLogs,
      addStudent, updateStudent, deleteStudent,
      addAdmission, updateAdmission, approveAdmission,
      addFeePayment, updateFeePayment, addFeeStructure,
      addHostelRoom, updateHostelRoom,
      addBook, updateBook, addBookIssue, updateBookIssue,
      addNotification, markNotificationRead, addAuditLog,
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
