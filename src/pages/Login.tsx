import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole } from '@/types';
import { GraduationCap, Mail, Lock, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DEMO_ACCOUNTS = [
  { email: 'admin@college.edu', password: 'admin', role: 'Admin', color: 'bg-primary' },
  { email: 'accounts@college.edu', password: 'staff', role: 'Accounts Staff', color: 'bg-secondary' },
  { email: 'hostel@college.edu', password: 'staff', role: 'Hostel Staff', color: 'bg-info' },
  { email: 'library@college.edu', password: 'staff', role: 'Library Staff', color: 'bg-warning' },
  { email: 'student@college.edu', password: 'student', role: 'Student', color: 'bg-success' },
];

export default function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isSignup) {
      if (!name.trim()) { setError('Name is required'); return; }
      signup(name, email, password, role);
      navigate('/');
    } else {
      const success = login(email, password);
      if (success) navigate('/');
      else setError('Invalid credentials. Try a demo account below.');
    }
  };

  const quickLogin = (demoEmail: string) => {
    login(demoEmail, '');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-2">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">EduManager</h1>
          <p className="text-muted-foreground">Integrated Student Management System</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{isSignup ? 'Create Account' : 'Sign In'}</CardTitle>
            <CardDescription>{isSignup ? 'Register a new account' : 'Enter your credentials to continue'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="name" placeholder="John Doe" className="pl-9" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="staff-accounts">Accounts Staff</SelectItem>
                        <SelectItem value="staff-faculty">Faculty</SelectItem>
                        <SelectItem value="staff-hostel">Hostel Staff</SelectItem>
                        <SelectItem value="staff-library">Library Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@college.edu" className="pl-9" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" className="pl-9" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">{isSignup ? 'Create Account' : 'Sign In'}</Button>
            </form>
            <div className="mt-4 text-center">
              <button className="text-sm text-muted-foreground hover:text-foreground" onClick={() => { setIsSignup(!isSignup); setError(''); }}>
                {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>

        {!isSignup && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quick Demo Access</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(d => (
                <button key={d.email} onClick={() => quickLogin(d.email)}
                  className="text-left p-2.5 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors text-xs">
                  <span className="font-medium text-foreground">{d.role}</span>
                  <span className="block text-muted-foreground truncate">{d.email}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
