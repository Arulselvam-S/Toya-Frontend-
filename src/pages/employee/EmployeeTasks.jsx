
import WorkspacePage from "../../components/workspace/WorkspacePage";

export default function EmployeeTasks() {
  return (
    <WorkspacePage
      title="My Tasks"
      subtitle="View assigned tasks and update your progress"
      type="tasks"
      role="employee"
      employeeId={1}
    />
  );
}
