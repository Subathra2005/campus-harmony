import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Send, X, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import type { Book, Gender, HostelRoom, ResidencyStatus, Student } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

type StepInputType = 'text' | 'number' | 'date' | 'textarea' | 'select';

interface AssistantStep {
  key: string;
  question: string;
  placeholder: string;
  type?: StepInputType;
  options?: string[];
}

type AssistantMode = 'idle' | 'student' | 'hostel' | 'book';

const studentSteps: AssistantStep[] = [
  { key: 'name', question: 'What is the student’s full name?', placeholder: 'Aditi Rao' },
  { key: 'email', question: 'Great! Share their email address.', placeholder: 'aditi@college.edu' },
  { key: 'phone', question: 'Phone number?', placeholder: '+91 98765 43210' },
  { key: 'course', question: 'Which course are they joining?', placeholder: 'B.Tech CS' },
  { key: 'year', question: 'Which academic year are they in?', placeholder: '1', type: 'number' },
  { key: 'semester', question: 'Semester?', placeholder: '1', type: 'number' },
  { key: 'dob', question: 'Date of birth?', placeholder: '2005-07-15', type: 'date' },
  { key: 'gender', question: 'Select a gender.', placeholder: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
  { key: 'residencyStatus', question: 'Are they a hosteller or day-scholar?', placeholder: 'day-scholar', type: 'select', options: ['day-scholar', 'hosteller'] },
  { key: 'guardianName', question: 'Guardian’s name?', placeholder: 'Anita Rao' },
  { key: 'guardianPhone', question: 'Guardian’s phone number?', placeholder: '+91 90000 12345' },
  { key: 'address', question: 'Finally, what is their address?', placeholder: '42 Campus Road, Coimbatore', type: 'textarea' },
];

const hostelSteps: AssistantStep[] = [
  { key: 'roomNumber', question: 'What is the room number?', placeholder: 'B-203' },
  { key: 'block', question: 'Which block or tower?', placeholder: 'Block B' },
  { key: 'floor', question: 'Which floor is it on?', placeholder: '2', type: 'number' },
  { key: 'capacity', question: 'How many occupants can it host?', placeholder: '3', type: 'number' },
  { key: 'type', question: 'Select the room type.', placeholder: 'double', type: 'select', options: ['single', 'double', 'triple'] },
  { key: 'status', question: 'Current status?', placeholder: 'available', type: 'select', options: ['available', 'occupied', 'maintenance'] },
  { key: 'monthlyRent', question: 'What is the monthly rent (in INR)?', placeholder: '4500', type: 'number' },
];

const bookSteps: AssistantStep[] = [
  { key: 'title', question: 'What is the book title?', placeholder: 'Design Patterns' },
  { key: 'author', question: 'Who is the author?', placeholder: 'Erich Gamma' },
  { key: 'isbn', question: 'Share the ISBN.', placeholder: '978-0201633610' },
  { key: 'category', question: 'Which category does it belong to?', placeholder: 'Computer Science' },
  { key: 'shelf', question: 'Shelf or rack code?', placeholder: 'CS-03-A' },
  { key: 'totalCopies', question: 'Total copies procured?', placeholder: '10', type: 'number' },
  { key: 'availableCopies', question: 'Copies currently available?', placeholder: '8', type: 'number' },
];

const createMessage = (role: ChatMessage['role'], content: string): ChatMessage => ({
  id: crypto.randomUUID(),
  role,
  content,
  timestamp: new Date().toISOString(),
});

const buildStudentFromDraft = (draft: Record<string, string>): Student => {
  const year = Number.parseInt(draft.year, 10);
  const semester = Number.parseInt(draft.semester, 10);
  return {
    id: crypto.randomUUID(),
    studentId: `STU${crypto.randomUUID().split('-')[0].toUpperCase()}`,
    name: draft.name,
    email: draft.email,
    phone: draft.phone,
    course: draft.course,
    year: Number.isFinite(year) && year > 0 ? year : 1,
    semester: Number.isFinite(semester) && semester > 0 ? semester : 1,
    dob: draft.dob,
    gender: (draft.gender as Gender) ?? 'Other',
    address: draft.address,
    guardianName: draft.guardianName,
    guardianPhone: draft.guardianPhone,
    status: 'active',
    admissionDate: new Date().toISOString().split('T')[0],
    documents: [],
    residencyStatus: (draft.residencyStatus as ResidencyStatus) ?? 'day-scholar',
  };
};

const buildHostelRoomFromDraft = (draft: Record<string, string>): HostelRoom => {
  const floor = Number.parseInt(draft.floor, 10);
  const capacity = Number.parseInt(draft.capacity, 10);
  const monthlyRent = Number.parseFloat(draft.monthlyRent);
  return {
    id: crypto.randomUUID(),
    roomNumber: draft.roomNumber,
    block: draft.block,
    floor: Number.isFinite(floor) ? floor : 0,
    capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : 1,
    occupants: [],
    type: (draft.type as HostelRoom['type']) ?? 'double',
    status: (draft.status as HostelRoom['status']) ?? 'available',
    monthlyRent: Number.isFinite(monthlyRent) && monthlyRent > 0 ? monthlyRent : 0,
  };
};

const buildBookFromDraft = (draft: Record<string, string>): Book => {
  const total = Number.parseInt(draft.totalCopies, 10);
  const available = Number.parseInt(draft.availableCopies, 10);
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 1;
  const safeAvailable = Number.isFinite(available) && available >= 0 ? Math.min(available, safeTotal) : safeTotal;
  return {
    id: crypto.randomUUID(),
    title: draft.title,
    author: draft.author,
    isbn: draft.isbn,
    category: draft.category,
    shelf: draft.shelf,
    totalCopies: safeTotal,
    availableCopies: safeAvailable,
  };
};

const defaultStudentDraft: Record<string, string> = {
  name: '',
  email: '',
  phone: '',
  course: '',
  year: '1',
  semester: '1',
  dob: '',
  gender: 'Male',
  residencyStatus: 'day-scholar',
  guardianName: '',
  guardianPhone: '',
  address: '',
};

const defaultHostelDraft: Record<string, string> = {
  roomNumber: '',
  block: '',
  floor: '1',
  capacity: '2',
  type: 'double',
  status: 'available',
  monthlyRent: '3500',
};

const defaultBookDraft: Record<string, string> = {
  title: '',
  author: '',
  isbn: '',
  category: '',
  shelf: '',
  totalCopies: '1',
  availableCopies: '1',
};

type QuickAction = { id: string; label: string; description?: string; action: () => void };

export default function CampusAssistant() {
  const { user } = useAuth();
  const { addStudent, addHostelRoom, addBook } = useData();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AssistantMode>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [draft, setDraft] = useState<Record<string, string>>({ ...defaultStudentDraft });
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createMessage('assistant', 'Hi! I am the Campus Assistant. Depending on your role I can add students, register hostel rooms, catalog books, or explain CSV imports.'),
    createMessage('assistant', 'What can I help you with today? Try "add a student", "add hostel room", "add a book", or "bulk upload instructions".'),
  ]);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const role = user?.role;
  const canManageStudents = role === 'admin';
  const canManageHostel = role === 'staff-hostel';
  const canManageLibrary = role === 'staff-library';
  const studentCsvMessage = 'Student CSV must include: Student ID, Name, Course, Year, Phone, Gender, Residency Status, Status. Upload it from Admin > Bulk Student Import.';
  const hostelCsvMessage = 'Hostel CSV template columns: Room Number, Block, Floor, Capacity, Type (single/double/triple), Status (available/occupied/maintenance), Monthly Rent. Upload it from Hostel > Bulk Import.';
  const libraryCsvMessage = 'Library CSV template columns: Title, Author, ISBN, Category, Shelf, Total Copies, Available Copies. Upload it from Library > Bulk Import.';

  useEffect(() => {
    viewportRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const pushMessage = useCallback((role: ChatMessage['role'], content: string) => {
    setMessages(prev => [...prev, createMessage(role, content)]);
  }, []);

  const resetFlow = useCallback(() => {
    setMode('idle');
    setCurrentStep(0);
    setDraft({ ...defaultStudentDraft });
    setInputValue('');
  }, []);

  const beginFlow = useCallback((nextMode: Exclude<AssistantMode, 'idle'>, defaults: Record<string, string>, intro: string) => {
    setMode(nextMode);
    setCurrentStep(0);
    setDraft({ ...defaults });
    setInputValue('');
    pushMessage('assistant', intro);
  }, [pushMessage]);

  const startStudentFlow = useCallback(() => {
    if (!canManageStudents) {
      pushMessage('assistant', 'Student onboarding is available only for admin accounts.');
      return;
    }
    beginFlow('student', defaultStudentDraft, 'Let’s add a new student. I will ask for a few quick details. What is their full name?');
  }, [beginFlow, canManageStudents, pushMessage]);

  const startHostelFlow = useCallback(() => {
    if (!canManageHostel) {
      pushMessage('assistant', 'Only hostel warden accounts can add rooms via chat.');
      return;
    }
    beginFlow('hostel', defaultHostelDraft, 'Let’s register a hostel room. What is the room number?');
  }, [beginFlow, canManageHostel, pushMessage]);

  const startBookFlow = useCallback(() => {
    if (!canManageLibrary) {
      pushMessage('assistant', 'Only librarian accounts can catalog books here.');
      return;
    }
    beginFlow('book', defaultBookDraft, 'Let’s catalog a new book. What is the title?');
  }, [beginFlow, canManageLibrary, pushMessage]);

  const finalizeFlow = useCallback(() => {
    if (mode === 'student') {
      const student = buildStudentFromDraft(draft);
      addStudent(student);
      pushMessage('assistant', `✅ Added ${student.name} to ${student.course}. Fee reminders and records are ready.`);
      toast({ title: 'Student created', description: `${student.name} is now part of the roster.` });
      resetFlow();
      return;
    }
    if (mode === 'hostel') {
      const room = buildHostelRoomFromDraft(draft);
      addHostelRoom(room);
      pushMessage('assistant', `🛏️ Room ${room.roomNumber} in ${room.block} is now listed with capacity ${room.capacity}.`);
      toast({ title: 'Hostel room added', description: `${room.roomNumber} is available for allocations.` });
      resetFlow();
      return;
    }
    if (mode === 'book') {
      const book = buildBookFromDraft(draft);
      addBook(book);
      pushMessage('assistant', `📚 “${book.title}” is cataloged with ${book.totalCopies} copies.`);
      toast({ title: 'Book cataloged', description: `${book.title} is now discoverable in the library.` });
      resetFlow();
    }
  }, [mode, draft, addStudent, addHostelRoom, addBook, pushMessage, resetFlow, toast]);

  const activeSteps = mode === 'student' ? studentSteps : mode === 'hostel' ? hostelSteps : mode === 'book' ? bookSteps : null;

  const handleFlowSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    if (!activeSteps || !inputValue.trim()) return;
    const step = activeSteps[currentStep];
    const value = inputValue.trim();
    pushMessage('user', value);
    setDraft(prev => ({ ...prev, [step.key]: value }));
    setInputValue('');
    if (currentStep === activeSteps.length - 1) {
      finalizeFlow();
      return;
    }
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    pushMessage('assistant', activeSteps[nextStep].question);
  }, [activeSteps, currentStep, finalizeFlow, inputValue, pushMessage]);

  const respondToGeneralPrompt = useCallback((prompt: string) => {
    const normalized = prompt.toLowerCase();
    if (normalized.includes('student')) {
      if (canManageStudents) {
        pushMessage('assistant', 'Starting the guided student intake.');
        startStudentFlow();
      } else {
        pushMessage('assistant', 'Student onboarding is restricted to admin accounts.');
      }
      return;
    }
    if (normalized.includes('hostel') || normalized.includes('room')) {
      if (canManageHostel) {
        pushMessage('assistant', 'Starting the hostel room intake.');
        startHostelFlow();
      } else {
        pushMessage('assistant', 'Only hostel warden accounts can add rooms here.');
      }
      return;
    }
    if (normalized.includes('book') || normalized.includes('library')) {
      if (canManageLibrary) {
        pushMessage('assistant', 'Starting the book catalog flow.');
        startBookFlow();
      } else {
        pushMessage('assistant', 'Only librarian accounts can add books here.');
      }
      return;
    }
    if (normalized.includes('csv') || normalized.includes('bulk')) {
      if (canManageStudents) {
        pushMessage('assistant', studentCsvMessage);
        return;
      }
      if (canManageHostel) {
        pushMessage('assistant', hostelCsvMessage);
        return;
      }
      if (canManageLibrary) {
        pushMessage('assistant', libraryCsvMessage);
        return;
      }
      pushMessage('assistant', 'Bulk uploads are not enabled for your current role.');
      return;
    }
    const hints: string[] = [];
    if (canManageStudents) hints.push('"add a student"');
    if (canManageHostel) hints.push('"add hostel room"');
    if (canManageLibrary) hints.push('"add a book"');
    if (hints.length > 0) {
      pushMessage('assistant', `I can guide you through ${hints.join(', ')}. Ask for bulk upload instructions anytime.`);
      return;
    }
    pushMessage('assistant', 'I can summarize dashboards for you. Try asking for admissions, fees, or notifications.');
  }, [canManageHostel, canManageLibrary, canManageStudents, hostelCsvMessage, libraryCsvMessage, pushMessage, startBookFlow, startHostelFlow, startStudentFlow, studentCsvMessage]);

  const handleGeneralSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    if (!inputValue.trim()) return;
    const message = inputValue.trim();
    pushMessage('user', message);
    setInputValue('');
    respondToGeneralPrompt(message);
  }, [inputValue, pushMessage, respondToGeneralPrompt]);

  const cancelFlow = useCallback(() => {
    if (mode === 'idle') return;
    const label = mode === 'student' ? 'Student intake' : mode === 'hostel' ? 'Hostel room intake' : 'Book cataloging';
    pushMessage('assistant', `${label} cancelled. Let me know whenever you are ready again.`);
    resetFlow();
  }, [mode, pushMessage, resetFlow]);

  const quickActions = useMemo<QuickAction[]>(() => {
    const actions: QuickAction[] = [];
    if (canManageStudents) {
      actions.push({ id: 'add-student', label: 'Add student', description: 'Guided chat flow', action: startStudentFlow });
      actions.push({ id: 'csv-student', label: 'Upload CSV', description: 'Student bulk import guide', action: () => pushMessage('assistant', studentCsvMessage) });
    }
    if (canManageHostel) {
      actions.push({ id: 'add-hostel', label: 'Add hostel room', description: 'Quick intake form', action: startHostelFlow });
      actions.push({ id: 'csv-hostel', label: 'Upload CSV', description: 'Hostel bulk import guide', action: () => pushMessage('assistant', hostelCsvMessage) });
    }
    if (canManageLibrary) {
      actions.push({ id: 'add-book', label: 'Add book', description: 'Catalog a title', action: startBookFlow });
      actions.push({ id: 'csv-library', label: 'Upload CSV', description: 'Library bulk import guide', action: () => pushMessage('assistant', libraryCsvMessage) });
    }
    return actions;
  }, [canManageHostel, canManageLibrary, canManageStudents, hostelCsvMessage, libraryCsvMessage, pushMessage, startBookFlow, startHostelFlow, startStudentFlow, studentCsvMessage]);

  const currentPrompt = activeSteps ? activeSteps[currentStep] : null;
  const submitLabel = mode === 'student' ? 'Add student' : mode === 'hostel' ? 'Add room' : 'Add book';

  useEffect(() => {
    if (mode === 'idle' || !currentPrompt) {
      if (mode === 'idle') setInputValue('');
      return;
    }
    if (currentPrompt.type === 'select' && currentPrompt.options) {
      setInputValue(currentPrompt.options[0]);
      return;
    }
    setInputValue('');
  }, [mode, currentPrompt]);

  return (
    <div className="fixed bottom-4 right-4 z-40 space-y-3">
      {isOpen && (
        <div className="w-[360px] rounded-3xl border bg-card shadow-2xl shadow-primary/10 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-sm font-semibold flex items-center gap-1"><Sparkles className="h-4 w-4 text-primary" />Campus Assistant</p>
              <p className="text-xs text-muted-foreground">Chat-first controls for every module</p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4">
            <ScrollArea className="h-64 pr-2">
              <div className="space-y-3">
                {messages.map(message => (
                  <div key={message.id} className={cn('flex', message.role === 'assistant' ? 'justify-start' : 'justify-end')}>
                    <div className={cn('rounded-2xl px-3 py-2 text-sm shadow-sm', message.role === 'assistant' ? 'bg-muted text-foreground rounded-bl-sm' : 'bg-primary text-primary-foreground rounded-br-sm max-w-[75%]')}>
                      {message.content}
                    </div>
                  </div>
                ))}
                <div ref={viewportRef} />
              </div>
            </ScrollArea>
            {mode === 'idle' && quickActions.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-[11px] uppercase text-muted-foreground tracking-wide">Quick actions</p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map(action => (
                    <Button key={action.id} size="sm" variant="secondary" onClick={action.action}>
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <form onSubmit={mode === 'idle' ? handleGeneralSubmit : handleFlowSubmit} className="border-t bg-muted/30 p-4 space-y-2">
            {mode !== 'idle' && currentPrompt && activeSteps && (
              <>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Step {currentStep + 1} of {activeSteps.length}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={cancelFlow}>Cancel</Button>
                </div>
                <p className="text-xs text-foreground">{currentPrompt.question}</p>
                {currentPrompt.type === 'textarea' ? (
                  <Textarea rows={2} placeholder={currentPrompt.placeholder} value={inputValue} onChange={event => setInputValue(event.target.value)} className="text-sm" required />
                ) : currentPrompt.type === 'select' && currentPrompt.options ? (
                  <select className="w-full rounded-xl border bg-background px-3 py-2 text-sm" value={inputValue || currentPrompt.options[0]} onChange={event => setInputValue(event.target.value)}>
                    {currentPrompt.options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <Input type={currentPrompt.type === 'date' ? 'date' : currentPrompt.type === 'number' ? 'number' : 'text'} placeholder={currentPrompt.placeholder} value={inputValue} onChange={event => setInputValue(event.target.value)} required />
                )}
                <Button type="submit" className="w-full">
                  {currentStep === activeSteps.length - 1 ? submitLabel : 'Next'}
                </Button>
              </>
            )}
            {mode === 'idle' && (
              <div className="flex items-center gap-2">
                <Input placeholder="Ask me about your module or data..." value={inputValue} onChange={event => setInputValue(event.target.value)} />
                <Button type="submit" size="icon" variant="secondary">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </form>
        </div>
      )}
      <Button size="lg" className="h-14 w-14 rounded-full shadow-lg shadow-primary/30" onClick={() => setIsOpen(prev => !prev)}>
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );
}
