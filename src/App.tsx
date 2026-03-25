import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/Login";
import DashboardRouter from "@/pages/DashboardRouter";
import StudentsPage from "@/pages/StudentsPage";
import AdmissionsPage from "@/pages/AdmissionsPage";
import FeesPage from "@/pages/FeesPage";
import HostelPage from "@/pages/HostelPage";
import LibraryPage from "@/pages/LibraryPage";
import NotificationsPage from "@/pages/NotificationsPage";
import AuditPage from "@/pages/AuditPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardRouter />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/admissions" element={<AdmissionsPage />} />
                <Route path="/fees" element={<FeesPage />} />
                <Route path="/hostel" element={<HostelPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/audit" element={<AuditPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
