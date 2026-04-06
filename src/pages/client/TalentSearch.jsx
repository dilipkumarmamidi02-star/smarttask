import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/lib/firestore";
import { Loader2, Search, Star, CheckCircle, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TalentSearch() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [topRatedOnly, setTopRatedOnly] = useState(false);
  const [myTasks, setMyTasks] = useState([]);
  const [inviting, setInviting] = useState(null);

  useEffect(() => {
    if (!userProfile) return;
    async function load() {
      const [reviews, verifications, tasks, completedTasks] = await Promise.all([
        entities.Review.list("-created_date", 200),
        entities.SkillVerification.filter({ status: "verified" }),
        entities.Task.filter({ posted_by: userProfile.email, status: "open" }),
        entities.Task.filter({ status: "completed" }),
      ]);

      const statsMap = {};
      reviews.forEach((r) => {
        if (!statsMap[r.student_email])
          statsMap[r.student_email] = { total: 0, count: 0 };
        statsMap[r.student_email].total += r.rating;
        statsMap[r.student_email].count += 1;
      });

      const verifiedMap = {};
      verifications.forEach((v) => {
        if (!verifiedMap[v.user_email]) verifiedMap[v.user_email] = [];
        verifiedMap[v.user_email].push(v.skill);
      });

      const completedMap = {};
      completedTasks.forEach((t) => {
        if (t.assigned_to)
          completedMap[t.assigned_to] = (completedMap[t.assigned_to] || 0) + 1;
      });

      const emailSet = new Set([
        ...Object.keys(statsMap),
        ...Object.keys(verifiedMap),
      ]);
      const studentList = Array.from(emailSet)
        .map((email) => ({
          email,
          avgRating: statsMap[email]
            ? statsMap[email].total / statsMap[email].count
            : 0,
          reviewCount: statsMap[email]?.count || 0,
          verifiedSkills: verifiedMap[email] || [],
          completedCount: completedMap[email] || 0,
        }))
        .sort((a, b) => b.avgRating - a.avgRating);

      setStudents(studentList);
      setMyTasks(tasks);
      setLoading(false);
    }
    load();
  }, [userProfile]);

  async function inviteStudent(studentEmail, task) {
    setInviting(studentEmail);
    await entities.Notification.create({
      user_email: studentEmail,
      title: `Invitation: ${task.title}`,
      message: `You've been invited by a client to apply for "${task.title}" (₹${task.budget}). Check the marketplace!`,
      type: "task",
      link: `/task/${task.id}`,
      is_read: false,
    });
    toast.success(`Invitation sent to ${studentEmail}`);
    setInviting(null);
  }

  const filtered = students
    .filter(
      (s) =>
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        s.verifiedSkills.some((sk) =>
          sk.toLowerCase().includes(search.toLowerCase())
        )
    )
    .filter((s) => !topRatedOnly || (s.avgRating >= 4 && s.reviewCount > 0));

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Talent Search</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Browse verified student profiles and invite them to your tasks.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by skill or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant={topRatedOnly ? "default" : "outline"}
          size="sm"
          className="flex items-center gap-1.5"
          onClick={() => setTopRatedOnly((p) => !p)}
        >
          <Star size={14} className={topRatedOnly ? "fill-yellow-300 text-yellow-300" : ""} />
          Top Rated
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShieldCheck size={36} className="mx-auto mb-3 opacity-20" />
          <p>No verified talent found yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((s) => (
            <div key={s.email} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground text-sm">{s.email}</p>
                  {s.avgRating >= 4 && s.reviewCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-400/10 text-yellow-600 border border-yellow-400/30 rounded-full px-2 py-0.5 font-semibold mb-1">
                      <Star size={9} className="fill-yellow-500 text-yellow-500" /> Top Rated
                    </span>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-muted-foreground">
                      {s.avgRating.toFixed(1)} ({s.reviewCount} reviews)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-500 text-xs">
                    <CheckCircle size={12} />
                    <span>{s.completedCount} completed</span>
                  </div>
                </div>
              </div>

              {s.verifiedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {s.verifiedSkills.map((sk) => (
                    <span
                      key={sk}
                      className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full font-medium flex items-center gap-1"
                    >
                      <ShieldCheck size={9} /> {sk}
                    </span>
                  ))}
                </div>
              )}

              {myTasks.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    Invite to your task:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {myTasks.slice(0, 3).map((t) => (
                      <Button
                        key={t.id}
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        disabled={inviting === s.email}
                        onClick={() => inviteStudent(s.email, t)}
                      >
                        {inviting === s.email ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          t.title.slice(0, 20) + "..."
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
