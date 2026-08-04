"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GitBranch, Plus, Edit2, Trash2, Check, X, Shield } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description?: string | null;
  level: number;
  canPromote: boolean;
  canDemote: boolean;
  canExile: boolean;
  canAcceptReqs: boolean;
  canRejectReqs: boolean;
  canEditPerms: boolean;
  canCreateUsers: boolean;
  canDeleteUsers: boolean;
  canCreateApiKeys: boolean;
  canViewLogs: boolean;
  canViewAnalytics: boolean;
  canManageLicenses: boolean;
  canManageBilling: boolean;
}

type BoolPermKey = keyof Omit<Permission, "id" | "name" | "description" | "level">;

const permLabels: Array<{ key: BoolPermKey; label: string }> = [
  { key: "canPromote", label: "Promote Members" },
  { key: "canDemote", label: "Demote Members" },
  { key: "canExile", label: "Exile Members" },
  { key: "canAcceptReqs", label: "Accept Join Requests" },
  { key: "canRejectReqs", label: "Reject Join Requests" },
  { key: "canEditPerms", label: "Edit Permissions" },
  { key: "canCreateUsers", label: "Create Users" },
  { key: "canDeleteUsers", label: "Delete Users" },
  { key: "canCreateApiKeys", label: "Create API Keys" },
  { key: "canViewLogs", label: "View Audit Logs" },
  { key: "canViewAnalytics", label: "View Analytics" },
  { key: "canManageLicenses", label: "Manage Licenses" },
  { key: "canManageBilling", label: "Manage Billing" },
];

const defaultPerm: Omit<Permission, "id"> = {
  name: "",
  description: "",
  level: 10,
  canPromote: false,
  canDemote: false,
  canExile: false,
  canAcceptReqs: false,
  canRejectReqs: false,
  canEditPerms: false,
  canCreateUsers: false,
  canDeleteUsers: false,
  canCreateApiKeys: false,
  canViewLogs: false,
  canViewAnalytics: false,
  canManageLicenses: false,
  canManageBilling: false,
};

function PermModal({
  perm,
  onClose,
  onSave,
}: {
  perm?: Permission;
  onClose: () => void;
  onSave: (data: Omit<Permission, "id">) => void;
}) {
  const [form, setForm] = useState<Omit<Permission, "id">>(
    perm ? { ...perm } : { ...defaultPerm }
  );

  function toggle(key: BoolPermKey) {
    setForm((f) => ({ ...f, [key]: !f[key] }));
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-lg glow max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold">{perm ? "Edit" : "Create"} Permission Role</h2>
          <button onClick={onClose} className="text-purple-400/50 hover:text-purple-300"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Staff, Moderator, etc." />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Description</label>
            <input value={form.description || ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Level (0-100)</label>
            <input type="number" min={0} max={100} value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: parseInt(e.target.value) || 0 }))} />
          </div>
          <div>
            <p className="text-sm font-medium text-purple-200/70 mb-2">Permissions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {permLabels.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-purple-500/5 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={() => toggle(key)}
                    className="w-4 h-4 accent-purple-500"
                    style={{ width: "16px" }}
                  />
                  <span className="text-sm text-purple-200/70">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={() => form.name && onSave(form)} disabled={!form.name} className="btn btn-primary flex-1 disabled:opacity-60">
              {perm ? "Save Changes" : "Create Role"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RanksClient() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ perm?: Permission } | null>(null);

  async function fetchPerms() {
    try {
      const res = await fetch("/api/admin/permissions");
      const data = await res.json();
      if (data.success) setPermissions(data.data);
    } catch {
      toast.error("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPerms(); }, []);

  async function handleSave(formData: Omit<Permission, "id">, editId?: string) {
    try {
      const res = await fetch(editId ? `/api/admin/permissions/${editId}` : "/api/admin/permissions", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || "Failed to save");
      else {
        toast.success(editId ? "Permission updated" : "Permission created");
        fetchPerms();
        setModal(null);
      }
    } catch {
      toast.error("Network error");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? Users with this role will lose it.`)) return;
    try {
      const res = await fetch(`/api/admin/permissions/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Permission deleted"); fetchPerms(); }
      else toast.error("Failed to delete");
    } catch { toast.error("Network error"); }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text-white">Ranks & Permissions</h1>
          <p className="text-purple-300/50 text-sm mt-0.5">Manage staff permission roles</p>
        </div>
        <button onClick={() => setModal({})} className="btn btn-primary gap-2">
          <Plus className="w-4 h-4" /> New Role
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-purple-500/5 animate-pulse" />
          ))}
        </div>
      ) : permissions.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Shield className="w-12 h-12 text-purple-400/30 mx-auto mb-4" />
          <p className="text-purple-400/50">No permission roles created yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {permissions.map((perm) => {
            const activePerms = permLabels.filter(({ key }) => perm[key]);
            return (
              <div key={perm.id} className="glass rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                      <GitBranch className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{perm.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                          Level {perm.level}
                        </span>
                      </div>
                      {perm.description && (
                        <p className="text-xs text-purple-300/50 mt-0.5">{perm.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModal({ perm })}
                      className="p-1.5 text-purple-400/50 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(perm.id, perm.name)}
                      className="p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {activePerms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-purple-500/10">
                    {activePerms.map(({ key, label }) => (
                      <span key={key} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                        <Check className="w-2.5 h-2.5" /> {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal !== null && (
        <PermModal
          perm={modal.perm}
          onClose={() => setModal(null)}
          onSave={(data) => handleSave(data, modal.perm?.id)}
        />
      )}
    </div>
  );
}
