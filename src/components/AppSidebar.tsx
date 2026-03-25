import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import {
  LayoutDashboard, Users, FileText, DollarSign, Building2, BookOpen,
  Bell, ClipboardList, LogOut, GraduationCap, Settings
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';

const adminNav = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Students', url: '/students', icon: Users },
  { title: 'Admissions', url: '/admissions', icon: FileText },
  { title: 'Fees', url: '/fees', icon: DollarSign },
  { title: 'Hostel', url: '/hostel', icon: Building2 },
  { title: 'Library', url: '/library', icon: BookOpen },
  { title: 'Notifications', url: '/notifications', icon: Bell },
  { title: 'Audit Logs', url: '/audit', icon: ClipboardList },
];

const staffAccountsNav = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Fees', url: '/fees', icon: DollarSign },
  { title: 'Students', url: '/students', icon: Users },
  { title: 'Notifications', url: '/notifications', icon: Bell },
];

const staffHostelNav = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Hostel', url: '/hostel', icon: Building2 },
  { title: 'Students', url: '/students', icon: Users },
  { title: 'Notifications', url: '/notifications', icon: Bell },
];

const staffLibraryNav = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Library', url: '/library', icon: BookOpen },
  { title: 'Students', url: '/students', icon: Users },
  { title: 'Notifications', url: '/notifications', icon: Bell },
];

const studentNav = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'My Fees', url: '/fees', icon: DollarSign },
  { title: 'Hostel', url: '/hostel', icon: Building2 },
  { title: 'Library', url: '/library', icon: BookOpen },
  { title: 'Notifications', url: '/notifications', icon: Bell },
];

function getNavForRole(role: string) {
  switch (role) {
    case 'admin': return adminNav;
    case 'staff-accounts': return staffAccountsNav;
    case 'staff-hostel': return staffHostelNav;
    case 'staff-library': return staffLibraryNav;
    case 'student': return studentNav;
    default: return adminNav;
  }
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const nav = getNavForRole(user?.role || 'student');

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h2 className="font-bold text-sidebar-foreground text-sm truncate">EduManager</h2>
            <p className="text-[10px] text-sidebar-foreground/60 truncate capitalize">{user?.role?.replace('-', ' ')}</p>
          </div>
        )}
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <button onClick={logout}
          className="flex items-center gap-2 w-full p-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-sm">
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
