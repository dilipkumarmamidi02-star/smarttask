import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/lib/firestore";
import { Loader2, Sparkles, TrendingUp } from "lucide-react";
import StatsBar from "@/components/StatsBar";
import TaskCard from "@/components/TaskCard";
import { calculateSkillMatch } from "@/lib/skillsData";

export default function StudentOverview() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [recentTasks, setRecentTasks] = useState({});

  useEffect(() => {
    if (!userProfile) return;
    async function load() {
      const skills = userProfile.skills || [];
      const [apps, tasks, completedApps, reviews] = await Promise.all([
        entities.Application.filter({ user_email: userProfile.email }),
        entities.Task.filter({ status: "open" }, "-created_date", 20),
        entities.Task.filter({ assigned_to: userProfile.email, status: "completed" }),
        entities.Review.filter({ student_email: userProfile.email }),
      ]);

      const applied = apps.length;
      const assigned = apps.filter((a) => a.status === "accepted").length;
      const profileFields = [
        userProfile.education,
        userProfile.skill_category,
        userProfile.skills?.length,
        userProfile.experience_level,
        userProfile.college,
        userProfile.bio,
      ];
      const profilePct = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

      setStats([
        { label: "Tasks Applied", value: applied },
        { label: "Tasks Assigned", value: assigned },
        { label: "Tasks Completed", value: completedApps.length },
        { label: "Profile Completion", value: `${profilePct}%` },
      ]);

      const avgRating =
        reviews.length > 0
          ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
          : 3;

      const scored = tasks
        .map((t) => {
          const matchPct = calculateSkillMatch(skills, t.required_skills);
          const recencyScore =
            1 / (1 + Math.abs(new Date() - new Date(t.created_date)) / 86400000);
          const budgetScore = Math.min((t.budget || 0) / 5000, 1);
          const score =
            matchPct * 0.6 +
            recencyScore * 100 * 0.2 +
            budgetScore * 0.1 +
            (avgRating / 5) * 0.1;
          return { ...t, _score: score };
        })
        .filter((t) => t._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, 6);

      const topMatches = scored.filter(
        (t) => calculateSkillMatch(skills, t.required_skills) >= 50
      );
      const otherRec = scored.filter(
        (t) => calculateSkillMatch(skills, t.required_skills) < 50
      );
      setRecentTasks({ topMatches, otherRec, allSkills: skills });
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

  const { topMatches = [], otherRec = [], allSkills = [] } = recentTasks;

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold text-foreground">Dashboard</h2>
      <StatsBar stats={stats} />

      {allSkills.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          💡 <strong>Tip:</strong> Add skills to your profile to get personalized task recommendations.
        </div>
      )}

      {topMatches.length > 0 && (
        <div>
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> Best Matches for You
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {topMatches.map((t) => (
              <TaskCard key={t.id} task={t} userSkills={allSkills} />
            ))}
          </div>
        </div>
      )}

      {otherRec.length > 0 && (
        <div>
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-muted-foreground" /> Other Recommendations
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {otherRec.map((t) => (
              <TaskCard key={t.id} task={t} userSkills={allSkills} />
            ))}
          </div>
        </div>
      )}

      {topMatches.length === 0 && otherRec.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No open tasks right now</p>
          <p className="text-sm">Check back soon — new tasks are posted daily!</p>
        </div>
      )}
    </div>
  );
}
