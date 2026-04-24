import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/lib/firestore";
import { Link } from "react-router-dom";
import { Loader2, IndianRupee, Calendar, Users } from "lucide-react";
import SkillBadge from "@/components/SkillBadge";
import moment from "moment";

const statusColors = {
  open: "bg-green-500/10 text-green-400",
  assigned: "bg-blue-500/10 text-blue-400",
  completed: "bg-purple-500/10 text-purple-400",
  closed: "bg-muted text-muted-foreground",
};

export default function MyTasks() {
  const { userProfile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [appCounts, setAppCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    async function load() {
      const myTasks = await entities.Task.filter({ posted_by: userProfile.email }, "-created_date");
      setTasks(myTasks);
      const allApps = await entities.Application.list("-created_date", 500);
      const counts = {};
      allApps.forEach((a) => { counts[a.task_id] = (counts[a.task_id] || 0) + 1; });
      setAppCounts(counts);
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
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-foreground">My Tasks</h2>
        <Link
          to="/client/add-task"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-semibold hover:opacity-90 transition-opacity"
        >
          + New Task
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">No tasks posted yet.</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Link key={task.id} to={`/client/task/${task.id}`} className="block">
              <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-semibold text-card-foreground truncate">
                      {task.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <IndianRupee size={12} />₹{task.budget}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />{moment(task.deadline).format("MMM D")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} />{appCounts[task.id] || 0} applicants
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[task.status]}`}
                  >
                    {task.status}
                  </span>
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
