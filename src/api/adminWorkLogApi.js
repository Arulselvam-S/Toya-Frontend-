
import { auth } from "../firebase";

const API_URL = `${
  import.meta.env.VITE_API_URL ||
  "https://toya-backend.onrender.com"
}/api/admin/work-logs`;

export async function getAdminWorkLogs() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Please sign in again.");
  }

  const token = await currentUser.getIdToken();

  const response = await fetch(API_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || "Unable to load employee work logs."
    );
  }

  return result.data || [];
}
