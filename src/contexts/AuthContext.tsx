import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string, role: UserRole) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USERS: User[] = [
  { id: '1', name: 'Dr. Admin', email: 'admin@college.edu', role: 'admin' },
  { id: '2', name: 'Accounts Staff', email: 'accounts@college.edu', role: 'staff-accounts' },
  { id: '3', name: 'Prof. Faculty', email: 'faculty@college.edu', role: 'staff-faculty' },
  { id: '4', name: 'Hostel Warden', email: 'hostel@college.edu', role: 'staff-hostel' },
  { id: '5', name: 'Librarian', email: 'library@college.edu', role: 'staff-library' },
  { id: '6', name: 'John Student', email: 'student@college.edu', role: 'student' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('erp_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((email: string, _password: string) => {
    const found = DEMO_USERS.find(u => u.email === email);
    if (found) {
      setUser(found);
      sessionStorage.setItem('erp_user', JSON.stringify(found));
      return true;
    }
    // Also check registered users
    const registered = JSON.parse(sessionStorage.getItem('erp_registered_users') || '[]');
    const regUser = registered.find((u: any) => u.email === email);
    if (regUser) {
      setUser(regUser);
      sessionStorage.setItem('erp_user', JSON.stringify(regUser));
      return true;
    }
    return false;
  }, []);

  const signup = useCallback((name: string, email: string, _password: string, role: UserRole) => {
    const newUser: User = { id: crypto.randomUUID(), name, email, role };
    const registered = JSON.parse(sessionStorage.getItem('erp_registered_users') || '[]');
    registered.push(newUser);
    sessionStorage.setItem('erp_registered_users', JSON.stringify(registered));
    setUser(newUser);
    sessionStorage.setItem('erp_user', JSON.stringify(newUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('erp_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
