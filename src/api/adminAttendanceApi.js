
import { auth } from "../firebase";

const API_URL = `${
  import.meta.env.VITE_API_URL ||
  "https://toya-backend.onrender.com"
}/api/attendance`;

export async function getAdminAttendance(date) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Please sign in again.");
  }

  if (!date) {
    throw new Error("Please select an attendance date.");
  }

  const token = await currentUser.getIdToken();

  const response = await fetch(
    `${API_URL}/admin?date=${encodeURIComponent(date)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || "Unable to load Admin attendance."
    );
  }

  return result.data || [];
}
