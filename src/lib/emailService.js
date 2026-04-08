import emailjs from "@emailjs/browser";

const SERVICE_ID = "service_tpdty3s";
const PUBLIC_KEY = "_p-rK6rHyCZ4A0-54";

emailjs.init(PUBLIC_KEY);

export async function sendEmail({ templateId, to_email, to_name, subject, message, task_title, extra = {} }) {
  try {
    await emailjs.send(SERVICE_ID, templateId, {
      to_email,
      to_name: to_name || to_email,
      subject,
      message,
      task_title: task_title || "",
      ...extra,
    });
    console.log("✅ Email sent →", to_email);
  } catch (err) {
    console.error("❌ EmailJS error:", err?.text || err);
  }
}

// ── Application Approved → student gets notified ──────────────────────────
export function emailApplicationAccepted({ studentEmail, studentName, taskTitle }) {
  return sendEmail({
    templateId: "template_approved",
    to_email: studentEmail,
    to_name: studentName,
    task_title: taskTitle,
    subject: `🎉 You've been accepted for "${taskTitle}"`,
    message: `Congratulations ${studentName}! Your application for the task "${taskTitle}" has been accepted. Log in to SmartTask to view your assigned task and get started.`,
  });
}

// ── Work Submitted → client gets notified ─────────────────────────────────
export function emailWorkSubmitted({ clientEmail, clientName, studentName, taskTitle }) {
  return sendEmail({
    templateId: "template_work_submitted",
    to_email: clientEmail,
    to_name: clientName,
    task_title: taskTitle,
    subject: `Work submitted for "${taskTitle}"`,
    message: `Hi ${clientName}, ${studentName} has submitted completed work for your task "${taskTitle}". Please log in to SmartTask to review the deliverables and approve or request revisions.`,
  });
}

// ── Application Received → client gets notified ───────────────────────────
export function emailApplicationReceived({ clientEmail, clientName, studentName, taskTitle }) {
  return sendEmail({
    templateId: "template_approved",
    to_email: clientEmail,
    to_name: clientName,
    task_title: taskTitle,
    subject: `New application for "${taskTitle}"`,
    message: `Hi ${clientName}, ${studentName} has applied for your task "${taskTitle}" on SmartTask. Log in to review their profile and accept or reject the application.`,
  });
}

// ── Application Rejected → student gets notified ──────────────────────────
export function emailApplicationRejected({ studentEmail, studentName, taskTitle }) {
  return sendEmail({
    templateId: "template_approved",
    to_email: studentEmail,
    to_name: studentName,
    task_title: taskTitle,
    subject: `Update on your application for "${taskTitle}"`,
    message: `Hi ${studentName}, thank you for applying for "${taskTitle}". The client has selected another candidate this time. Keep applying — there are many more tasks waiting for you on SmartTask!`,
  });
}
