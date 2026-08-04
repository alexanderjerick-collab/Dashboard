"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Key, Plus, Trash2, Copy, X, Check, Eye, EyeOff, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  status: string;
  permissions: Record<string, boolean>;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  usageCount: number;
  rateLimit: number;
  ipRestrictions: string[];
  createdAt: string;
}

const availablePerms = [
  { key: "promote", label: "Promote Members" },
  { key: "demote", label: "Demote Members" },
  { key: "exile", label: "Exile Members" },
  { key: "rank", label: "Get Rank Info" },
  { key: "member", label: "Get Member Info" },
];

function CreateKeyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (rawKey: string) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    permissions: {} as Record<string, boolean>,
    expiresAt: "",
    rateLimit: 100,
    ipRestrictions: "",
  });
  const [loading, setLoading] = useState(false);

  function togglePerm(key: string) {
    setForm((f) => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));
  }

  async function handleCreate() {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          permissions: form.permissions,
          expiresAt: form.expiresAt || null,
          rateLimit: form.rateLimit,
          ipRestrictions: form.ipRestrictions ? form.ipRestrictions.split(",").map((s) => s.trim()).filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || "Failed to create key");
      else { onCreated(data.data.rawKey); onClose(); }
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md glow max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold">Generate API Key</h2>
          <button onClick={onClose} className="text-purple-400/50 hover:text-purple-300"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Key Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="My Game Bot" />
          </div>
          <div>
            <p className="text-sm font-medium text-purple-200/70 mb-2">Permissions</p>
            <div className="space-y-1.5">
              {availablePerms.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 p-2 rounded-xl hover:bg-purple-500/5 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={!!form.permissions[key]}
                    onChange={() => togglePerm(key)}
                    className="w-4 h-4 accent-purple-500"
                    style={{ width: "16px" }}
                  />
                  <span className="text-sm text-purple-200/70">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Expiry Date (optional)</label>
            <input type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Rate Limit (req/min)</label>
            <input type="number" min={1} max={10000} value={form.rateLimit} onChange={(e) => setForm((f) => ({ ...f, rateLimit: parseInt(e.target.value) || 100 }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">IP Restrictions (comma-separated, optional)</label>
            <input value={form.ipRestrictions} onChange={(e) => setForm((f) => ({ ...f, ipRestrictions: e.target.value }))} placeholder="192.168.1.1, 10.0.0.1" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={loading || !form.name.trim()}
              className="btn btn-primary flex-1 disabled:opacity-60"
            >
              {loading ? "Generating..." : "Generate Key"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShowKeyModal({ rawKey, onClose }: { rawKey: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copyKey() {
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-lg glow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-green-400">API Key Generated!</h2>
          <button onClick={onClose} className="text-purple-400/50 hover:text-purple-300"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 mb-4">
          <p className="text-xs text-green-400/60 mb-2 font-medium">Your API Key (copy it now — it won&apos;t be shown again)</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm text-green-300 break-all font-mono">{rawKey}</code>
            <button
              onClick={copyKey}
              className="flex-shrink-0 p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <p className="text-sm text-purple-300/50 mb-4">
          Use this key in API requests as: <code className="text-purple-300 text-xs">Authorization: Bearer {'<key>'}</code>
        </p>
        <button onClick={onClose} className="btn btn-primary w-full">Done</button>
      </div>
    </div>
  );
}

export default function ApiKeysClient() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/api-keys");
      const data = await res.json();
      if (data.success) setKeys(data.data);
    } catch { toast.error("Failed to load API keys"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  async function revokeKey(id: string, name: string) {
    if (!confirm(`Revoke key "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("API key revoked"); fetchKeys(); }
      else toast.error("Failed to revoke key");
    } catch { toast.error("Network error"); }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text-white">API Keys</h1>
          <p className="text-purple-300/50 text-sm mt-0.5">Manage programmatic access to your groups</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary gap-2">
          <Plus className="w-4 h-4" /> Generate Key
        </button>
      </div>

      {/* Docs hint */}
      <div className="glass rounded-2xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-purple-200">Game API Endpoints</p>
          <p className="text-xs text-purple-300/50 mt-0.5">
            Use your API key with: <code className="text-purple-300">/api/game/promote</code>,{" "}
            <code className="text-purple-300">/api/game/demote</code>,{" "}
            <code className="text-purple-300">/api/game/exile</code>,{" "}
            <code className="text-purple-300">/api/game/rank</code>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-purple-500/5 animate-pulse" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Key className="w-12 h-12 text-purple-400/30 mx-auto mb-4" />
          <h3 className="font-semibold text-purple-200/60 mb-2">No API keys</h3>
          <p className="text-sm text-purple-400/40 mb-6">Generate a key to enable game-to-dashboard integration</p>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary gap-2 mx-auto">
            <Plus className="w-4 h-4" /> Generate Key
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div key={key.id} className="glass rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    key.status === "ACTIVE" ? "bg-purple-500/15" : "bg-gray-500/15"
                  }`}>
                    <Key className={`w-5 h-5 ${key.status === "ACTIVE" ? "text-purple-400" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{key.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        key.status === "ACTIVE" ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
                      }`}>
                        {key.status}
                      </span>
                    </div>
                    <p className="text-xs text-purple-400/40 font-mono mt-0.5">rf_{key.keyPrefix}••••••••</p>
                  </div>
                </div>
                {key.status === "ACTIVE" && (
                  <button
                    onClick={() => revokeKey(key.id, key.name)}
                    className="p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-purple-500/10">
                <div>
                  <p className="text-xs text-purple-400/40">Usage</p>
                  <p className="text-sm font-medium">{key.usageCount.toLocaleString()} calls</p>
                </div>
                <div>
                  <p className="text-xs text-purple-400/40">Rate Limit</p>
                  <p className="text-sm font-medium">{key.rateLimit}/min</p>
                </div>
                <div>
                  <p className="text-xs text-purple-400/40">Last Used</p>
                  <p className="text-sm font-medium">
                    {key.lastUsedAt
                      ? formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })
                      : "Never"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-purple-400/40">Expires</p>
                  <p className="text-sm font-medium">
                    {key.expiresAt
                      ? formatDistanceToNow(new Date(key.expiresAt), { addSuffix: true })
                      : "Never"}
                  </p>
                </div>
              </div>
              {Object.keys(key.permissions).filter((k) => key.permissions[k]).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {Object.keys(key.permissions).filter((k) => key.permissions[k]).map((p) => (
                    <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateKeyModal
          onClose={() => setShowCreate(false)}
          onCreated={(rawKey) => { setNewKey(rawKey); fetchKeys(); }}
        />
      )}
      {newKey && (
        <ShowKeyModal rawKey={newKey} onClose={() => setNewKey(null)} />
      )}
    </div>
  );
}
