import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/lib/firestore";
import { Loader2 } from "lucide-react";
import TaskCard from "@/components/TaskCard";

export default function CompletedTasks() {
  const { userProfile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    async function load() {
      const all = await entities.Task.filter({ assigned_to: userProfile.email, status: "completed" });
      setTasks(all);
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
      <h2 className="font-heading text-2xl font-bold text-foreground">Completed Tasks</h2>
      {tasks.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">No completed tasks yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} userSkills={userProfile?.skills || []} />
          ))}
        </div>
      )}
    </div>
  );
}
