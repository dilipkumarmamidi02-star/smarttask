import emailjs from "@emailjs/browser";

// All emails send FROM 25245a6605@grietcollege.com via EmailJS
// template_approved     → used when CLIENT sends email TO STUDENT
// template_work_submitted → used when STUDENT sends email TO CLIENT

const SERVICE_ID = "service_tpdty3s";
const PUBLIC_KEY = "_p-rK6rHyCZ4A0-54";

emailjs.init(PUBLIC_KEY);

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

// ── CLIENT → STUDENT emails (template_approved) ───────────────────────────────

// When client accepts a student's application
export function emailApplicationAccepted({ studentEmail, studentName, taskTitle, budget }) {
  return sendEmail({
    templateId: "template_approved",
    to_email:   studentEmail,
    to_name:    studentName,
    task_title: taskTitle,
    subject:    `🎉 You've been accepted for "${taskTitle}"`,
    message:    `Congratulations ${studentName}!\n\nYour application for the task "${taskTitle}" has been accepted by the client.\n\nPayment of ₹${budget || ""} is safely held in escrow and will be released once you complete the task.\n\nLog in to SmartTask to get started: https://smarttask-seven.vercel.app`,
  });
}

// When client marks task as completed and releases payment
export function emailPaymentReleased({ studentEmail, studentName, taskTitle, amount }) {
  return sendEmail({
    templateId: "template_approved",
    to_email:   studentEmail,
    to_name:    studentName,
    task_title: taskTitle,
    subject:    `💰 Payment of ₹${amount} released for "${taskTitle}"`,
    message:    `Great news ${studentName}!\n\nThe client has reviewed your work and marked the task "${taskTitle}" as completed.\n\nYour payment of ₹${amount} has been released from escrow.\n\nThank you for your excellent work on SmartTask!\n\nhttps://smarttask-seven.vercel.app`,
  });
}

// ── STUDENT → CLIENT emails (template_work_submitted) ─────────────────────────

// When student clicks "Apply Now" on a task
export function emailApplicationReceived({ clientEmail, clientName, studentName, taskTitle }) {
  return sendEmail({
    templateId: "template_work_submitted",
    to_email:   clientEmail,
    to_name:    clientName,
    task_title: taskTitle,
    subject:    `New application received for "${taskTitle}"`,
    message:    `Hi ${clientName},\n\n${studentName} has applied for your task "${taskTitle}" on SmartTask.\n\nLog in to review their profile, skills, and application — then accept or reject:\nhttps://smarttask-seven.vercel.app`,
  });
}

// When student clicks "Submit Work to Client"
export function emailWorkSubmitted({ clientEmail, clientName, studentName, taskTitle }) {
  return sendEmail({
    templateId: "template_work_submitted",
    to_email:   clientEmail,
    to_name:    clientName,
    task_title: taskTitle,
    subject:    `Work submitted for your task "${taskTitle}"`,
    message:    `Hi ${clientName},\n\n${studentName} has submitted completed work for your task "${taskTitle}".\n\nPlease log in to SmartTask to review the deliverables and mark the task as complete to release the payment:\nhttps://smarttask-seven.vercel.app`,
  });
}
