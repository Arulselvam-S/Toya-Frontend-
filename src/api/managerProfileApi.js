
import { auth } from "../firebase";

const API_URL = `${
  import.meta.env.VITE_API_URL ||
  "https://toya-backend.onrender.com"
}/api`;

async function request(endpoint, method = "GET", body = null) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in again.");
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body !== null ? { body: JSON.stringify(body) } : {}),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || result.error || `Request failed (${response.status})`
    );
  }

  return result;
}

export async function getMyManagerProfile() {
  const result = await request("/me");
  return { data: result.employee };
}

export async function updateMyManagerProfile(profile) {
  const result = await request("/me", "PATCH", {
    name: profile.name?.trim(),
    phone: profile.phone?.trim(),
    designation: profile.designation?.trim(),
  });

  return {
    success: result.success,
    message: result.message,
    data: result.employee,
  };
}
