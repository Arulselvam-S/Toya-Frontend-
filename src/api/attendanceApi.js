
import { auth } from "../firebase";

const API_URL = `${
  import.meta.env.VITE_API_URL ||
  "https://toya-backend.onrender.com"
}/api/attendance`;

async function attendanceRequest(endpoint, method = "GET") {
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
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || "Attendance request failed."
    );
  }

  return result;
}

export async function getTodayAttendance() {
  return attendanceRequest("/today");
}

export async function checkInAttendance() {
  return attendanceRequest("/check-in", "POST");
}

export async function checkOutAttendance() {
  return attendanceRequest("/check-out", "POST");
}

export async function getAttendanceHistory() {
  return attendanceRequest("/history");
}

export async function getManagerTeamAttendance(date) {
  const query = date
    ? `?date=${encodeURIComponent(date)}`
    : "";

  return attendanceRequest(`/team${query}`);
}
