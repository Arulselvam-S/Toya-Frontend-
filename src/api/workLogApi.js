
import { auth } from "../firebase";

const API_URL = `${
  import.meta.env.VITE_API_URL ||
  "https://toya-backend.onrender.com"
}/api/work-logs`;

async function request(endpoint = "", method = "GET", body) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Please sign in again.");
  }

  const token = await currentUser.getIdToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Work log request failed.");
  }

  return result;
}

export async function getWorkLogs() {
  return request();
}

export async function submitWorkLog(workLog) {
  return request("", "POST", workLog);
}

export async function updateWorkLog(id, workLog) {
  return request(`/${encodeURIComponent(id)}`, "PATCH", workLog);
}

export async function deleteWorkLog(id) {
  return request(`/${encodeURIComponent(id)}`, "DELETE");
}
