import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/lib/firestore";
import { Link } from "react-router-dom";
import { Loader2, IndianRupee, CheckCircle } from "lucide-react";
import SkillBadge from "@/components/SkillBadge";

export default function ClientCompletedTasks() {
  const { userProfile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    async function load() {
      const completed = await entities.Task.filter(
        { posted_by: userProfile.email, status: "completed" },
        "-updated_date"
      );
      setTasks(completed);
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
        <div className="space-y-3">
          {tasks.map((task) => (
            <Link key={task.id} to={`/client/task/${task.id}`} className="block">
              <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-card-foreground truncate">{task.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <IndianRupee size={12} />₹{task.budget}
                      {task.assigned_to && (
                        <span>· Assigned to: {task.assigned_to}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {task.required_skills?.slice(0, 4).map((s) => (
                    <SkillBadge key={s} skill={s} />
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
