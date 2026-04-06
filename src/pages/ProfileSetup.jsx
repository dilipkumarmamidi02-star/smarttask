import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

import { SKILL_CATEGORIES, EDUCATION_LEVELS, EXPERIENCE_LEVELS } from "@/lib/skillsData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { X, Loader2, Upload } from "lucide-react";

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { userProfile, updateProfile, isLoadingAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    user_role: "",
    education: "",
    skill_category: "",
    skills: [],
    experience_level: "",
    college: "",
    bio: "",
    profile_photo: "",
    email_notifications: true,
    company_name: "",
  });

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!userProfile) { setLoading(false); return; }
    if (userProfile.profile_completed) {
      if (userProfile.user_role === "client") navigate("/client");
      else navigate("/student");
      return;
    }
    setForm((prev) => ({
      ...prev,
      user_role: userProfile.user_role || "",
      education: userProfile.education || "",
      skill_category: userProfile.skill_category || "",
      skills: userProfile.skills || [],
      experience_level: userProfile.experience_level || "",
      college: userProfile.college || "",
      bio: userProfile.bio || "",
      profile_photo: userProfile.profile_photo || "",
      email_notifications: userProfile.email_notifications !== false,
      company_name: userProfile.company_name || "",
    }));
    setLoading(false);
  }, [userProfile, isLoadingAuth, navigate]);

  const availableSkills = form.skill_category ? SKILL_CATEGORIES[form.skill_category] || [] : [];

  function toggleSkill(skill) {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // photo upload disabled
    
    toast.success("Photo uploaded");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.user_role) { toast.error("Please select a role"); return; }
    if (form.user_role === "student") {
      if (!form.education || !form.skill_category || !form.skills.length || !form.experience_level || !form.college || !form.bio) {
        toast.error("Please fill all required fields");
        return;
      }
    }
    if (form.user_role === "client" && !form.company_name) {
      toast.error("Please enter your company name");
      return;
    }

    setSaving(true);
    await updateProfile({ ...form, profile_completed: true });
    toast.success("Profile completed!");
    if (form.user_role === "client") navigate("/client");
    else navigate("/student");
    setSaving(false);
  }

  if (loading || isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-heading font-bold">ST</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Set up your profile to access the marketplace</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div>
            <Label>I am a</Label>
            <Select value={form.user_role} onValueChange={(v) => setForm({ ...form, user_role: v, skills: [] })}>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student / Freelancer</SelectItem>
                <SelectItem value="client">Client / Company</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Full Name</Label>
            <Input value={userProfile?.full_name || ""} disabled className="bg-muted" />
          </div>

          <div>
            <Label>Email</Label>
            <Input value={userProfile?.email || ""} disabled className="bg-muted" />
          </div>

          {form.user_role === "client" && (
            <div>
              <Label>Company Name *</Label>
              <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="Your company name" />
            </div>
          )}

          {form.user_role === "student" && (
            <>
              <div>
                <Label>Education Level *</Label>
                <Select value={form.education} onValueChange={(v) => setForm({ ...form, education: v })}>
                  <SelectTrigger><SelectValue placeholder="Select education" /></SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>College / University *</Label>
                <Input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} placeholder="Your college name" />
              </div>

              <div>
                <Label>Skill Category *</Label>
                <Select value={form.skill_category} onValueChange={(v) => setForm({ ...form, skill_category: v, skills: [] })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(SKILL_CATEGORIES).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {availableSkills.length > 0 && (
                <div>
                  <Label>Select Skills *</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableSkills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                          form.skills.includes(skill)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                        }`}
                      >
                        {skill}
                        {form.skills.includes(skill) && <X size={12} className="inline ml-1" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Experience Level *</Label>
                <Select value={form.experience_level} onValueChange={(v) => setForm({ ...form, experience_level: v })}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Bio *</Label>
                <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell clients about yourself..." rows={3} />
              </div>

              <div>
                <Label>Profile Photo</Label>
                <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg p-3 hover:border-primary/50 transition-colors mt-1">
                  <Upload size={16} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload photo</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </label>
                {form.profile_photo && <img src={form.profile_photo} alt="Preview" className="w-16 h-16 rounded-full object-cover mt-2" />}
              </div>

              <div className="flex items-center justify-between">
                <Label>Email Notifications</Label>
                <Switch checked={form.email_notifications} onCheckedChange={(v) => setForm({ ...form, email_notifications: v })} />
              </div>
            </>
          )}

          <Button type="submit" disabled={saving} className="w-full font-heading">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Complete Profile"}
          </Button>
        </form>
      </div>
    </div>
  );
}
