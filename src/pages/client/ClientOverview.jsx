import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/lib/firestore";
import { Loader2 } from "lucide-react";
import StatsBar from "@/components/StatsBar";

export default function ClientOverview() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    if (!userProfile) return;
    async function load() {
      const myTasks = await entities.Task.filter({ posted_by: userProfile.email });
      const allApps = await entities.Application.list("-created_date", 500);
      const myTaskIds = new Set(myTasks.map((t) => t.id));
      const appsForMyTasks = allApps.filter((a) => myTaskIds.has(a.task_id));
      const active = myTasks.filter((t) => t.status === "open" || t.status === "assigned").length;
      const totalApps = appsForMyTasks.length;
      const assigned = myTasks.filter((t) => t.status === "assigned").length;
      const completed = myTasks.filter((t) => t.status === "completed").length;
      setStats([
        { label: "Active Tasks", value: active },
        { label: "Total Applications", value: totalApps },
        { label: "Tasks Assigned", value: assigned },
        { label: "Tasks Completed", value: completed },
      ]);
      setLoading(false);
    }
    load();
  }, [userProfile]);

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold text-foreground">Client Dashboard</h2>
      <StatsBar stats={stats} />
    </div>
  );
}
