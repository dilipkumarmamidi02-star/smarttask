const CLOUD_NAME = "dbzcr7giv";
const UPLOAD_PRESET = "smarttask_uploads";

export async function uploadFile({ file }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "smarttask");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Upload failed");
  }

  const data = await res.json();
  return {
    file_url: data.secure_url,
    file_name: file.name,
    file_type: file.type,
  };
}

export function getDownloadUrl(url, fileName) {
  if (!url) return url;
  return url.replace("/upload/", `/upload/fl_attachment:${fileName?.replace(/[^a-zA-Z0-9._-]/g, "_") || "file"}/`);
}
