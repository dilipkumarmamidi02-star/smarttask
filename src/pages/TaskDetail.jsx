import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ArrowLeft, IndianRupee, Calendar, Building2, Tag } from "lucide-react";
import SkillBadge from "@/components/SkillBadge";
import MatchBadge from "@/components/MatchBadge";
import TaskChat from "@/components/TaskChat";
import InvoiceGenerator from "@/components/InvoiceGenerator";
import TaskDeliverables from "@/components/TaskDeliverables";
import MilestoneTracker from "@/components/MilestoneTracker";
import { calculateSkillMatch } from "@/lib/skillsData";
import moment from "moment";

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [task, setTask] = useState(null);
  const [message, setMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    async function load() {
      const [found, myApps] = await Promise.all([
        entities.Task.get(id),
        entities.Application.filter({ user_email: userProfile.email }),
      ]);
      if (!found) { navigate(-1); return; }
      setTask(found);
      setApplied(myApps.some((a) => a.task_id === id));
      setLoading(false);
    }
    load();
  }, [id, navigate, userProfile]);

  async function handleApply() {
    setApplying(true);
    await entities.Application.create({
      user_email: userProfile.email,
      user_name: userProfile.full_name,
      task_id: task.id,
      task_title: task.title,
      message,
      status: "pending",
    });
    toast.success("Application submitted!");
    setApplied(true);
    setApplying(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!task) return null;

  const matchPercent = calculateSkillMatch(userProfile?.skills || [], task.required_skills);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{task.title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-2">
              <Building2 size={14} /> {task.company_name}
            </div>
          </div>
          <MatchBadge percent={matchPercent} />
        </div>

        <p className="text-muted-foreground leading-relaxed">{task.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted rounded-xl p-3 text-center">
            <IndianRupee size={16} className="mx-auto text-primary mb-1" />
            <div className="font-heading font-bold text-foreground">₹{task.budget}</div>
            <div className="text-[10px] text-muted-foreground">Budget</div>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <Calendar size={16} className="mx-auto text-primary mb-1" />
            <div className="font-heading font-bold text-foreground text-sm">
              {moment(task.deadline).format("MMM D")}
            </div>
            <div className="text-[10px] text-muted-foreground">Deadline</div>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <Tag size={16} className="mx-auto text-primary mb-1" />
            <div className="font-heading font-bold text-foreground text-sm capitalize">
              {task.task_type || "one-time"}
            </div>
            <div className="text-[10px] text-muted-foreground">Type</div>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <div
              className={`text-sm font-bold capitalize ${
                task.status === "open" ? "text-green-500" : "text-blue-500"
              }`}
            >
              {task.status}
            </div>
            <div className="text-[10px] text-muted-foreground">Status</div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {task.required_skills?.map((skill) => (
              <SkillBadge
                key={skill}
                skill={skill}
                matched={userProfile?.skills?.includes(skill)}
                size="md"
              />
            ))}
          </div>
        </div>

        {userProfile?.user_role === "student" && task.status === "open" && (
          <div className="border-t border-border pt-6">
            {applied ? (
              <div className="bg-primary/10 text-primary rounded-xl p-4 text-center font-medium">
                ✓ You've already applied to this task
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-heading font-semibold text-foreground">Apply for this Task</h3>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Why are you a good fit? (optional)"
                  rows={3}
                />
                <Button onClick={handleApply} disabled={applying} className="w-full font-heading">
                  {applying ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Applying...</>
                  ) : (
                    "Apply Now"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {(task.status === "assigned" || task.status === "completed") && userProfile && (
          <>
            <MilestoneTracker taskId={id} task={task} currentUser={userProfile} />
            <TaskDeliverables taskId={id} task={task} currentUser={userProfile} />
          </>
        )}

        {task.status === "completed" &&
          userProfile?.user_role === "student" &&
          userProfile?.email === task.assigned_to && (
            <div className="border-t border-border pt-4">
              <InvoiceGenerator
                task={task}
                student={{
                  email: userProfile.email,
                  full_name: userProfile.full_name,
                  college: userProfile.college,
                }}
                client={{ email: task.posted_by, company_name: task.company_name }}
              />
            </div>
          )}

        {userProfile && <TaskChat taskId={id} currentUser={userProfile} />}
      </div>
    </div>
  );
}
