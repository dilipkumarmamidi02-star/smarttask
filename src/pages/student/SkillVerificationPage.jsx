import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/lib/firestore";
import { uploadFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Upload, BadgeCheck, Clock, XCircle } from "lucide-react";
import { SKILL_CATEGORIES } from "@/lib/skillsData";

const allSkills = Object.values(SKILL_CATEGORIES).flat();

const statusIcons = {
  pending: <Clock size={14} className="text-yellow-500" />,
  verified: <BadgeCheck size={14} className="text-green-500" />,
  rejected: <XCircle size={14} className="text-red-500" />,
};

export default function SkillVerificationPage() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ skill: "", proof_url: "", proof_file_url: "", notes: "" });

  useEffect(() => {
    if (!userProfile) return;
    async function load() {
      const verifs = await entities.SkillVerification.filter(
        { user_email: userProfile.email },
        "-created_date"
      );
      setVerifications(verifs);
      setLoading(false);
    }
    load();
  }, [userProfile]);

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await uploadFile({ file });
    setForm((prev) => ({ ...prev, proof_file_url: file_url }));
    setUploading(false);
    toast.success("File uploaded");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.skill) { toast.error("Please select a skill"); return; }
    if (!form.proof_url && !form.proof_file_url) {
      toast.error("Please provide a proof URL or upload a file");
      return;
    }
    const alreadySubmitted = verifications.find(
      (v) => v.skill === form.skill && v.status !== "rejected"
    );
    if (alreadySubmitted) {
      toast.error("You already have a pending/verified submission for this skill");
      return;
    }
    setSubmitting(true);
    await entities.SkillVerification.create({
      ...form,
      user_email: userProfile.email,
      user_name: userProfile.full_name,
      status: "pending",
    });
    toast.success("Verification request submitted!");
    setShowForm(false);
    setForm({ skill: "", proof_url: "", proof_file_url: "", notes: "" });
    const updated = await entities.SkillVerification.filter(
      { user_email: userProfile.email },
      "-created_date"
    );
    setVerifications(updated);
    setSubmitting(false);
  }

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  const verifiedSkills = verifications.filter((v) => v.status === "verified").map((v) => v.skill);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Skill Verification</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Get a verified badge on your profile by submitting proof of your skills.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "outline" : "default"}
          className="font-heading"
        >
          {showForm ? "Cancel" : <><ShieldCheck size={16} className="mr-2" /> Submit Proof</>}
        </Button>
      </div>

      {verifiedSkills.length > 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <p className="text-sm font-semibold text-green-500 mb-2">✓ Verified Skills</p>
          <div className="flex flex-wrap gap-2">
            {verifiedSkills.map((s) => (
              <span
                key={s}
                className="flex items-center gap-1 bg-green-500/10 text-green-600 border border-green-500/30 text-xs px-2 py-1 rounded-full font-medium"
              >
                <BadgeCheck size={12} /> {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground">Submit Verification Request</h3>

          <div>
            <Label>Skill *</Label>
            <Select value={form.skill} onValueChange={(v) => setForm({ ...form, skill: v })}>
              <SelectTrigger><SelectValue placeholder="Select a skill" /></SelectTrigger>
              <SelectContent>
                {allSkills.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Certificate / Portfolio URL</Label>
            <Input
              value={form.proof_url}
              onChange={(e) => setForm({ ...form, proof_url: e.target.value })}
              placeholder="https://linkedin.com/in/... or certificate link"
            />
          </div>

          <div>
            <Label>Or Upload Certificate File</Label>
            <label className="flex items-center gap-2 cursor-pointer mt-2 border border-dashed border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
              {uploading ? (
                <Loader2 size={16} className="animate-spin text-primary" />
              ) : (
                <Upload size={16} className="text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                {form.proof_file_url ? "File uploaded ✓" : "Click to upload"}
              </span>
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>

          <div>
            <Label>Additional Notes</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any context for the admin..."
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full font-heading">
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</>
            ) : (
              "Submit for Review"
            )}
          </Button>
        </form>
      )}

      {verifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ShieldCheck size={32} className="mx-auto mb-3 opacity-30" />
          <p>No verification requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {verifications.map((v) => (
            <div key={v.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {statusIcons[v.status]}
                  <span className="font-medium text-card-foreground">{v.skill}</span>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${
                    v.status === "verified"
                      ? "bg-green-500/10 text-green-500 border-green-500/30"
                      : v.status === "rejected"
                      ? "bg-red-500/10 text-red-500 border-red-500/30"
                      : "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                  }`}
                >
                  {v.status}
                </span>
              </div>
              {v.admin_feedback && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Admin: {v.admin_feedback}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
