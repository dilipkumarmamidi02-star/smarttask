import { useState, useEffect } from "react";
import { entities } from "@/lib/firestore";
import { uploadFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, CheckCircle, Clock, XCircle, Send, Flag } from "lucide-react";

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "text-muted-foreground" },
  submitted: { label: "Submitted", icon: Send, color: "text-blue-500" },
  approved: { label: "Approved", icon: CheckCircle, color: "text-green-500" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-red-500" },
};

export default function MilestoneTracker({ taskId, task, currentUser }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState({});
  const [submissionFiles, setSubmissionFiles] = useState({});
  const [uploadingFile, setUploadingFile] = useState(null);

  const isStudent = currentUser?.email === task?.assigned_to;
  const isClient =
    currentUser?.user_role === "client" && currentUser?.email === task?.posted_by;

  useEffect(() => {
    load();
  }, [taskId]);

  async function load() {
    const items = await entities.Milestone.filter({ task_id: taskId }, "order");
    setMilestones(items);
    setLoading(false);
  }

  async function addMilestone() {
    if (!newTitle.trim()) return;
    setAdding(true);
    await entities.Milestone.create({
      task_id: taskId,
      title: newTitle,
      description: newDesc,
      order: milestones.length + 1,
      status: "pending",
      student_email: task.assigned_to,
      client_email: task.posted_by,
    });
    setNewTitle("");
    setNewDesc("");
    setShowAdd(false);
    await load();
    toast.success("Milestone added!");
    setAdding(false);
  }

  async function handleFileUpload(milestoneId, file) {
    setUploadingFile(milestoneId);
    const { file_url } = await uploadFile({ file });
    setSubmissionFiles((prev) => ({ ...prev, [milestoneId]: { url: file_url, name: file.name } }));
    setUploadingFile(null);
    toast.success("File uploaded");
  }

  async function submitMilestone(milestone) {
    const fileData = submissionFiles[milestone.id] || {};
    await entities.Milestone.update(milestone.id, {
      status: "submitted",
      submission_note: submissionNotes[milestone.id] || "",
      submission_file_url: fileData.url || "",
      submission_file_name: fileData.name || "",
    });
    await entities.Notification.create({
      user_email: task.posted_by,
      title: `Milestone Submitted: ${milestone.title}`,
      message: `Student has submitted milestone "${milestone.title}" for your review on task "${task.title}".`,
      type: "task",
      link: `/client/task/${taskId}`,
      is_read: false,
    });
    toast.success("Milestone submitted to client!");
    load();
  }

  async function approveMilestone(milestone) {
    await entities.Milestone.update(milestone.id, { status: "approved" });
    await entities.Notification.create({
      user_email: task.assigned_to,
      title: `Milestone Approved: ${milestone.title}`,
      message: `Client approved your milestone "${milestone.title}" for task "${task.title}".`,
      type: "task",
      link: `/task/${taskId}`,
      is_read: false,
    });

    const updated = await entities.Milestone.filter({ task_id: taskId });
    const allDone = updated.every((m) =>
      m.id === milestone.id ? true : m.status === "approved"
    );
    if (allDone && updated.length > 0) {
      const escrows = await entities.Escrow.filter({ task_id: taskId, status: "held" });
      for (const e of escrows) {
        await entities.Escrow.update(e.id, { status: "released" });
      }
      await entities.Notification.create({
        user_email: task.assigned_to,
        title: "🎉 Payment Released!",
        message: `All milestones approved! Payment of ₹${task.budget} for "${task.title}" has been released from escrow.`,
        type: "task",
        link: `/task/${taskId}`,
        is_read: false,
      });
      toast.success("All milestones complete — payment released to student!");
    } else {
      toast.success("Milestone approved!");
    }
    load();
  }

  async function rejectMilestone(milestone) {
    await entities.Milestone.update(milestone.id, { status: "rejected" });
    await entities.Notification.create({
      user_email: task.assigned_to,
      title: `Milestone Rejected: ${milestone.title}`,
      message: `Client rejected your milestone "${milestone.title}". Please revise and resubmit.`,
      type: "task",
      link: `/task/${taskId}`,
      is_read: false,
    });
    toast.error("Milestone rejected. Student notified.");
    load();
  }

  if (loading)
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  if (!isStudent && !isClient) return null;

  const allApproved =
    milestones.length > 0 && milestones.every((m) => m.status === "approved");

  return (
    <div className="border-t border-border pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
          <Flag size={16} /> Milestones
          {allApproved && (
            <span className="text-xs text-green-500 font-medium">✓ All Complete</span>
          )}
        </h3>
        {isStudent && (
          <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={14} className="mr-1" /> Add
          </Button>
        )}
      </div>

      {showAdd && isStudent && (
        <div className="bg-muted rounded-xl p-4 space-y-2">
          <Input
            placeholder="Milestone title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Textarea
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={addMilestone} disabled={adding}>
              {adding ? <Loader2 size={14} className="animate-spin" /> : "Add Milestone"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {milestones.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isStudent
            ? "Break your project into milestones to track progress."
            : "No milestones defined yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {milestones.map((m, i) => {
            const cfg = statusConfig[m.status] || statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <div key={m.id} className="bg-muted rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                    <p className="font-medium text-sm text-foreground">{m.title}</p>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                    <Icon size={12} /> {cfg.label}
                  </span>
                </div>
                {m.description && (
                  <p className="text-xs text-muted-foreground pl-7">{m.description}</p>
                )}
                {m.submission_note && (
                  <p className="text-xs text-blue-500 pl-7">Note: {m.submission_note}</p>
                )}
                {m.submission_file_url && (
                  <a
                    href={m.submission_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline pl-7 flex items-center gap-1"
                  >
                    📎 {m.submission_file_name || "View Attachment"}
                  </a>
                )}
                {m.client_feedback && (
                  <p className="text-xs text-muted-foreground pl-7 italic">
                    Feedback: {m.client_feedback}
                  </p>
                )}

                {isStudent && (m.status === "pending" || m.status === "rejected") && (
                  <div className="pl-7 space-y-2">
                    <Textarea
                      rows={2}
                      placeholder={
                        m.status === "rejected"
                          ? "Describe your revision..."
                          : "Add a note about your submission..."
                      }
                      value={submissionNotes[m.id] || ""}
                      onChange={(e) =>
                        setSubmissionNotes((prev) => ({ ...prev, [m.id]: e.target.value }))
                      }
                    />
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground border border-dashed border-border rounded-lg px-3 py-2 hover:border-primary/50 transition-colors">
                      {uploadingFile === m.id ? (
                        <Loader2 size={13} className="animate-spin text-primary" />
                      ) : (
                        <Plus size={13} />
                      )}
                      {submissionFiles[m.id] ? (
                        <span className="text-primary font-medium truncate max-w-[200px]">
                          {submissionFiles[m.id].name}
                        </span>
                      ) : (
                        "Attach file (PDF, ZIP, image)"
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.zip,.png,.jpg,.jpeg,.gif"
                        disabled={uploadingFile === m.id}
                        onChange={(e) =>
                          e.target.files?.[0] && handleFileUpload(m.id, e.target.files[0])
                        }
                      />
                    </label>
                    <Button
                      size="sm"
                      onClick={() => submitMilestone(m)}
                      disabled={uploadingFile === m.id}
                    >
                      <Send size={12} className="mr-1" />
                      {m.status === "rejected" ? "Resubmit" : "Submit to Client"}
                    </Button>
                  </div>
                )}

                {isClient && m.status === "submitted" && (
                  <div className="pl-7 flex gap-2">
                    <Button size="sm" onClick={() => approveMilestone(m)}>
                      <CheckCircle size={12} className="mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => rejectMilestone(m)}>
                      <XCircle size={12} className="mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
