
import { auth } from "../firebase";

const API_URL = `${
  import.meta.env.VITE_API_URL ||
  "https://toya-backend.onrender.com"
}/api/employees`;

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
    throw new Error(
      result.message || `Employee request failed (${response.status}).`
    );
  }

  return result;
}

export async function getEmployees() {
  const result = await request();
  return result.data || [];
}

export async function createEmployee(employee) {
  return request("", "POST", employee);
}

export async function updateEmployee(employeeId, employee) {
  if (!employeeId) {
    throw new Error("Employee ID is required.");
  }

  return request(`/${encodeURIComponent(employeeId)}`, "PATCH", employee);
}

// Update the signed-in admin's own profile
export async function updateMyProfile(profile) {
  return request("/me/profile", "PATCH", profile);
}

export async function updateEmployeeStatus(employeeId, status) {
  if (!employeeId) {
    throw new Error("Employee ID is required.");
  }

  if (!["active", "inactive"].includes(status)) {
    throw new Error("Invalid employee status.");
  }

  return request(
    `/${encodeURIComponent(employeeId)}/status`,
    "PATCH",
    { status }
  );
}
