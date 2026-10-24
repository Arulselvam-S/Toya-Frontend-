
/* ==========================================
   TOYA MANAGEMENT SYSTEM
   Shared Frontend Mock Data
   ========================================== */

// EMPLOYEES

export const EMPLOYEES = [
  {
    id: 1,
    name: "Arun Kumar",
    department: "Development",
    email: "arun@toya.demo",
    role: "Employee",
    status: "Active",
  },
  {
    id: 2,
    name: "Priya Sharma",
    department: "Design",
    email: "priya@toya.demo",
    role: "Employee",
    status: "Active",
  },
  {
    id: 3,
    name: "Karthik S",
    department: "Development",
    email: "karthik@toya.demo",
    role: "Employee",
    status: "Active",
  },
  {
    id: 4,
    name: "Sneha R",
    department: "Operations",
    email: "sneha@toya.demo",
    role: "Employee",
    status: "Active",
  },
  {
    id: 5,
    name: "Meena P",
    department: "Operations",
    email: "meena@toya.demo",
    role: "Employee",
    status: "Active",
  },
];

// DATE HELPERS

export function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function plusDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// TASKS

export const INITIAL_TASKS = [
  {
    id: 1,
    title: "Build Dashboard UI",
    employeeId: 1,
    priority: "High",
    status: "In Progress",
    progress: 60,
    dueDate: plusDays(2),
  },
  {
    id: 2,
    title: "Create Mobile Design",
    employeeId: 2,
    priority: "Medium",
    status: "Completed",
    progress: 100,
    dueDate: plusDays(1),
  },
  {
    id: 3,
    title: "API Integration",
    employeeId: 3,
    priority: "Urgent",
    status: "Not Started",
    progress: 0,
    dueDate: plusDays(3),
  },
  {
    id: 4,
    title: "Delivery Report",
    employeeId: 4,
    priority: "Medium",
    status: "In Progress",
    progress: 45,
    dueDate: plusDays(1),
  },
  {
    id: 5,
    title: "Supplier Verification",
    employeeId: 5,
    priority: "High",
    status: "Completed",
    progress: 100,
    dueDate: plusDays(-1),
  },
];

// ATTENDANCE

export const INITIAL_ATTENDANCE = EMPLOYEES.map(
  (employee, index) => ({
    id: index + 1,
    employeeId: employee.id,
    date: getToday(),
    status:
      index === 3
        ? "Absent"
        : index === 4
          ? "Leave"
          : "Present",
    checkIn:
      index === 3 || index === 4
        ? "--"
        : "09:15 AM",
    checkOut: "--",
  })
);

// WORK LOGS

export const INITIAL_WORKLOGS = [
  {
    id: 1,
    employeeId: 1,
    date: getToday(),
    title: "Dashboard Development",
    description: "Completed dashboard cards and responsive UI",
    hours: 5,
    status: "Completed",
  },
  {
    id: 2,
    employeeId: 2,
    date: getToday(),
    title: "UI Design Review",
    description: "Reviewed mobile application screens",
    hours: 4,
    status: "In Progress",
  },
  {
    id: 3,
    employeeId: 3,
    date: getToday(),
    title: "API Planning",
    description: "Reviewed backend API integration requirements",
    hours: 3,
    status: "In Progress",
  },
];

// LOCAL STORAGE

const STORAGE_PREFIX = "toya_workspace_v1_";

export function readData(key, initialValue) {
  try {
    const stored = localStorage.getItem(
      STORAGE_PREFIX + key
    );

    if (stored === null) {
      return initialValue;
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed
      : initialValue;
  } catch (error) {
    console.error("TOYA data read error:", error);
    return initialValue;
  }
}

export function saveData(key, value) {
  try {
    localStorage.setItem(
      STORAGE_PREFIX + key,
      JSON.stringify(value)
    );

    return true;
  } catch (error) {
    console.error("TOYA data save error:", error);
    return false;
  }
}

// EMPLOYEE HELPERS

export function getEmployeeName(employeeId) {
  const employee = EMPLOYEES.find(
    (item) => item.id === Number(employeeId)
  );

  return employee?.name || "Unknown Employee";
}

export function getEmployeeById(employeeId) {
  return (
    EMPLOYEES.find(
      (item) => item.id === Number(employeeId)
    ) || null
  );
}

// SUMMARY HELPERS

export function getTaskSummary(tasks = []) {
  return {
    total: tasks.length,

    completed: tasks.filter(
      (task) => task.status === "Completed"
    ).length,

    inProgress: tasks.filter(
      (task) => task.status === "In Progress"
    ).length,

    notStarted: tasks.filter(
      (task) => task.status === "Not Started"
    ).length,

    overdue: tasks.filter(
      (task) =>
        task.status !== "Completed" &&
        task.dueDate < getToday()
    ).length,
  };
}

export function getAttendanceSummary(attendance = []) {
  return {
    total: attendance.length,

    present: attendance.filter(
      (record) => record.status === "Present"
    ).length,

    absent: attendance.filter(
      (record) => record.status === "Absent"
    ).length,

    leave: attendance.filter(
      (record) => record.status === "Leave"
    ).length,
  };
}

export function getWorkLogSummary(worklogs = []) {
  return {
    total: worklogs.length,

    completed: worklogs.filter(
      (log) => log.status === "Completed"
    ).length,

    inProgress: worklogs.filter(
      (log) => log.status === "In Progress"
    ).length,

    totalHours: worklogs.reduce(
      (sum, log) => sum + Number(log.hours || 0),
      0
    ),
  };
}
    