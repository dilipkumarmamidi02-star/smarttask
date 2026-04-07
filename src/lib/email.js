import emailjs from "@emailjs/browser";

const SERVICE_ID = "service_ncrhs8i";
const PUBLIC_KEY = "-RQ0GUsLIKCJfvDde";

const TEMPLATES = {
  application_approved: "template_approved",
  work_submitted: "template_work_submitted",
  work_completed: "template_completed",
  payment_released: "template_payment",
};

export async function sendEmail(templateKey, params) {
  try {
    await emailjs.send(SERVICE_ID, TEMPLATES[templateKey], params, PUBLIC_KEY);
  } catch (err) {
    console.error("Email error:", err);
  }
}
