import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/lib/firestore";
import { uploadFile } from "@/lib/storage";
import { SKILL_CATEGORIES, EDUCATION_LEVELS, EXPERIENCE_LEVELS } from "@/lib/skillsData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import StarRating from "@/components/StarRating";

export default function StudentProfile() {
  const { userProfile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!userProfile) return;
    setForm({
      education: userProfile.education || "",
      skill_category: userProfile.skill_category || "",
      skills: userProfile.skills || [],
      experience_level: userProfile.experience_level || "",
      college: userProfile.college || "",
      bio: userProfile.bio || "",
      profile_photo: userProfile.profile_photo || "",
      email_notifications: userProfile.email_notifications !== false,
    });
    entities.Review.filter({ student_email: userProfile.email }).then(setReviews);
    setLoading(false);
  }, [userProfile]);

  const availableSkills = form.skill_category ? SKILL_CATEGORIES[form.skill_category] || [] : [];
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

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
    const { file_url } = await uploadFile({ file });
    setForm((prev) => ({ ...prev, profile_photo: file_url }));
  }

  async function handleSave() {
    setSaving(true);
    await updateProfile(form);
    toast.success("Profile updated!");
    setSaving(false);
  }

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="font-heading text-2xl font-bold text-foreground">My Profile</h2>

      {reviews.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <StarRating rating={Math.round(avgRating)} size={20} />
          <span className="font-heading font-bold text-foreground">{avgRating}</span>
          <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-4">
          {form.profile_photo ? (
            <img
              src={form.profile_photo}
              alt=""
              className="h-16 w-16 rounded-full object-cover border-2 border-primary"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Upload size={20} className="text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-heading font-semibold text-foreground">{userProfile?.full_name}</p>
            <p className="text-xs text-muted-foreground">{userProfile?.email}</p>
            <label className="cursor-pointer text-xs text-primary hover:underline">
              Change photo
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Education</Label>
            <Select value={form.education} onValueChange={(v) => setForm({ ...form, education: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EDUCATION_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Experience</Label>
            <Select value={form.experience_level} onValueChange={(v) => setForm({ ...form, experience_level: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPERIENCE_LEVELS.map((l) => (
                  <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Skill Category</Label>
          <Select
            value={form.skill_category}
            onValueChange={(v) => setForm({ ...form, skill_category: v, skills: [] })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.keys(SKILL_CATEGORIES).map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {availableSkills.length > 0 && (
          <div>
            <Label>Skills</Label>
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
          <Label>College</Label>
          <Input
            value={form.college}
            onChange={(e) => setForm({ ...form, college: e.target.value })}
          />
        </div>

        <div>
          <Label>Bio</Label>
          <Textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value.slice(0, 300) })}
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">{form.bio?.length || 0}/300</p>
        </div>

        <div className="flex items-center justify-between">
          <Label>Email Notifications</Label>
          <Switch
            checked={form.email_notifications}
            onCheckedChange={(v) => setForm({ ...form, email_notifications: v })}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full font-heading">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
