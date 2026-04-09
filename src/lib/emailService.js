import emailjs from "@emailjs/browser";

const SERVICE_ID = "service_tpdty3s";
const PUBLIC_KEY = "_p-rK6rHyCZ4A0-54";

emailjs.init(PUBLIC_KEY);

// ── Core sender ───────────────────────────────────────────────────────────────
async function sendEmail({ templateId, to_email, to_name, subject, message, task_title }) {
  try {
    await emailjs.send(SERVICE_ID, templateId, {
      to_email,
      to_name:    to_name || to_email,
      subject,
      message,
      task_title: task_title || "",
    });
    console.log("✅ Email sent to", to_email);
  } catch (err) {
    console.error("❌ EmailJS error:", err?.text || err);
  }
}

// ── TEMPLATE 1: template_approved ─────────────────────────────────────────────
// Used for: application approved → sent TO student FROM platform

export function emailApplicationAccepted({ studentEmail, studentName, taskTitle }) {
  return sendEmail({
    templateId: "template_approved",
    to_email:   studentEmail,
    to_name:    studentName,
    task_title: taskTitle,
    subject:    `🎉 Your application was accepted — "${taskTitle}"`,
    message:    `Congratulations ${studentName}! A client has accepted your application for the task "${taskTitle}". Log in to SmartTask to view your assigned task and start working. Payment is held safely in escrow and will be released once you complete the task.`,
  });
}

// ── TEMPLATE 2: template_work_submitted ───────────────────────────────────────
// Used for: student applies → sent TO client FROM platform
// Used for: student submits work → sent TO client FROM platform
// Used for: task completed → sent TO student FROM platform

export function emailApplicationReceived({ clientEmail, clientName, studentName, taskTitle }) {
  return sendEmail({
    templateId: "template_work_submitted",
    to_email:   clientEmail,
    to_name:    clientName,
    task_title: taskTitle,
    subject:    `New application for your task — "${taskTitle}"`,
    message:    `Hi ${clientName}, ${studentName} has applied for your task "${taskTitle}" on SmartTask. Log in to review their profile, skills, and application message — then accept or reject the application.`,
  });
}

export function emailWorkSubmitted({ clientEmail, clientName, studentName, taskTitle }) {
  return sendEmail({
    templateId: "template_work_submitted",
    to_email:   clientEmail,
    to_name:    clientName,
    task_title: taskTitle,
    subject:    `Work submitted for your task — "${taskTitle}"`,
    message:    `Hi ${clientName}, ${studentName} has submitted completed work for your task "${taskTitle}". Log in to SmartTask to review the deliverables and mark the task as complete to release the escrow payment.`,
  });
}

export function emailPaymentReleased({ studentEmail, studentName, taskTitle, amount }) {
  return sendEmail({
    templateId: "template_approved",
    to_email:   studentEmail,
    to_name:    studentName,
    task_title: taskTitle,
    subject:    `💰 Payment released — "${taskTitle}"`,
    message:    `Great news ${studentName}! Your payment of ₹${amount} for completing the task "${taskTitle}" has been released from escrow. Thank you for your excellent work on SmartTask!`,
  });
}
