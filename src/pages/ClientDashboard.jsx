import { LayoutDashboard, PlusCircle, List, CheckCircle, BarChart3, AlertTriangle, Bell, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const navItems = [
  { path: "/client", label: "Dashboard", icon: LayoutDashboard },
  { path: "/client/add-task", label: "Post New Task", icon: PlusCircle },
  { path: "/client/my-tasks", label: "My Tasks", icon: List },
  { path: "/client/completed", label: "Completed Tasks", icon: CheckCircle },
  { path: "/client/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/client/talent", label: "Talent Search", icon: Search },
  { path: "/client/disputes", label: "Disputes", icon: AlertTriangle },
  { path: "/client/notifications", label: "Notifications", icon: Bell },
];

export default function ClientDashboard() {
  return <DashboardLayout navItems={navItems} />;
}
