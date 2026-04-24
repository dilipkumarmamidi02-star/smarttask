import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/lib/firestore";
import { Loader2, Bell, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import moment from "moment";

const typeColors = {
  application: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  task: "bg-primary/10 text-primary border-primary/20",
  dispute: "bg-red-500/10 text-red-500 border-red-500/20",
  review: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  system: "bg-muted text-muted-foreground border-border",
};

export default function NotificationCenter() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!userProfile) return;
    async function load() {
      const notifs = await entities.Notification.filter(
        { user_email: userProfile.email },
        "-created_date",
        50
      );
      setNotifications(notifs);
      setLoading(false);
    }
    load();
  }, [userProfile]);

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) => entities.Notification.update(n.id, { is_read: true })));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function markRead(id) {
    await entities.Notification.update(id, { is_read: true });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell size={22} /> Notifications
            {unreadCount > 0 && (
              <span className="text-sm bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-body">
                {unreadCount}
              </span>
            )}
          </h2>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="font-heading">
            <CheckCheck size={14} className="mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell size={36} className="mx-auto mb-3 opacity-20" />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`bg-card border border-border rounded-xl p-4 cursor-pointer transition-colors hover:border-primary/30 ${
                !n.is_read ? "border-primary/30 bg-primary/5" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold capitalize shrink-0 ${
                    typeColors[n.type] || typeColors.system
                  }`}
                >
                  {n.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {moment(n.created_date).fromNow()}
                  </p>
                </div>
                {n.link && (
                  <Link to={n.link} onClick={(e) => e.stopPropagation()}>
                    <ExternalLink size={14} className="text-muted-foreground hover:text-primary" />
                  </Link>
                )}
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
