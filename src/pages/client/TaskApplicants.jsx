import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle, XCircle, User, FileDown, Paperclip } from "lucide-react";
import SkillBadge from "@/components/SkillBadge";
import StarRating from "@/components/StarRating";
import InvoiceGenerator from "@/components/InvoiceGenerator";

export default function TaskApplicants() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [task, setTask] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [applicantProfiles, setApplicantProfiles] = useState({});
  const [applicantReviews, setApplicantReviews] = useState({});
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    async function load() {
      const found = await entities.Task.get(id);
      if (!found) { navigate(-1); return; }
      setTask(found);
      const apps = await entities.Application.filter({ task_id: id }, "-created_date");
      setApplicants(apps);
      const profiles = {};
      apps.forEach((a) => { profiles[a.user_email] = { email: a.user_email, full_name: a.user_name }; });
      setApplicantProfiles(profiles);
      const allRevs = await entities.Review.filter({ task_id: id });
      const revMap = {};
      allRevs.forEach((r) => { revMap[r.student_email] = r; });
      setApplicantReviews(revMap);
      const dels = await entities.Deliverable.filter({ task_id: id }, "-created_date");
      setDeliverables(dels);
      setLoading(false);
    }
    load();
  }, [id, navigate]);

  async function handleAccept(app) {
    setProcessing(app.id);
    await entities.Application.update(app.id, { status: "accepted" });
    await entities.Task.update(id, { status: "assigned" });
    const existing = await entities.Escrow.filter({ task_id: id, student_email: app.user_email });
    if (existing.length === 0) {
      await entities.Escrow.create({
        task_id: id, task_title: task.title,
        client_email: task.posted_by, student_email: app.user_email,
        amount: task.budget || 0, status: "held",
      });
    }
    await entities.Notification.create({
      user_email: app.user_email,
      title: "You've been selected!",
      message: `You were selected for "${task.title}". Payment of ₹${task.budget} is held in escrow.`,
      type: "task", link: `/task/${id}`, is_read: false,
    });
    toast.success(`${app.user_name} accepted!`);
    setApplicants((prev) => prev.map((a) => a.id === app.id ? { ...a, status: "accepted" } : a));
    setTask((prev) => ({ ...prev, status: "assigned" }));
    setProcessing(null);
  }

  async function handleReject(app) {
    setProcessing(app.id);
    await entities.Application.update(app.id, { status: "rejected" });
    toast.info("Application rejected.");
    setApplicants((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: "rejected" } : a)));
    setProcessing(null);
  }

  async function handleDownload(d) {
    setDownloading(d.id);
    try {
      const res = await fetch(d.file_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = d.file_name || "download";
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { window.open(d.file_url, "_blank"); }
    setDownloading(null);
  }

  async function handleMarkComplete() {
    if (deliverables.length === 0) { toast.error("No deliverables submitted yet. Wait for student to submit work."); return; }
    await entities.Task.update(id, { status: "completed" });
    const escrows = await entities.Escrow.filter({ task_id: id, status: "held" });
    for (const e of escrows) {
      await entities.Escrow.update(e.id, { status: "released" });
      await entities.Notification.create({
        user_email: e.student_email,
        title: "Payment Released!",
        message: `Your payment of ₹${e.amount} for "${task.title}" has been released.`,
        type: "task", link: `/task/${id}`, is_read: false,
      });
    }
    setTask((prev) => ({ ...prev, status: "completed" }));
    setShowReview(true);
    toast.success("Task completed! Payment released to all accepted students.");
  }

  async function handleSubmitReview(studentEmail, studentName) {
    if (!reviewForm.rating) { toast.error("Please select a rating"); return; }
    await entities.Review.create({
      student_email: studentEmail, client_email: userProfile.email,
      task_id: id, task_title: task.title,
      rating: reviewForm.rating, comment: reviewForm.comment,
    });
    setApplicantReviews((prev) => ({ ...prev, [studentEmail]: { rating: reviewForm.rating } }));
    setShowReview(false);
    toast.success(`Review submitted for ${studentName}!`);
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  const acceptedApplicants = applicants.filter((a) => a.status === "accepted");

  return (
    <div className="max-w-3xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back
      </button>
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">{task.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">₹{task.budget} · {task.category} · <span className="capitalize">{task.status}</span></p>
            {acceptedApplicants.length > 0 && <p className="text-xs text-primary mt-1">{acceptedApplicants.length} student(s) working on this</p>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {task.status === "assigned" && (
              <Button onClick={handleMarkComplete} size="sm" className="font-heading">
                ✓ Verify & Release Payment
              </Button>
            )}
            {task.status === "completed" && (
              <InvoiceGenerator task={task} client={{ email: task.posted_by }}
                student={{ email: acceptedApplicants[0]?.user_email, full_name: acceptedApplicants[0]?.user_name }} />
            )}
          </div>
        </div>
      </div>

      {deliverables.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Paperclip size={16} /> Submitted Deliverables ({deliverables.length})
          </h3>
          <p className="text-xs text-muted-foreground">Download and verify all files before releasing payment.</p>
          <div className="space-y-2">
            {deliverables.map((d) => (
              <div key={d.id} className="flex items-center gap-3 bg-muted rounded-lg p-3">
                <FileDown size={16} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{d.file_name}</p>
                  {d.description && <p className="text-xs text-muted-foreground">{d.description}</p>}
                  <p className="text-xs text-muted-foreground">By: {d.uploaded_by}</p>
                </div>
                <Button size="sm" variant="outline" disabled={downloading === d.id} onClick={() => handleDownload(d)}>
                  {downloading === d.id ? <Loader2 size={12} className="animate-spin" /> : "Download"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        task.status === "assigned" && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm text-yellow-600">
            ⏳ Waiting for student(s) to submit deliverables. Payment button will activate after they submit.
          </div>
        )
      )}

      {showReview && acceptedApplicants.map((app) => !applicantReviews[app.user_email] && (
        <div key={app.id} className="bg-card border border-primary/30 rounded-2xl p-6 space-y-3">
          <h3 className="font-heading font-semibold text-foreground">Rate {app.user_name}</h3>
          <StarRating rating={reviewForm.rating} onRate={(r) => setReviewForm({ ...reviewForm, rating: r })} size={24} interactive />
          <Textarea value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Comment (optional)" rows={2} />
          <Button onClick={() => handleSubmitReview(app.user_email, app.user_name)} className="font-heading" size="sm">Submit Review</Button>
        </div>
      ))}

      <h3 className="font-heading text-lg font-semibold text-foreground">Applicants ({applicants.length})</h3>
      {applicants.length === 0 ? (
        <p className="text-muted-foreground text-center py-6">No applications yet.</p>
      ) : (
        <div className="space-y-3">
          {applicants.map((app) => {
            const profile = applicantProfiles[app.user_email];
            const review = applicantReviews[app.user_email];
            return (
              <div key={app.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start gap-4">
                  {profile?.profile_photo ? (
                    <img src={profile.profile_photo} alt="" className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center"><User size={18} className="text-muted-foreground" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-card-foreground">{app.user_name}</h4>
                      {review && <StarRating rating={review.rating} size={12} />}
                    </div>
                    <p className="text-xs text-muted-foreground">{profile?.college || app.user_email} · {profile?.experience_level || "N/A"}</p>
                    {profile?.skills && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {profile.skills.slice(0, 5).map((s) => <SkillBadge key={s} skill={s} matched={task.required_skills?.includes(s)} />)}
                      </div>
                    )}
                    {app.message && <p className="text-sm text-muted-foreground mt-2 italic">"{app.message}"</p>}
                  </div>
                  <div className="shrink-0">
                    {app.status === "pending" && task.status !== "completed" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAccept(app)} disabled={processing === app.id} className="font-heading">
                          {processing === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle size={14} className="mr-1" /> Accept</>}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(app)} disabled={processing === app.id}><XCircle size={14} /></Button>
                      </div>
                    )}
                    {app.status !== "pending" && (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${app.status === "accepted" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                        {app.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
