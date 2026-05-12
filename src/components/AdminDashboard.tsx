"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Search,
  LogOut,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  UserPlus,
  Trash2,
  FileText,
  Printer,
} from "lucide-react";
import { Employee, TimeOffRequest } from "@/lib/types";
import { isLate } from "@/lib/storage";

interface TimeRecordData {
  id: string;
  employee_id: string;
  employee_name?: string;
  shift_start: string | null;
  lunch_out: string | null;
  lunch_in: string | null;
  shift_end: string | null;
  created_at: string;
}

interface AdminDashboardProps {
  employees: Employee[];
  requests: TimeOffRequest[];
  onRefresh: () => Promise<void>;
  onRefreshRequests: () => Promise<void>;
  onLogout: () => void;
}

export default function AdminDashboard({
  employees,
  requests,
  onRefresh,
  onRefreshRequests,
  onLogout,
}: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "requests" | "records" | "manage" | "reports">("overview");

  // Manage state
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [manageError, setManageError] = useState("");
  const [manageSuccess, setManageSuccess] = useState("");

  // Reports state
  const [reportEmployeeId, setReportEmployeeId] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reportRecords, setReportRecords] = useState<TimeRecordData[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportShown, setReportShown] = useState(false);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const totalEmployees = employees.length;
  const todayClockedIn = employees.filter(
    (e) => e.records.length > 0 && e.records[e.records.length - 1].shiftStart,
  ).length;

  const handleRequestStatus = async (
    id: string,
    status: "approved" | "denied",
  ) => {
    try {
      await fetch("/api/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await onRefreshRequests();
    } catch (err) {
      console.error("Failed to update request", err);
    }
  };

  const filteredEmployees = employees.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-500 bg-green-100 dark:bg-green-900/30";
      case "denied":
        return "text-red-500 bg-red-100 dark:bg-red-900/30";
      default:
        return "text-amber-500 bg-amber-100 dark:bg-amber-900/30";
    }
  };

  const handleAddEmployee = async () => {
    setManageError("");
    setManageSuccess("");
    if (!newName.trim() || !newPin.trim()) {
      setManageError("Name and PIN are required.");
      return;
    }
    if (!/^\d+$/.test(newPin)) {
      setManageError("PIN must be numeric.");
      return;
    }
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addEmployee", name: newName.trim(), pin: newPin.trim() }),
      });
      if (!res.ok) {
        setManageError("Failed to add employee. Name may already exist.");
        return;
      }
      setManageSuccess(`${newName.trim()} added successfully!`);
      setNewName("");
      setNewPin("");
      await onRefresh();
    } catch {
      setManageError("Failed to add employee.");
    }
  };

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will remove all their records.`)) return;
    try {
      await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteEmployee", id }),
      });
      await onRefresh();
    } catch {
      console.error("Failed to delete employee");
    }
  };

  const getCurrentWorkWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 3=Wed
    // Find the most recent Wednesday
    const lastWednesday = new Date(now);
    const daysSinceWednesday = (dayOfWeek - 3 + 7) % 7;
    lastWednesday.setDate(now.getDate() - daysSinceWednesday);
    lastWednesday.setHours(0, 0, 0, 0);

    const nextWednesday = new Date(lastWednesday);
    nextWednesday.setDate(lastWednesday.getDate() + 7);

    setFromDate(formatDateInput(lastWednesday));
    setToDate(formatDateInput(nextWednesday));
  };

  const formatDateInput = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReportShown(false);
    try {
      const params = new URLSearchParams();
      if (reportEmployeeId !== "all") params.set("employeeId", reportEmployeeId);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      setReportRecords(data);
      setReportShown(true);
    } catch {
      console.error("Failed to generate report");
    }
    setReportLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatTime = (t: string | null) => t || "—";

  // Group report records by employee
  const groupedReportRecords: Record<string, TimeRecordData[]> = {};
  for (const r of reportRecords) {
    const name = r.employee_name || "Unknown";
    if (!groupedReportRecords[name]) groupedReportRecords[name] = [];
    groupedReportRecords[name].push(r);
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950">
      {/* Admin Header */}
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        className="bg-white dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 print:hidden"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/android-chrome-512x512.png"
              alt="ClockIn Logo"
              width={40}
              height={40}
              className="rounded-xl"
            />
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                Hello Linda! 👋
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your team
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:hidden"
        >
          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total Employees
                </p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">
                  {totalEmployees}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Clocked In Today
                </p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">
                  {todayClockedIn}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Pending Requests
                </p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">
                  {pendingRequests.length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 print:hidden">
          {(["overview", "requests", "records", "manage", "reports"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === tab
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
                  : "bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {tab === "overview" && "Overview"}
              {tab === "requests" && `Requests (${pendingRequests.length})`}
              {tab === "records" && "Time Records"}
              {tab === "manage" && "Manage"}
              {tab === "reports" && "Reports"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredEmployees.map((employee, index) => {
                    const latest =
                      employee.records[employee.records.length - 1];
                    const tardy = latest ? isLate(latest.shiftStart) : false;
                    const isExpanded = expandedEmployee === employee.name;

                    return (
                      <motion.div
                        key={employee.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <button
                          onClick={() =>
                            setExpandedEmployee(
                              isExpanded ? null : employee.name,
                            )
                          }
                          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${
                                tardy
                                  ? "bg-red-500"
                                  : "bg-linear-to-br from-indigo-400 to-purple-500"
                              }`}
                            >
                              {employee.name[0]}
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-slate-800 dark:text-white">
                                {employee.name}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {employee.records.length > 0
                                  ? `Last shift: ${latest?.shiftStart || "N/A"}`
                                  : "No records yet"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {tardy && (
                              <span className="flex items-center gap-1 text-xs text-red-500 bg-red-100 dark:bg-red-900/30 px-2.5 py-1 rounded-full">
                                <AlertTriangle className="w-3 h-3" />
                                Tardy
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 bg-slate-50 dark:bg-slate-900/30">
                                <div className="space-y-2">
                                  {employee.records.length === 0 ? (
                                    <p className="text-sm text-slate-400 py-4 text-center">
                                      No time records found
                                    </p>
                                  ) : (
                                    employee.records.map((record, i) => (
                                      <div
                                        key={i}
                                        className="bg-white dark:bg-slate-800/50 rounded-xl p-4 text-sm"
                                      >
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <span className="text-slate-400">
                                              Shift Start:
                                            </span>
                                            <span
                                              className={`ml-2 font-mono ${record.shiftStart && isLate(record.shiftStart) ? "text-red-500" : "text-slate-700 dark:text-slate-200"}`}
                                            >
                                              {record.shiftStart || "—"}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-slate-400">
                                              Lunch Out:
                                            </span>
                                            <span className="ml-2 font-mono text-slate-700 dark:text-slate-200">
                                              {record.lunchOut || "—"}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-slate-400">
                                              Lunch In:
                                            </span>
                                            <span className="ml-2 font-mono text-slate-700 dark:text-slate-200">
                                              {record.lunchIn || "—"}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-slate-400">
                                              Shift End:
                                            </span>
                                            <span className="ml-2 font-mono text-slate-700 dark:text-slate-200">
                                              {record.shiftEnd || "—"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "requests" && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    Time Off Requests
                  </h2>
                </div>

                {requests.length === 0 ? (
                  <div className="p-12 text-center">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">
                      No time off requests yet.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {requests.map((request) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {request.employeeName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">
                              {request.employeeName}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {request.date} — {request.reason}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}
                          >
                            {request.status.charAt(0).toUpperCase() +
                              request.status.slice(1)}
                          </span>
                          {request.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleRequestStatus(request.id, "approved")
                                }
                                className="p-2 rounded-lg text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                              >
                                <CheckCircle2 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleRequestStatus(request.id, "denied")
                                }
                                className="p-2 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "records" && (
            <motion.div
              key="records"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                    All Time Records
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    View all employee time entries
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">
                          Employee
                        </th>
                        <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">
                          Shift Start
                        </th>
                        <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">
                          Lunch Out
                        </th>
                        <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">
                          Lunch In
                        </th>
                        <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">
                          Shift End
                        </th>
                        <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((employee) => {
                        const latest =
                          employee.records[employee.records.length - 1];
                        if (!latest) return null;
                        const tardy = latest.shiftStart
                          ? isLate(latest.shiftStart)
                          : false;
                        return (
                          <tr
                            key={employee.name}
                            className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20"
                          >
                            <td className="py-3 px-4 font-medium text-slate-800 dark:text-white">
                              {employee.name}
                            </td>
                            <td
                              className={`py-3 px-4 font-mono ${tardy ? "text-red-500" : "text-slate-600 dark:text-slate-300"}`}
                            >
                              {latest.shiftStart || "—"}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                              {latest.lunchOut || "—"}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                              {latest.lunchIn || "—"}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                              {latest.shiftEnd || "—"}
                            </td>
                            <td className="py-3 px-4">
                              {tardy ? (
                                <span className="text-xs text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                                  Tardy
                                </span>
                              ) : latest.shiftStart ? (
                                <span className="text-xs text-green-500 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                  On Time
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "manage" && (
            <motion.div
              key="manage"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                    <UserPlus className="w-5 h-5 inline mr-2" />
                    Add Employee
                  </h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <input
                    type="text"
                    placeholder="Employee name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-400 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="PIN (numbers only)"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    maxLength={10}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-400 transition-colors"
                  />
                  <button
                    onClick={handleAddEmployee}
                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
                {manageError && (
                  <p className="text-red-500 text-sm mb-4">{manageError}</p>
                )}
                {manageSuccess && (
                  <p className="text-green-500 text-sm mb-4">{manageSuccess}</p>
                )}

                <hr className="border-slate-200 dark:border-slate-700 mb-6" />

                <div className="mb-4">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                    <Trash2 className="w-5 h-5 inline mr-2 text-red-500" />
                    Delete Employee
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Click the trash icon to remove an employee and all their records.
                  </p>
                </div>
                <div className="space-y-2">
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl"
                    >
                      <span className="font-medium text-slate-800 dark:text-white">
                        {emp.name}
                      </span>
                      <button
                        onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "reports" && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-6 print:shadow-none print:border-none print:rounded-none">
                <div className="mb-6 print:hidden">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                    <FileText className="w-5 h-5 inline mr-2" />
                    Hour Reports
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Generate a report of employee hours within a date range.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 print:hidden">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Employee
                    </label>
                    <select
                      value={reportEmployeeId}
                      onChange={(e) => setReportEmployeeId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-400 transition-colors"
                    >
                      <option value="all">All Employees</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-400 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col justify-end gap-2">
                    <button
                      onClick={handleGenerateReport}
                      disabled={reportLoading}
                      className="w-full px-4 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white rounded-xl font-medium transition-colors"
                    >
                      {reportLoading ? "Loading..." : "Generate Report"}
                    </button>
                    <button
                      onClick={getCurrentWorkWeek}
                      className="w-full px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-xl text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                    >
                      Current Work Week
                    </button>
                  </div>
                </div>

                {reportShown && (
                  <div className="report-print-area">
                    <div className="mb-4 print:mb-2">
                      <h2 className="text-2xl font-bold text-slate-800 dark:text-white text-center">
                        ClockIn Hour Report
                      </h2>
                      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {fromDate || "Beginning"} — {toDate || "Today"}
                        {reportEmployeeId !== "all" && employees.find(e => e.id === reportEmployeeId)
                          ? ` | ${employees.find(e => e.id === reportEmployeeId)!.name}`
                          : " | All Employees"}
                      </p>
                    </div>

                    {reportRecords.length === 0 ? (
                      <p className="text-center text-slate-500 py-8">
                        No records found for this date range.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                          <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                              <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                                Employee
                              </th>
                              <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                                Shift Start
                              </th>
                              <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                                Lunch Out
                              </th>
                              <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                                Lunch In
                              </th>
                              <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                                Shift End
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportRecords.map((r) => (
                              <tr key={r.id} className="border-b border-slate-100 dark:border-slate-700/50">
                                <td className="py-3 px-4 font-medium text-slate-800 dark:text-white">
                                  {r.employee_name || "—"}
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                                  {formatTime(r.shift_start)}
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                                  {formatTime(r.lunch_out)}
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                                  {formatTime(r.lunch_in)}
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                                  {formatTime(r.shift_end)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {reportShown && (
                      <div className="mt-4 text-center print:hidden">
                        <button
                          onClick={handlePrint}
                          className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors inline-flex items-center gap-2"
                        >
                          <Printer className="w-5 h-5" />
                          Print PDF
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}