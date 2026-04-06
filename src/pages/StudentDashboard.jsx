// StudentDashboard.jsx
import { LayoutDashboard, List, CheckCircle, Loader2, AlertTriangle, Bell, Briefcase, User, IndianRupee, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const navItems = [
  { path: "/student", label: "Dashboard", icon: LayoutDashboard },
  { path: "/student/tasks", label: "Browse Tasks", icon: List },
  { path: "/student/applications", label: "My Applications", icon: Briefcase },
  { path: "/student/assigned", label: "Assigned Tasks", icon: CheckCircle },
  { path: "/student/completed", label: "Completed Tasks", icon: CheckCircle },
  { path: "/student/earnings", label: "Earnings", icon: IndianRupee },
  { path: "/student/skill-verification", label: "Skill Verification", icon: ShieldCheck },
  { path: "/student/profile", label: "My Profile", icon: User },
  { path: "/student/disputes", label: "Disputes", icon: AlertTriangle },
  { path: "/student/notifications", label: "Notifications", icon: Bell },
];

export default function StudentDashboard() {
  return <DashboardLayout navItems={navItems} />;
}
