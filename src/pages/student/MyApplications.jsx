import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/lib/firestore";
import { Loader2, Clock, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

const statusIcons = {
  pending: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  accepted: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
  rejected: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
};

export default function MyApplications() {
  const { userProfile } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    async function load() {
      const myApps = await entities.Application.filter(
        { user_email: userProfile.email },
        "-created_date"
      );
      setApps(myApps);
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
      <h2 className="font-heading text-2xl font-bold text-foreground">My Applications</h2>
      {apps.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">No applications yet.</p>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => {
            const s = statusIcons[app.status] || statusIcons.pending;
            const Icon = s.icon;
            return (
              <Link key={app.id} to={`/task/${app.task_id}`} className="block">
                <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
                  <div>
                    <h3 className="font-medium text-card-foreground">{app.task_title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {app.message?.slice(0, 80) || "No message"}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${s.bg} ${s.color}`}
                  >
                    <Icon size={14} />
                    <span className="capitalize">{app.status}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
