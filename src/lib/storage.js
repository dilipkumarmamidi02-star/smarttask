import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Upload a file to Firebase Storage and return the download URL.
 * Mirrors the base44 integrations.Core.UploadFile API:
 *   const { file_url } = await uploadFile({ file });
 */
export async function uploadFile({ file }) {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `uploads/${timestamp}_${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const file_url = await getDownloadURL(storageRef);
  return { file_url, file_name: file.name, file_type: file.type };
}
