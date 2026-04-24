import { useEffect, useRef } from "react";
import { entities } from "@/lib/firestore";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { Bell, CheckCircle, Flag } from "lucide-react";

const iconMap = {
  application: CheckCircle,
  task: Flag,
  review: CheckCircle,
  system: Bell,
  dispute: Bell,
};

export default function NotificationPoller({ onCountChange }) {
  const { userProfile } = useAuth();
  const seenIds = useRef(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!userProfile?.email) return;

    async function poll() {
      const notifs = await entities.Notification.filter(
        { user_email: userProfile.email, is_read: false },
        "-created_date",
        20
      );

      if (!initialized.current) {
        notifs.forEach((n) => seenIds.current.add(n.id));
        initialized.current = true;
        onCountChange?.(notifs.length);
        return;
      }

      const newOnes = notifs.filter((n) => !seenIds.current.has(n.id));
      newOnes.forEach((n) => {
        seenIds.current.add(n.id);
        const Icon = iconMap[n.type] || Bell;
        toast(n.title, {
          description: n.message,
          duration: 6000,
          icon: <Icon size={16} />,
          action: n.link
            ? { label: "View", onClick: () => (window.location.href = n.link) }
            : undefined,
        });
      });

      onCountChange?.(notifs.length);
    }

    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [userProfile?.email]);

  return null;
}
