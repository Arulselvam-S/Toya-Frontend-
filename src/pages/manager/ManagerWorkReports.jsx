
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Download,
  FileText,
  Users,
  CheckCircle2,
  Clock3,
  XCircle,
  Eye,
  X,
} from "lucide-react";

import { getManagerWorkReports } from "../../api/managerWorkReportsApi";
import "../../styles/manager/ManagerWorkReports.css";

const today = new Date().toISOString().slice(0, 10);

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const getStatus = (report) =>
  String(report.status || "pending").toLowerCase();

const getReportDate = (report) =>
  report.date || report.workDate || report.createdAt || "";

const getReportText = (report) =>
  report.description || report.workDescription || report.task || report.work || "";

const getEmployeeName = (report) =>
  report.employeeName || report.name || report.employee?.name || "Unknown employee";

const getEmployeeId = (report) =>
  report.employeeId || report.uid || report.employee?.uid || report.employee?.id || "";

const getHours = (report) =>
  report.hours ?? report.totalHours ?? report.workingHours ?? "—";

function ManagerWorkReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getManagerWorkReports({ startDate, endDate });
      setReports(data);
    } catch (err) {
      setError(err.message || "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const employees = useMemo(() => {
    const map = new Map();

    reports.forEach((report) => {
      const id = getEmployeeId(report) || getEmployeeName(report);
      map.set(id, getEmployeeName(report));
    });

    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [reports]);

  const filteredReports = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return reports.filter((report) => {
      const employeeName = getEmployeeName(report).toLowerCase();
      const employeeId = String(getEmployeeId(report)).toLowerCase();
      const description = getReportText(report).toLowerCase();
      const status = getStatus(report);

      const matchesSearch =
        !searchText ||
        employeeName.includes(searchText) ||
        employeeId.includes(searchText) ||
        description.includes(searchText);

      const matchesEmployee =
        employeeFilter === "all" ||
        String(getEmployeeId(report) || getEmployeeName(report)) === employeeFilter;

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      const rawDate = getReportDate(report);
      const date = rawDate ? new Date(rawDate).toISOString().slice(0, 10) : "";

      const matchesStart = !startDate || (date && date >= startDate);
      const matchesEnd = !endDate || (date && date <= endDate);

      return (
        matchesSearch &&
        matchesEmployee &&
        matchesStatus &&
        matchesStart &&
        matchesEnd
      );
    });
  }, [reports, search, employeeFilter, statusFilter, startDate, endDate]);

  const summary = useMemo(() => {
    const statuses = filteredReports.map(getStatus);

    return {
      total: filteredReports.length,
      completed: statuses.filter((status) =>
        ["completed", "approved", "done"].includes(status)
      ).length,
      pending: statuses.filter((status) =>
        ["pending", "submitted", "in progress", "in_progress"].includes(status)
      ).length,
      rejected: statuses.filter((status) =>
        ["rejected", "declined"].includes(status)
      ).length,
    };
  }, [filteredReports]);

  const exportCsv = () => {
    const columns = [
      "Employee",
      "Employee ID",
      "Date",
      "Work Description",
      "Hours",
      "Status",
    ];

    const rows = filteredReports.map((report) => [
      getEmployeeName(report),
      getEmployeeId(report),
      formatDate(getReportDate(report)),
      getReportText(report),
      getHours(report),
      getStatus(report),
    ]);

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [columns, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "manager-team-work-reports.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch("");
    setEmployeeFilter("all");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="manager-work-reports">
      <header className="mwr-header">
        <div>
          <span className="mwr-eyebrow">TEAM MANAGEMENT</span>
          <h1>Team Work Reports</h1>
          <p>Review work logs and track your team's reporting progress.</p>
        </div>

        <div className="mwr-header-actions">
          <button
            className="mwr-button mwr-button-light"
            onClick={loadReports}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            className="mwr-button mwr-button-primary"
            onClick={exportCsv}
            disabled={!filteredReports.length}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </header>

      {error && (
        <div className="mwr-error" role="alert">
          <span>{error}</span>
          <button onClick={loadReports}>Try again</button>
        </div>
      )}

      <section className="mwr-summary">
        <article className="mwr-stat">
          <div className="mwr-stat-icon mwr-icon-blue"><FileText size={20} /></div>
          <div><span>Total reports</span><strong>{summary.total}</strong></div>
        </article>

        <article className="mwr-stat">
          <div className="mwr-stat-icon mwr-icon-green"><CheckCircle2 size={20} /></div>
          <div><span>Completed / approved</span><strong>{summary.completed}</strong></div>
        </article>

        <article className="mwr-stat">
          <div className="mwr-stat-icon mwr-icon-amber"><Clock3 size={20} /></div>
          <div><span>Pending / submitted</span><strong>{summary.pending}</strong></div>
        </article>

        <article className="mwr-stat">
          <div className="mwr-stat-icon mwr-icon-red"><XCircle size={20} /></div>
          <div><span>Rejected</span><strong>{summary.rejected}</strong></div>
        </article>
      </section>

      <section className="mwr-panel">
        <div className="mwr-panel-heading">
          <div>
            <h2>Work report records</h2>
            <p><Users size={15} /> {employees.length} team members in these reports</p>
          </div>
          <span className="mwr-count">{filteredReports.length} records</span>
        </div>

        <div className="mwr-filters">
          <label className="mwr-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee or work..."
            />
          </label>

          <select
            aria-label="Filter by employee"
            value={employeeFilter}
            onChange={(event) => setEmployeeFilter(event.target.value)}
          >
            <option value="all">All employees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="submitted">Submitted</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          <input
            type="date"
            aria-label="Start date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => setStartDate(event.target.value)}
          />

          <input
            type="date"
            aria-label="End date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
          />

          <button className="mwr-button mwr-button-light" onClick={clearFilters}>
            Clear
          </button>
        </div>

        <div className="mwr-table-wrap">
          <table className="mwr-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Work description</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="mwr-empty">Loading team reports…</td></tr>
              ) : filteredReports.length === 0 ? (
                <tr><td colSpan="6" className="mwr-empty">No work reports match your filters.</td></tr>
              ) : (
                filteredReports.map((report, index) => (
                  <tr key={report.id || report.workLogId || `${getEmployeeId(report)}-${index}`}>
                    <td>
                      <div className="mwr-employee">
                        <span className="mwr-avatar">
                          {getEmployeeName(report).charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <strong>{getEmployeeName(report)}</strong>
                          <small>{getEmployeeId(report) || "—"}</small>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(getReportDate(report))}</td>
                    <td>
                      <span className="mwr-description" title={getReportText(report)}>
                        {getReportText(report) || "No description provided"}
                      </span>
                    </td>
                    <td>{getHours(report)}</td>
                    <td>
                      <span className={`mwr-status mwr-status-${getStatus(report).replace(/\s+/g, "-")}`}>
                        {getStatus(report)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="mwr-view-button"
                        onClick={() => setSelectedReport(report)}
                        aria-label="View report details"
                      >
                        <Eye size={16} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedReport && (
        <div
          className="mwr-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedReport(null);
          }}
        >
          <section className="mwr-modal" role="dialog" aria-modal="true" aria-labelledby="mwr-modal-title">
            <div className="mwr-modal-header">
              <div>
                <span className="mwr-eyebrow">REPORT DETAILS</span>
                <h2 id="mwr-modal-title">{getEmployeeName(selectedReport)}</h2>
              </div>
              <button className="mwr-close" onClick={() => setSelectedReport(null)} aria-label="Close details">
                <X size={20} />
              </button>
            </div>

            <div className="mwr-detail-grid">
              <div><span>Employee ID</span><strong>{getEmployeeId(selectedReport) || "—"}</strong></div>
              <div><span>Report date</span><strong>{formatDate(getReportDate(selectedReport))}</strong></div>
              <div><span>Hours</span><strong>{getHours(selectedReport)}</strong></div>
              <div><span>Status</span><strong>{getStatus(selectedReport)}</strong></div>
            </div>

            <div className="mwr-detail-description">
              <h3>Work description</h3>
              <p>{getReportText(selectedReport) || "No description provided."}</p>
            </div>

            {selectedReport.attendance && (
              <div className="mwr-detail-description">
                <h3>Attendance</h3>
                <p>
                  Check-in: {selectedReport.attendance.checkIn || "—"}{" "}
                  · Check-out: {selectedReport.attendance.checkOut || "—"}
                </p>
                <p>Status: {selectedReport.attendance.status || "—"}</p>
              </div>
            )}

            <div className="mwr-modal-footer">
              <button className="mwr-button mwr-button-primary" onClick={() => setSelectedReport(null)}>
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default ManagerWorkReports;
