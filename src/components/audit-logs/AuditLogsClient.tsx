"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { FileText, Download, Filter } from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  action: string;
  actor?: { username: string } | null;
  group?: { name: string } | null;
  targetUserId?: string | null;
  targetUsername?: string | null;
  details: Record<string, unknown>;
  ip?: string | null;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  PROMOTE: "text-green-400 bg-green-400/10",
  DEMOTE: "text-orange-400 bg-orange-400/10",
  EXILE: "text-red-400 bg-red-400/10",
  LOGIN: "text-blue-400 bg-blue-400/10",
  LOGOUT: "text-gray-400 bg-gray-400/10",
  USER_CREATED: "text-purple-400 bg-purple-400/10",
  USER_DELETED: "text-red-500 bg-red-500/10",
  API_KEY_CREATED: "text-yellow-400 bg-yellow-400/10",
  API_KEY_REVOKED: "text-orange-500 bg-orange-500/10",
  GROUP_LINKED: "text-cyan-400 bg-cyan-400/10",
  GROUP_UNLINKED: "text-pink-400 bg-pink-400/10",
  ACCEPT_REQUEST: "text-emerald-400 bg-emerald-400/10",
  REJECT_REQUEST: "text-rose-400 bg-rose-400/10",
  WARNING_ISSUED: "text-amber-400 bg-amber-400/10",
  RANK_CREATED: "text-violet-400 bg-violet-400/10",
  RANK_UPDATED: "text-violet-400 bg-violet-400/10",
  RANK_DELETED: "text-red-400 bg-red-400/10",
  PERMISSION_UPDATED: "text-indigo-400 bg-indigo-400/10",
};

const actionOptions = [
  "PROMOTE", "DEMOTE", "EXILE", "ACCEPT_REQUEST", "REJECT_REQUEST",
  "USER_CREATED", "USER_DELETED", "API_KEY_CREATED", "API_KEY_REVOKED",
  "GROUP_LINKED", "GROUP_UNLINKED", "LOGIN", "LOGOUT",
  "WARNING_ISSUED", "RANK_CREATED", "RANK_UPDATED", "RANK_DELETED",
  "PERMISSION_UPDATED",
];

export default function AuditLogsClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ action: "", from: "", to: "" });
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "50" });
      if (filters.action) params.set("action", filters.action);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      const res = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await res.json();
      if (data.success) { setLogs(data.data.logs); setTotal(data.data.total); }
    } catch { toast.error("Failed to load audit logs"); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function exportCSV() {
    const header = "Timestamp,Actor,Action,Target,Group,IP\n";
    const rows = logs.map((l) =>
      [
        l.createdAt,
        l.actor?.username || "System",
        l.action,
        l.targetUsername || l.targetUserId || "",
        l.group?.name || "",
        l.ip || "",
      ].join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text-white">Audit Logs</h1>
          <p className="text-purple-300/50 text-sm mt-0.5">{total.toLocaleString()} total entries</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-ghost gap-2">
            <Filter className="w-4 h-4" /> Filters
          </button>
          <button onClick={exportCSV} className="btn btn-ghost gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="glass rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Action Type</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
              className="appearance-none"
            >
              <option value="">All Actions</option>
              {actionOptions.map((a) => (
                <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">From Date</label>
            <input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">To Date</label>
            <input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
          </div>
        </div>
      )}

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Group</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6}>
                      <div className="h-10 bg-purple-500/5 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-purple-400/40 py-8">No audit logs found</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-xs text-purple-300/50 whitespace-nowrap">
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                    </td>
                    <td className="text-sm font-medium">{log.actor?.username || <span className="text-purple-400/40">System</span>}</td>
                    <td>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${actionColors[log.action] || "text-purple-400 bg-purple-400/10"}`}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="text-sm text-purple-300/60">{log.targetUsername || log.targetUserId || "—"}</td>
                    <td className="text-sm text-purple-300/50">{log.group?.name || "—"}</td>
                    <td className="text-xs text-purple-400/40 font-mono">{log.ip || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-purple-500/10">
            <p className="text-sm text-purple-400/50">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn btn-ghost py-1 px-3 disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn btn-ghost py-1 px-3 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
