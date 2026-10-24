
import { auth } from "../firebase";

const API_URL = `${
  import.meta.env.VITE_API_URL ||
  "https://toya-backend.onrender.com"
}/api/manager/reports`;

export async function getManagerReports({
  startDate = "",
  endDate = "",
} = {}) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Please sign in again.");
  }

  const token = await currentUser.getIdToken();

  const params = new URLSearchParams();

  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const query = params.toString();
  const url = `${API_URL}${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Manager reports API error:", {
      status: response.status,
      message: result.message,
    });

    throw new Error(
      result.message || `Failed to load reports (${response.status}).`
    );
  }

  if (!result.success || !Array.isArray(result.data)) {
    console.error("Unexpected manager reports response:", result);

    throw new Error("Invalid report data received from the backend.");
  }

  console.log(
    "Manager reports loaded:",
    result.data.map((employee) => ({
      name: employee.name,
      workLogs: employee.worklogs?.length ?? 0,
      attendance: employee.attendance?.length ?? 0,
    }))
  );

  return result.data;
}
