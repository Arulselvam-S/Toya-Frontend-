
import { auth } from "../firebase";

const API_URL = `${
  import.meta.env.VITE_API_URL ||
  "https://toya-backend.onrender.com"
}/api/manager`;

async function request(endpoint = "") {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Please sign in again.");
  }

  const token = await currentUser.getIdToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || `Manager request failed (${response.status}).`
    );
  }

  return result;
}

export async function getManagerTeam() {
  const result = await request("/team");

  console.log("Manager team API response:", result);

  return Array.isArray(result.data) ? result.data : [];
}
