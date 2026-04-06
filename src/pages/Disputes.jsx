import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/lib/firestore";
import { uploadFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Upload, ChevronDown, ChevronUp } from "lucide-react";

const statusColors = {
  open: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  under_review: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  resolved: "bg-green-500/10 text-green-500 border-green-500/30",
  closed: "bg-muted text-muted-foreground border-border",
};

export default function Disputes() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myTasks, setMyTasks] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ task_id: "", issue_type: "", description: "", evidence_urls: [] });

  useEffect(() => {
    if (!userProfile) return;
    async function load() {
      const [myDisp, tasks] = await Promise.all([
        entities.Dispute.filter({ raised_by: userProfile.email }, "-created_date"),
        userProfile.user_role === "student"
          ? entities.Task.filter({ assigned_to: userProfile.email })
          : entities.Task.filter({ posted_by: userProfile.email }),
      ]);
      setDisputes(myDisp);
      setMyTasks(tasks);
      setLoading(false);
    }
    load();
  }, [userProfile]);

  async function handleEvidenceUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await uploadFile({ file });
    setForm((prev) => ({ ...prev, evidence_urls: [...prev.evidence_urls, file_url] }));
    setUploading(false);
    toast.success("File uploaded");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.task_id || !form.issue_type || !form.description) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    const task = myTasks.find((t) => t.id === form.task_id);
    await entities.Dispute.create({
      ...form,
      task_title: task?.title || "",
      raised_by: userProfile.email,
      raised_by_name: userProfile.full_name,
      raised_by_role: userProfile.user_role,
      status: "open",
    });
    const escrows = await entities.Escrow.filter({ task_id: form.task_id, status: "held" });
    for (const esc of escrows) {
      await entities.Escrow.update(esc.id, { status: "disputed" });
    }
    toast.success("Dispute raised. Escrow payment has been paused pending admin review.");
    setShowForm(false);
    setForm({ task_id: "", issue_type: "", description: "", evidence_urls: [] });
    const updated = await entities.Dispute.filter({ raised_by: userProfile.email }, "-created_date");
    setDisputes(updated);
    setSubmitting(false);
  }

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-foreground">Task Disputes</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "outline" : "default"}
          className="font-heading"
        >
          {showForm ? "Cancel" : <><AlertTriangle size={16} className="mr-2" /> Raise Dispute</>}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground">New Dispute</h3>

          <div>
            <Label>Related Task *</Label>
            <Select value={form.task_id} onValueChange={(v) => setForm({ ...form, task_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select task" /></SelectTrigger>
              <SelectContent>
                {myTasks.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Issue Type *</Label>
            <Select value={form.issue_type} onValueChange={(v) => setForm({ ...form, issue_type: v })}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {["Payment", "Quality", "Deadline", "Communication", "Other"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Describe the issue in detail..."
            />
          </div>

          <div>
            <Label>Upload Evidence (optional)</Label>
            <label className="flex items-center gap-2 cursor-pointer mt-2 border border-dashed border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
              {uploading ? (
                <Loader2 size={16} className="animate-spin text-primary" />
              ) : (
                <Upload size={16} className="text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">Click to upload files</span>
              <input type="file" className="hidden" onChange={handleEvidenceUpload} disabled={uploading} />
            </label>
            {form.evidence_urls.length > 0 && (
              <div className="mt-2 space-y-1">
                {form.evidence_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline block">
                    Evidence {i + 1}
                  </a>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={submitting} className="w-full font-heading">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : "Submit Dispute"}
          </Button>
        </form>
      )}

      {disputes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
          <p>No disputes raised yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <div key={d.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                className="w-full text-left p-4 flex items-center justify-between gap-3"
                onClick={() => setExpanded(expanded === d.id ? null : d.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-card-foreground truncate">{d.task_title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold capitalize ${statusColors[d.status]}`}>
                      {d.status.replace("_", " ")}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {d.issue_type}
                    </span>
                  </div>
                </div>
                {expanded === d.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {expanded === d.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground">{d.description}</p>
                  {d.evidence_urls?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">Evidence Files:</p>
                      {d.evidence_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline block">
                          View Evidence {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                  {d.admin_notes && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-500 mb-1">Admin Notes</p>
                      <p className="text-sm text-foreground">{d.admin_notes}</p>
                    </div>
                  )}
                  {d.resolution && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-500 mb-1">Resolution</p>
                      <p className="text-sm text-foreground">{d.resolution}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
