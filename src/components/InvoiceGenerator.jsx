import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import moment from "moment";

export default function InvoiceGenerator({ task, student, client }) {
  const [generating, setGenerating] = useState(false);

  function generatePDF() {
    setGenerating(true);
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFillColor(26, 60, 110);
    doc.rect(0, 0, pageW, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("SmartTask", 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Task Completion Invoice", pageW - 14, 20, { align: "right" });

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.text(`Invoice Date: ${moment().format("DD MMM YYYY")}`, 14, 42);
    doc.text(`Invoice #: INV-${task.id?.slice(0, 8).toUpperCase()}`, pageW - 14, 42, {
      align: "right",
    });

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 48, pageW - 14, 48);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 60, 110);
    doc.text("FROM (Client)", 14, 60);
    doc.text("TO (Student)", pageW / 2 + 5, 60);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.text(client?.full_name || "Client", 14, 70);
    doc.text(client?.email || "", 14, 78);
    doc.text(client?.company_name || "", 14, 86);

    doc.text(student?.full_name || "Student", pageW / 2 + 5, 70);
    doc.text(student?.email || "", pageW / 2 + 5, 78);
    doc.text(student?.college || "", pageW / 2 + 5, 86);

    doc.setFillColor(245, 247, 250);
    doc.roundedRect(14, 100, pageW - 28, 70, 4, 4, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 60, 110);
    doc.text("Task Details", 22, 114);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);

    const rows = [
      ["Task Title", task.title || ""],
      ["Category", task.category || ""],
      ["Company", task.company_name || ""],
      ["Skills Required", (task.required_skills || []).join(", ")],
      ["Posted Date", moment(task.created_date).format("DD MMM YYYY")],
      ["Completion Date", moment().format("DD MMM YYYY")],
    ];

    rows.forEach(([label, value], i) => {
      const y = 124 + i * 10;
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 22, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 80, y);
    });

    doc.setFillColor(26, 60, 110);
    doc.roundedRect(14, 182, pageW - 28, 36, 4, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Total Amount Paid", 22, 198);
    doc.setFontSize(18);
    doc.text(`₹${task.budget || 0}`, pageW - 22, 198, { align: "right" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Released from escrow upon task completion", 22, 210);

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(
      "This is a system-generated invoice from SmartTask platform.",
      pageW / 2,
      280,
      { align: "center" }
    );
    doc.text("smarttask.app", pageW / 2, 287, { align: "center" });

    doc.save(`SmartTask_Invoice_${task.id?.slice(0, 8)}.pdf`);
    setGenerating(false);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generatePDF}
      disabled={generating}
      className="flex items-center gap-2"
    >
      {generating ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
      Download Invoice
    </Button>
  );
}
