import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/lib/firestore";
import { Loader2, Download, IndianRupee, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import moment from "moment";
import { jsPDF } from "jspdf";

function generateInvoice(task, user) {
  const doc = new jsPDF();
  const date = moment().format("DD MMM YYYY");
  const invoiceNo = `INV-${task.id.slice(0, 8).toUpperCase()}`;

  doc.setFillColor(99, 82, 220);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("SmartTask", 14, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Earn While You Learn", 14, 28);
  doc.text(`Invoice Date: ${date}`, 140, 20);
  doc.text(`Invoice No: ${invoiceNo}`, 140, 28);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, 55);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(user.full_name, 14, 63);
  doc.text(user.email, 14, 70);
  doc.text(user.college || "Student", 14, 77);

  doc.setFont("helvetica", "bold");
  doc.text("From:", 120, 55);
  doc.setFont("helvetica", "normal");
  doc.text(task.company_name, 120, 63);
  doc.text(task.posted_by || "", 120, 70);

  doc.setFillColor(240, 240, 255);
  doc.rect(14, 90, 182, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Task Description", 16, 97);
  doc.text("Category", 110, 97);
  doc.text("Amount (₹)", 162, 97);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const title = doc.splitTextToSize(task.title, 88);
  doc.text(title, 16, 108);
  doc.text(task.category, 110, 108);
  doc.setFont("helvetica", "bold");
  doc.text(`₹${task.budget}`, 162, 108);

  doc.setDrawColor(200, 200, 200);
  doc.line(14, 125, 196, 125);
  doc.setFontSize(12);
  doc.text("Total Payout:", 130, 135);
  doc.setTextColor(99, 82, 220);
  doc.setFontSize(14);
  doc.text(`₹${task.budget}`, 170, 135);

  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("Thank you for completing this task on SmartTask!", 14, 270);
  doc.text("For queries, contact support@smarttask.com", 14, 276);

  doc.save(`Invoice_${invoiceNo}.pdf`);
}

export default function Earnings() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);

  useEffect(() => {
    if (!userProfile) return;
    async function load() {
      const [completed, assigned] = await Promise.all([
        entities.Task.filter({ assigned_to: userProfile.email, status: "completed" }, "-updated_date"),
        entities.Task.filter({ assigned_to: userProfile.email, status: "assigned" }, "-updated_date"),
      ]);
      setCompletedTasks(completed);
      setAssignedTasks(assigned);
      setLoading(false);
    }
    load();
  }, [userProfile]);

  const totalEarned = completedTasks.reduce((s, t) => s + (t.budget || 0), 0);
  const pendingAmount = assignedTasks.reduce((s, t) => s + (t.budget || 0), 0);

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold text-foreground">Earnings</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-heading font-bold text-green-500">₹{totalEarned}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Earned</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-heading font-bold text-yellow-500">₹{pendingAmount}</div>
          <div className="text-xs text-muted-foreground mt-1">Pending Payout</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center col-span-2 md:col-span-1">
          <div className="text-2xl font-heading font-bold text-primary">{completedTasks.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Tasks Completed</div>
        </div>
      </div>

      {assignedTasks.length > 0 && (
        <div>
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock size={16} className="text-yellow-500" /> In Progress
          </h3>
          <div className="space-y-2">
            {assignedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-card border border-yellow-500/20 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {task.company_name} · Due {moment(task.deadline).format("MMM D")}
                  </p>
                </div>
                <span className="font-heading font-bold text-yellow-500">₹{task.budget}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
          <CheckCircle size={16} className="text-green-500" /> Completed Tasks
        </h3>
        {completedTasks.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No completed tasks yet.</p>
        ) : (
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-card border border-border rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {task.company_name} · Completed {moment(task.updated_date).format("MMM D, YYYY")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading font-bold text-green-500">₹{task.budget}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateInvoice(task, userProfile)}
                    className="gap-1.5 text-xs"
                  >
                    <Download size={13} /> Invoice
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
