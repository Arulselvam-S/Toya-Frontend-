
import { auth } from "../firebase";

const API_URL = `${
  import.meta.env.VITE_API_URL ||
  "https://toya-backend.onrender.com"
}/api/task-timer`;

async function request(endpoint, method = "GET", body) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please sign in again.");
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {}),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Task timer request failed.");
  }

  return result;
}

export async function getCurrentTaskTimer() {
  return request("/current");
}

export async function startTaskTimer({ title, description }) {
  return request("/start", "POST", { title, description });
}

export async function stopTaskTimer() {
  return request("/stop", "POST", {});
}
