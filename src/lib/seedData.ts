import { Student, Admission, FeePayment, FeeStructure, HostelRoom, Book, BookIssue, Notification, HostelRequest } from '@/types';

export const seedData = {
  students: [
    { id: 's1', studentId: 'STU001', name: 'Aarav Sharma', email: 'aarav@student.edu', phone: '9876543210', course: 'B.Tech CS', year: 2, semester: 3, dob: '2003-05-15', gender: 'Male', address: '123 Main St, Delhi', guardianName: 'Raj Sharma', guardianPhone: '9876543211', status: 'active', admissionDate: '2023-08-01', documents: [], hostelRoomId: 'r1', residencyStatus: 'hosteller' },
    { id: 's2', studentId: 'STU002', name: 'Priya Patel', email: 'priya@student.edu', phone: '9876543212', course: 'B.Tech ECE', year: 1, semester: 1, dob: '2004-03-22', gender: 'Female', address: '456 Oak Ave, Mumbai', guardianName: 'Suresh Patel', guardianPhone: '9876543213', status: 'active', admissionDate: '2024-08-01', documents: [], hostelRoomId: 'r2', residencyStatus: 'hosteller' },
    { id: 's3', studentId: 'STU003', name: 'Rahul Kumar', email: 'rahul@student.edu', phone: '9876543214', course: 'BBA', year: 3, semester: 5, dob: '2002-11-10', gender: 'Male', address: '789 Pine Rd, Bangalore', guardianName: 'Mohan Kumar', guardianPhone: '9876543215', status: 'active', admissionDate: '2022-08-01', documents: [], residencyStatus: 'day-scholar' },
    { id: 's4', studentId: 'STU004', name: 'Ananya Singh', email: 'ananya@student.edu', phone: '9876543216', course: 'B.Tech CS', year: 1, semester: 1, dob: '2004-07-08', gender: 'Female', address: '321 Elm St, Chennai', guardianName: 'Vikram Singh', guardianPhone: '9876543217', status: 'active', admissionDate: '2024-08-01', documents: [], residencyStatus: 'day-scholar' },
    { id: 's5', studentId: 'STU005', name: 'Karan Mehta', email: 'karan@student.edu', phone: '9876543218', course: 'MBA', year: 2, semester: 3, dob: '2001-01-25', gender: 'Male', address: '654 Maple Dr, Pune', guardianName: 'Dinesh Mehta', guardianPhone: '9876543219', status: 'active', admissionDate: '2023-08-01', documents: [], residencyStatus: 'day-scholar' },
  ] as Student[],

  admissions: [
    { id: 'a1', applicantName: 'Sneha Gupta', email: 'sneha@gmail.com', phone: '9988776655', course: 'B.Tech CS', dob: '2005-02-14', gender: 'Female', address: '100 Rose Lane, Jaipur', guardianName: 'Anil Gupta', guardianPhone: '9988776656', status: 'applied', appliedDate: '2025-03-10', documents: [], notes: '', residencyStatus: 'hosteller' },
    { id: 'a2', applicantName: 'Vikash Yadav', email: 'vikash@gmail.com', phone: '9988776657', course: 'BBA', dob: '2005-06-20', gender: 'Male', address: '200 Lotus Rd, Lucknow', guardianName: 'Ram Yadav', guardianPhone: '9988776658', status: 'verified', appliedDate: '2025-03-08', documents: [], notes: 'Documents verified', residencyStatus: 'day-scholar' },
    { id: 'a3', applicantName: 'Meera Nair', email: 'meera@gmail.com', phone: '9988776659', course: 'B.Tech ECE', dob: '2005-09-05', gender: 'Female', address: '300 Jasmine Ave, Kerala', guardianName: 'Krishna Nair', guardianPhone: '9988776660', status: 'approved', appliedDate: '2025-03-05', documents: [], notes: 'Approved by dean', residencyStatus: 'hosteller' },
  ] as Admission[],

  feePayments: [
    { id: 'f1', studentId: 's1', studentName: 'Aarav Sharma', amount: 75000, paidAmount: 75000, dueDate: '2025-01-15', paidDate: '2025-01-10', status: 'paid', installmentNo: 1, receiptNo: 'RCP001', method: 'Online' },
    { id: 'f2', studentId: 's1', studentName: 'Aarav Sharma', amount: 75000, paidAmount: 0, dueDate: '2025-06-15', status: 'pending', installmentNo: 2 },
    { id: 'f3', studentId: 's2', studentName: 'Priya Patel', amount: 80000, paidAmount: 40000, dueDate: '2025-02-15', paidDate: '2025-02-20', status: 'partial', installmentNo: 1, method: 'UPI' },
    { id: 'f4', studentId: 's3', studentName: 'Rahul Kumar', amount: 60000, paidAmount: 0, dueDate: '2025-01-10', status: 'overdue', installmentNo: 1 },
    { id: 'f5', studentId: 's4', studentName: 'Ananya Singh', amount: 75000, paidAmount: 75000, dueDate: '2025-01-15', paidDate: '2025-01-12', status: 'paid', installmentNo: 1, receiptNo: 'RCP003', method: 'Card' },
  ] as FeePayment[],

  feeStructures: [
    { id: 'fs1', course: 'B.Tech CS', totalAmount: 150000, installments: 2, components: [{ name: 'Tuition', amount: 100000 }, { name: 'Lab', amount: 30000 }, { name: 'Library', amount: 10000 }, { name: 'Sports', amount: 10000 }] },
    { id: 'fs2', course: 'B.Tech ECE', totalAmount: 160000, installments: 2, components: [{ name: 'Tuition', amount: 110000 }, { name: 'Lab', amount: 30000 }, { name: 'Library', amount: 10000 }, { name: 'Sports', amount: 10000 }] },
    { id: 'fs3', course: 'BBA', totalAmount: 120000, installments: 2, components: [{ name: 'Tuition', amount: 90000 }, { name: 'Library', amount: 10000 }, { name: 'Activities', amount: 20000 }] },
    { id: 'fs4', course: 'MBA', totalAmount: 200000, installments: 2, components: [{ name: 'Tuition', amount: 150000 }, { name: 'Case Studies', amount: 30000 }, { name: 'Library', amount: 20000 }] },
  ] as FeeStructure[],

  hostelRooms: [
    { id: 'r1', roomNumber: 'A-101', block: 'A', floor: 1, capacity: 2, occupants: ['s1'], type: 'double', status: 'occupied', monthlyRent: 5000 },
    { id: 'r2', roomNumber: 'A-102', block: 'A', floor: 1, capacity: 2, occupants: ['s2'], type: 'double', status: 'occupied', monthlyRent: 5000 },
    { id: 'r3', roomNumber: 'B-201', block: 'B', floor: 2, capacity: 1, occupants: [], type: 'single', status: 'available', monthlyRent: 8000 },
    { id: 'r4', roomNumber: 'B-202', block: 'B', floor: 2, capacity: 3, occupants: [], type: 'triple', status: 'available', monthlyRent: 4000 },
    { id: 'r5', roomNumber: 'C-301', block: 'C', floor: 3, capacity: 2, occupants: [], type: 'double', status: 'maintenance', monthlyRent: 5000 },
  ] as HostelRoom[],

  hostelRequests: [] as HostelRequest[],

  books: [
    { id: 'b1', title: 'Introduction to Algorithms', author: 'Cormen et al.', isbn: '978-0262033848', category: 'Computer Science', totalCopies: 10, availableCopies: 7, shelf: 'CS-01' },
    { id: 'b2', title: 'Digital Electronics', author: 'Morris Mano', isbn: '978-0132774208', category: 'Electronics', totalCopies: 8, availableCopies: 5, shelf: 'ECE-01' },
    { id: 'b3', title: 'Principles of Management', author: 'Koontz & Weihrich', isbn: '978-0070620187', category: 'Management', totalCopies: 12, availableCopies: 10, shelf: 'MBA-01' },
    { id: 'b4', title: 'Engineering Mathematics', author: 'B.S. Grewal', isbn: '978-8174091246', category: 'Mathematics', totalCopies: 15, availableCopies: 12, shelf: 'MATH-01' },
    { id: 'b5', title: 'Data Structures in C', author: 'Reema Thareja', isbn: '978-0198099307', category: 'Computer Science', totalCopies: 10, availableCopies: 8, shelf: 'CS-02' },
  ] as Book[],

  bookIssues: [
    { id: 'bi1', bookId: 'b1', bookTitle: 'Introduction to Algorithms', studentId: 's1', studentName: 'Aarav Sharma', issueDate: '2025-03-01', dueDate: '2025-03-15', status: 'issued', fine: 0 },
    { id: 'bi2', bookId: 'b2', bookTitle: 'Digital Electronics', studentId: 's2', studentName: 'Priya Patel', issueDate: '2025-02-20', dueDate: '2025-03-06', status: 'overdue', fine: 50 },
    { id: 'bi3', bookId: 'b3', bookTitle: 'Principles of Management', studentId: 's3', studentName: 'Rahul Kumar', issueDate: '2025-02-25', dueDate: '2025-03-11', returnDate: '2025-03-10', status: 'returned', fine: 0 },
  ] as BookIssue[],

  notifications: [
    { id: 'n1', title: 'Fee Reminder', message: 'Your semester fee installment 2 is due on June 15, 2025', type: 'warning', date: '2025-03-20', read: false, userId: 's1' },
    { id: 'n2', title: 'New Admission', message: 'New admission application received from Sneha Gupta', type: 'info', date: '2025-03-10', read: false },
    { id: 'n3', title: 'Book Overdue', message: 'Digital Electronics is overdue. Please return immediately.', type: 'error', date: '2025-03-07', read: false, userId: 's2' },
    { id: 'n4', title: 'Hostel Maintenance', message: 'Room C-301 maintenance completed', type: 'success', date: '2025-03-15', read: true },
  ] as Notification[],
};
