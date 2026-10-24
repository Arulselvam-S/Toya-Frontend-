
import { auth } from "../firebase";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://toya-backend.onrender.com/api";

export const getManagerWorkReports = async ({
  startDate,
  endDate,
} = {}) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in to view team work reports.");
  }

  const token = await user.getIdToken();

  const params = new URLSearchParams();

  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const query = params.toString();

  const response = await fetch(
    `${API_BASE_URL}/manager/work-reports${query ? `?${query}` : ""}`,
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
    throw new Error(result.message || "Failed to load team work reports.");
  }

  return Array.isArray(result.data) ? result.data : [];
};
