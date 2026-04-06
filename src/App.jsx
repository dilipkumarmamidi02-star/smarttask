import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { Loader2 } from "lucide-react";

import PageNotFound from "@/lib/PageNotFound";
import Login from "@/pages/Login";
import Landing from "@/pages/Landing";
import ProfileSetup from "@/pages/ProfileSetup";
import Marketplace from "@/pages/Marketplace";
import TaskDetail from "@/pages/TaskDetail";
import Disputes from "@/pages/Disputes";
import NotificationCenter from "@/pages/NotificationCenter";
import CompanyCredentials from "@/pages/CompanyCredentials";
import StudentDashboard from "@/pages/StudentDashboard";
import ClientDashboard from "@/pages/ClientDashboard";
import ProtectedRoute from "@/components/ProtectedRoute";

import StudentOverview from "@/pages/student/StudentOverview";
import AvailableTasks from "@/pages/student/AvailableTasks";
import AssignedTasks from "@/pages/student/AssignedTasks";
import CompletedTasks from "@/pages/student/CompletedTasks";
import MyApplications from "@/pages/student/MyApplications";
import Earnings from "@/pages/student/Earnings";
import SkillVerificationPage from "@/pages/student/SkillVerificationPage";
import StudentProfile from "@/pages/student/StudentProfile";

import ClientOverview from "@/pages/client/ClientOverview";
import AddTask from "@/pages/client/AddTask";
import MyTasks from "@/pages/client/MyTasks";
import TaskApplicants from "@/pages/client/TaskApplicants";
import ClientCompletedTasks from "@/pages/client/ClientCompletedTasks";
import ClientAnalytics from "@/pages/client/ClientAnalytics";
import TalentSearch from "@/pages/client/TalentSearch";

function AppRoutes() {
  const { isLoadingAuth, currentUser, userProfile } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={currentUser ? <Navigate to="/profile-setup" replace /> : <Login />} />
      <Route path="/companies" element={<CompanyCredentials />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/task/:id" element={<TaskDetail />} />
      <Route path="/profile-setup" element={currentUser ? <ProfileSetup /> : <Navigate to="/login" replace />} />

      {/* Student routes */}
      <Route element={<ProtectedRoute requiredRole="student" />}>
        <Route path="/student" element={<StudentDashboard />}>
          <Route index element={<StudentOverview />} />
          <Route path="tasks" element={<AvailableTasks />} />
          <Route path="applications" element={<MyApplications />} />
          <Route path="assigned" element={<AssignedTasks />} />
          <Route path="completed" element={<CompletedTasks />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="skill-verification" element={<SkillVerificationPage />} />
          <Route path="disputes" element={<Disputes />} />
          <Route path="notifications" element={<NotificationCenter />} />
        </Route>
      </Route>

      {/* Client routes */}
      <Route element={<ProtectedRoute requiredRole="client" />}>
        <Route path="/client" element={<ClientDashboard />}>
          <Route index element={<ClientOverview />} />
          <Route path="add-task" element={<AddTask />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="task/:id" element={<TaskApplicants />} />
          <Route path="completed" element={<ClientCompletedTasks />} />
          <Route path="analytics" element={<ClientAnalytics />} />
          <Route path="disputes" element={<Disputes />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="talent" element={<TalentSearch />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </Router>
        <SonnerToaster richColors position="top-right" />
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
