
import { auth } from "../firebase";

const API_URL = `${
  import.meta.env.VITE_API_URL ||
  "https://toya-backend.onrender.com"
}/api/settings`;

async function request(path = "", options = {}) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please sign in again.");
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Settings request failed.");
  }

  return result.data;
}

export function getSettings() {
  return request();
}

export function saveSettings(settings) {
  return request("", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export function resetSettings() {
  return request("", {
    method: "DELETE",
  });
}
