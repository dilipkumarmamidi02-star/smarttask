import { useState, useEffect } from "react";
import { entities } from "@/lib/firestore";
import { uploadFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload, FileDown, Paperclip, Send } from "lucide-react";

export default function TaskDeliverables({ taskId, task, currentUser }) {
  const [deliverables, setDeliverables] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isAssignedStudent = currentUser?.email === task?.assigned_to;
  const isClient = currentUser?.user_role === "client";
  const canUpload = isAssignedStudent;
  const canView = isAssignedStudent || isClient;

  useEffect(() => {
    async function load() {
      const items = await entities.Deliverable.filter({ task_id: taskId }, "-created_date");
      setDeliverables(items);
      setLoading(false);
    }
    load();
  }, [taskId]);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await uploadFile({ file });
    await entities.Deliverable.create({
      task_id: taskId,
      uploaded_by: currentUser.email,
      file_url,
      file_name: file.name,
      file_type: file.type,
      description,
    });
    const updated = await entities.Deliverable.filter({ task_id: taskId }, "-created_date");
    setDeliverables(updated);
    setDescription("");
    setUploading(false);
    toast.success('File uploaded! Use "Submit Work" to send to client.');
  }

  if (!canView || loading) return null;

  return (
    <div className="border-t border-border pt-6 space-y-4">
      <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
        <Paperclip size={16} /> Deliverables
      </h3>

      {canUpload && deliverables.length > 0 && (
        <Button
          className="w-full font-heading"
          disabled={submitting}
          onClick={async () => {
            setSubmitting(true);
            await entities.Notification.create({
              user_email: task.posted_by,
              title: `Work Submitted: ${task.title}`,
              message: `The student has submitted their work for "${task.title}". Please review the deliverables and mark the task as complete.`,
              type: "task",
              link: `/client/task/${taskId}`,
              is_read: false,
            });
            toast.success("Work submitted to client! They will review and release payment.");
            setSubmitting(false);
          }}
        >
          {submitting ? (
            <Loader2 size={14} className="animate-spin mr-2" />
          ) : (
            <Send size={14} className="mr-2" />
          )}
          Submit Work to Client
        </Button>
      )}

      {canUpload && (
        <div className="space-y-2">
          <Label>Description (optional)</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Final design files"
          />
          <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
            {uploading ? (
              <Loader2 size={16} className="animate-spin text-primary" />
            ) : (
              <Upload size={16} className="text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {uploading ? "Uploading..." : "Click to upload file"}
            </span>
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      )}

      {deliverables.length === 0 ? (
        <p className="text-sm text-muted-foreground">No deliverables uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {deliverables.map((d) => (
            <div key={d.id} className="flex items-center gap-3 bg-muted rounded-lg p-3">
              <FileDown size={16} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{d.file_name}</p>
                {d.description && (
                  <p className="text-xs text-muted-foreground">{d.description}</p>
                )}
              </div>
              <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">
                  Download
                </Button>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
