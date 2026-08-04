"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  UserCog, Plus, Search, Edit2, Trash2, Ban, CheckCircle, X, Eye,
  AlertTriangle, StickyNote, Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Permission {
  id: string;
  name: string;
  level: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt?: string | null;
  robloxUsername?: string | null;
  robloxAvatarUrl?: string | null;
  createdAt: string;
  permission?: { name: string; level: number } | null;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-purple-500/10 rounded-lg ${className}`} />;
}

const roleColors: Record<string, string> = {
  OWNER: "text-yellow-400 bg-yellow-400/10",
  STAFF: "text-blue-400 bg-blue-400/10",
};

const statusColors: Record<string, string> = {
  ACTIVE: "text-green-400 bg-green-400/10",
  SUSPENDED: "text-red-400 bg-red-400/10",
  INACTIVE: "text-gray-400 bg-gray-400/10",
};

function CreateUserModal({
  permissions,
  onClose,
  onCreated,
}: {
  permissions: Permission[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "STAFF", permissionId: "" });
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || "Failed to create user");
      else { toast.success("User created"); onCreated(); onClose(); }
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md glow">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold">Create Staff User</h2>
          <button onClick={onClose} className="text-purple-400/50 hover:text-purple-300"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Username</label>
            <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="username" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="user@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Role</label>
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="appearance-none">
              <option value="STAFF">Staff</option>
              <option value="OWNER">Owner</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Permission Role</label>
            <select value={form.permissionId} onChange={(e) => setForm((f) => ({ ...f, permissionId: e.target.value }))} className="appearance-none">
              <option value="">None</option>
              {permissions.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (Level {p.level})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={loading || !form.username || !form.email || !form.password}
              className="btn btn-primary flex-1 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) { setUsers(data.data.users); setTotal(data.data.total); }
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    fetch("/api/admin/permissions")
      .then((r) => r.json())
      .then((d) => { if (d.success) setPermissions(d.data); });
  }, []);

  async function toggleStatus(user: User) {
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`User ${newStatus === "ACTIVE" ? "unsuspended" : "suspended"}`);
        fetchUsers();
      }
    } catch { toast.error("Action failed"); }
  }

  async function deleteUser(user: User) {
    if (!confirm(`Delete ${user.username}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("User deleted"); fetchUsers(); }
      else { const d = await res.json(); toast.error(d.error || "Failed to delete"); }
    } catch { toast.error("Network error"); }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text-white">Staff Users</h1>
          <p className="text-purple-300/50 text-sm mt-0.5">{total} total users</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary gap-2">
          <Plus className="w-4 h-4" /> New User
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search users..."
          className="pl-10"
        />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Permission</th>
                <th>Status</th>
                <th>Roblox</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7}><Skeleton className="h-12" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-purple-400/40 py-8">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-sm font-semibold text-purple-300">
                          {user.username[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.username}</p>
                          <p className="text-xs text-purple-400/40">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[user.role] || "text-gray-400 bg-gray-400/10"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="text-sm text-purple-300/60">
                      {user.permission?.name || <span className="text-purple-400/30">None</span>}
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[user.status] || ""}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="text-sm text-purple-300/60">
                      {user.robloxUsername || <span className="text-purple-400/30">Not linked</span>}
                    </td>
                    <td className="text-sm text-purple-300/50">
                      {user.lastLoginAt
                        ? formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })
                        : <span className="text-purple-400/30">Never</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleStatus(user)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.status === "ACTIVE"
                              ? "text-orange-400/60 hover:text-orange-400 hover:bg-orange-400/10"
                              : "text-green-400/60 hover:text-green-400 hover:bg-green-400/10"
                          }`}
                          title={user.status === "ACTIVE" ? "Suspend" : "Unsuspend"}
                        >
                          {user.status === "ACTIVE" ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteUser(user)}
                          className="p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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

      {showCreate && (
        <CreateUserModal
          permissions={permissions}
          onClose={() => setShowCreate(false)}
          onCreated={fetchUsers}
        />
      )}
    </div>
  );
}
