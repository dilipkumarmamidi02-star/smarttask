import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/lib/firestore";
import { SKILL_CATEGORIES } from "@/lib/skillsData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

export default function AddTask() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "", required_skills: [],
    budget: "", deadline: "", task_type: "one-time",
  });

  const allSkillsForCategory = form.category ? SKILL_CATEGORIES[form.category] || [] : [];

  function toggleSkill(skill) {
    setForm((prev) => ({
      ...prev,
      required_skills: prev.required_skills.includes(skill)
        ? prev.required_skills.filter((s) => s !== skill)
        : [...prev.required_skills, skill],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.description || !form.category || !form.required_skills.length || !form.budget || !form.deadline) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    const newTask = await entities.Task.create({
      ...form,
      budget: Number(form.budget),
      company_name: userProfile?.company_name || userProfile?.full_name || "Company",
      posted_by: userProfile?.email,
      status: "open",
    });

    // Notify matching students
    try {
      const allStudents = await entities.Application.filter({});
      const studentEmails = [...new Set(allStudents.map((a) => a.user_email))];
      for (const email of studentEmails) {
        await entities.Notification.create({
          user_email: email,
          title: `New Task: ${form.title}`,
          message: `A new task was posted: "${form.title}" — Budget ₹${form.budget}`,
          type: "task",
          link: `/task/${newTask.id}`,
          is_read: false,
        });
      }
    } catch {
      // non-critical
    }

    toast.success("Task posted successfully!");
    navigate("/client/my-tasks");
    setSaving(false);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="font-heading text-2xl font-bold text-foreground">Post New Task</h2>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div>
          <Label>Company Name</Label>
          <Input
            value={userProfile?.company_name || userProfile?.full_name || ""}
            disabled
            className="bg-muted"
          />
        </div>

        <div>
          <Label>Task Title *</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Build HTML Portfolio Website"
          />
        </div>

        <div>
          <Label>Task Description *</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            placeholder="Describe the task in detail..."
          />
        </div>

        <div>
          <Label>Category *</Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm({ ...form, category: v, required_skills: [] })}
          >
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {Object.keys(SKILL_CATEGORIES).map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
              <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {allSkillsForCategory.length > 0 && (
          <div>
            <Label>Required Skills *</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {allSkillsForCategory.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    form.required_skills.includes(skill)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {skill}
                  {form.required_skills.includes(skill) && (
                    <X size={12} className="inline ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Budget (₹) *</Label>
            <Input
              type="number"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              placeholder="e.g. 500"
            />
          </div>
          <div>
            <Label>Deadline *</Label>
            <Input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label>Task Type</Label>
          <Select
            value={form.task_type}
            onValueChange={(v) => setForm({ ...form, task_type: v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="one-time">One-Time</SelectItem>
              <SelectItem value="recurring">Recurring</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={saving} className="w-full font-heading">
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Posting...</>
          ) : (
            "Post Task"
          )}
        </Button>
      </form>
    </div>
  );
}
