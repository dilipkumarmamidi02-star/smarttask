import { emailApplicationAccepted, emailWorkSubmitted, emailPaymentReleased } from "@/lib/emailService";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle, XCircle, User, Star } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
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
      setLoading(false);
    }
    load();
  }, [id, navigate]);

  async function handleAccept(app) {
    setProcessing(app.id);
    await entities.Application.update(app.id, { status: "accepted" });
    await entities.Task.update(id, { status: "assigned", assigned_to: app.user_email });
    const others = applicants.filter((a) => a.id !== app.id && a.status === "pending");
    for (const other of others) {
      await entities.Application.update(other.id, { status: "rejected" });
    }
    await entities.Escrow.create({
      task_id: id,
      task_title: task.title,
      client_email: userProfile.email,
      student_email: app.user_email,
      amount: task.budget || 0,
      status: "held",
    });
    await entities.Notification.create({
      user_email: app.user_email,
      title: "You've been selected!",
      message: `You were selected for "${task.title}". Payment of ₹${task.budget} is held in escrow.`,
      type: "task",
      link: `/task/${id}`,
      is_read: false,
    });
    // ── EMAIL → student: application approved ──────────────────────────────
    emailApplicationAccepted({
      studentEmail: app.user_email,
      studentName:  app.user_name,
      taskTitle:    task.title,
    });
    toast.success(`${app.user_name} has been selected!`);
    setApplicants((prev) =>
      prev.map((a) =>
        a.id === app.id
          ? { ...a, status: "accepted" }
          : a.status === "pending"
          ? { ...a, status: "rejected" }
          : a
      )
    );
    setTask((prev) => ({ ...prev, status: "assigned", assigned_to: app.user_email }));
    setProcessing(null);
  }

  async function handleReject(app) {
    setProcessing(app.id);
    await entities.Application.update(app.id, { status: "rejected" });
    toast.info("Application rejected.");
    setApplicants((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, status: "rejected" } : a))
    );
    setProcessing(null);
  }

  async function handleMarkComplete() {
    await entities.Task.update(id, { status: "completed" });
    const escrows = await entities.Escrow.filter({ task_id: id, status: "held" });
    for (const e of escrows) {
      await entities.Escrow.update(e.id, { status: "released" });
    }
    if (task.assigned_to) {
      await entities.Notification.create({
        user_email: task.assigned_to,
        title: "Payment Released!",
        message: `Your payment of ₹${task.budget} for "${task.title}" has been released from escrow.`,
        type: "task",
        link: `/task/${id}`,
        is_read: false,
      });
      // ── EMAIL → student: payment released ───────────────────────────────
      emailPaymentReleased({
        studentEmail: task.assigned_to,
        studentName:  applicants.find((a) => a.user_email === task.assigned_to)?.user_name || task.assigned_to,
        taskTitle:    task.title,
        amount:       task.budget,
      });
    }
    setTask((prev) => ({ ...prev, status: "completed" }));
    setShowReview(true);
    toast.success("Task marked as completed! Payment released to student.");
  }

  async function handleSubmitReview() {
    if (!reviewForm.rating) { toast.error("Please select a rating"); return; }
    await entities.Review.create({
      student_email: task.assigned_to,
      client_email:  userProfile.email,
      task_id:       id,
      task_title:    task.title,
      rating:        reviewForm.rating,
      comment:       reviewForm.comment,
    });
    setApplicantReviews((prev) => ({ ...prev, [task.assigned_to]: { rating: reviewForm.rating } }));
    setShowReview(false);
    toast.success("Review submitted!");
  }

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="max-w-3xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">{task.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              ₹{task.budget} · {task.category} · <span className="capitalize">{task.status}</span>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {task.status === "assigned" && !showReview && (
              <Button onClick={handleMarkComplete} variant="outline" size="sm" className="font-heading">
                Mark Completed
              </Button>
            )}
            {task.status === "completed" && task.assigned_to && (
              <InvoiceGenerator
                task={task}
                client={{ email: task.posted_by }}
                student={{
                  email: task.assigned_to,
                  full_name: applicants.find((a) => a.user_email === task.assigned_to)?.user_name,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {showReview && task.assigned_to && (
        <div className="bg-card border border-primary/30 rounded-2xl p-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground">Rate the Student</h3>
          <StarRating rating={reviewForm.rating} onRate={(r) => setReviewForm({ ...reviewForm, rating: r })} size={28} interactive />
          <div>
            <Label>Comment (optional)</Label>
            <Textarea value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} rows={2} />
          </div>
          <Button onClick={handleSubmitReview} className="font-heading">Submit Review</Button>
        </div>
      )}

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
                    <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center">
                      <User size={18} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-card-foreground">{app.user_name}</h4>
                      {review && <StarRating rating={review.rating} size={12} />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {profile?.college || app.user_email} · {profile?.experience_level || "N/A"}
                    </p>
                    {profile?.skills && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {profile.skills.slice(0, 5).map((s) => (
                          <SkillBadge key={s} skill={s} matched={task.required_skills?.includes(s)} />
                        ))}
                      </div>
                    )}
                    {app.message && <p className="text-sm text-muted-foreground mt-2 italic">"{app.message}"</p>}
                  </div>
                  <div className="shrink-0">
                    {app.status === "pending" && task.status === "open" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAccept(app)} disabled={processing === app.id} className="font-heading">
                          {processing === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle size={14} className="mr-1" /> Accept</>}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(app)} disabled={processing === app.id}>
                          <XCircle size={14} />
                        </Button>
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
