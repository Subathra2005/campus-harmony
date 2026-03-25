import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import StudentDashboard from './StudentDashboard';
import StaffDashboard from './StaffDashboard';

export default function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'student') return <StudentDashboard />;
  if (user?.role === 'admin') return <AdminDashboard />;
  return <StaffDashboard />;
}
