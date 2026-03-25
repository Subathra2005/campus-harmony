export type UserRole = 'admin' | 'staff-accounts' | 'staff-faculty' | 'staff-hostel' | 'staff-library' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Student {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  year: number;
  semester: number;
  dob: string;
  gender: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  status: 'active' | 'inactive' | 'graduated';
  admissionDate: string;
  documents: Document[];
  hostelRoomId?: string;
}

export interface Admission {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  course: string;
  dob: string;
  gender: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  status: 'applied' | 'verified' | 'approved' | 'enrolled' | 'rejected';
  appliedDate: string;
  documents: Document[];
  notes: string;
}

export interface FeeStructure {
  id: string;
  course: string;
  totalAmount: number;
  installments: number;
  components: { name: string; amount: number }[];
}

export interface FeePayment {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  installmentNo: number;
  receiptNo?: string;
  method?: string;
}

export interface HostelRoom {
  id: string;
  roomNumber: string;
  block: string;
  floor: number;
  capacity: number;
  occupants: string[]; // student IDs
  type: 'single' | 'double' | 'triple';
  status: 'available' | 'occupied' | 'maintenance';
  monthlyRent: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  shelf: string;
}

export interface BookIssue {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fine: number;
  status: 'issued' | 'returned' | 'overdue';
}

export interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  date: string;
  read: boolean;
  userId?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  module: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: string;
}
