"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { AlertTriangle, Plus, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Warning {
  id: string;
  reason: string;
  createdAt: string;
  user: { username: string };
  issuedBy: { username: string };
}

interface User {
  id: string;
  username: string;
}

function IssueWarningModal({
  users,
  onClose,
  onIssued,
}: {
  users: User[];
  onClose: () => void;
  onIssued: () => void;
}) {
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!userId || !reason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/warnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reason }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || "Failed to issue warning");
      else { toast.success("Warning issued"); onIssued(); onClose(); }
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md glow">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" /> Issue Warning
          </h2>
          <button onClick={onClose} className="text-purple-400/50 hover:text-purple-300"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Staff Member</label>
            <select value={userId} onChange={(e) => setUserId(e.target.value)} className="appearance-none">
              <option value="">Select a user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the reason for this warning..."
              rows={3}
              style={{ resize: "vertical" }}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={loading || !userId || !reason.trim()}
              className="btn btn-primary flex-1 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
            >
              {loading ? "Issuing..." : "Issue Warning"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WarningsClient() {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterUser, setFilterUser] = useState("");

  const fetchWarnings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterUser) params.set("userId", filterUser);
      const res = await fetch(`/api/admin/warnings?${params}`);
      const data = await res.json();
      if (data.success) setWarnings(data.data);
    } catch { toast.error("Failed to load warnings"); }
    finally { setLoading(false); }
  }, [filterUser]);

  useEffect(() => { fetchWarnings(); }, [fetchWarnings]);
  useEffect(() => {
    fetch("/api/admin/users?limit=100")
      .then((r) => r.json())
      .then((d) => { if (d.success) setUsers(d.data.users.map((u: User) => ({ id: u.id, username: u.username }))); });
  }, []);

  async function removeWarning(id: string) {
    if (!confirm("Remove this warning?")) return;
    try {
      const res = await fetch(`/api/admin/warnings?id=${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Warning removed"); fetchWarnings(); }
      else toast.error("Failed to remove warning");
    } catch { toast.error("Network error"); }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text-white">Warnings</h1>
          <p className="text-purple-300/50 text-sm mt-0.5">Staff disciplinary records</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary gap-2"
          style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
          <Plus className="w-4 h-4" /> Issue Warning
        </button>
      </div>

      <div className="relative max-w-xs">
        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="appearance-none"
        >
          <option value="">All users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.username}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-purple-500/5 animate-pulse" />
          ))}
        </div>
      ) : warnings.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <AlertTriangle className="w-12 h-12 text-orange-400/30 mx-auto mb-4" />
          <h3 className="font-semibold text-purple-200/60 mb-2">No warnings</h3>
          <p className="text-sm text-purple-400/40">No warnings have been issued yet</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Reason</th>
                <th>Issued By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {warnings.map((w) => (
                <tr key={w.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-semibold text-orange-300">
                        {w.user.username[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-sm">{w.user.username}</span>
                    </div>
                  </td>
                  <td className="text-sm text-purple-300/70 max-w-xs">
                    <p className="truncate">{w.reason}</p>
                  </td>
                  <td className="text-sm text-purple-300/50">{w.issuedBy.username}</td>
                  <td className="text-sm text-purple-300/50">
                    {formatDistanceToNow(new Date(w.createdAt), { addSuffix: true })}
                  </td>
                  <td>
                    <button
                      onClick={() => removeWarning(w.id)}
                      className="p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <IssueWarningModal
          users={users}
          onClose={() => setShowModal(false)}
          onIssued={fetchWarnings}
        />
      )}
    </div>
  );
}
