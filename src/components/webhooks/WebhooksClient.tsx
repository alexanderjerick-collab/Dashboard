"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Webhook, Plus, Trash2, ToggleLeft, ToggleRight, Send, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface WebhookData {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string | null;
  lastSentAt?: string | null;
  createdAt: string;
}

const availableEvents = [
  "PROMOTE", "DEMOTE", "EXILE", "JOIN_REQUEST", "USER_CREATED",
  "API_KEY_CREATED", "WARNING_ISSUED", "GROUP_LINKED",
];

function CreateWebhookModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ name: "", url: "", events: [] as string[], secret: "" });
  const [loading, setLoading] = useState(false);

  function toggleEvent(evt: string) {
    setForm((f) => ({
      ...f,
      events: f.events.includes(evt) ? f.events.filter((e) => e !== evt) : [...f.events, evt],
    }));
  }

  async function handleCreate() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || "Failed to create webhook");
      else { toast.success("Webhook created"); onCreated(); onClose(); }
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md glow max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold">Create Webhook</h2>
          <button onClick={onClose} className="text-purple-400/50 hover:text-purple-300"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Discord Notifications" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">URL</label>
            <input type="url" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://discord.com/api/webhooks/..." />
          </div>
          <div>
            <p className="text-sm font-medium text-purple-200/70 mb-2">Events</p>
            <div className="grid grid-cols-2 gap-1.5">
              {availableEvents.map((evt) => (
                <label key={evt} className="flex items-center gap-2 p-2 rounded-xl hover:bg-purple-500/5 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={form.events.includes(evt)}
                    onChange={() => toggleEvent(evt)}
                    className="w-4 h-4 accent-purple-500"
                    style={{ width: "16px" }}
                  />
                  <span className="text-xs text-purple-200/70">{evt.replace(/_/g, " ")}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Secret (optional)</label>
            <input type="password" value={form.secret} onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))} placeholder="Webhook signing secret" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={loading || !form.name || !form.url || form.events.length === 0}
              className="btn btn-primary flex-1 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Webhook"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WebhooksClient() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/webhooks");
      const data = await res.json();
      if (data.success) setWebhooks(data.data);
    } catch { toast.error("Failed to load webhooks"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  async function toggleActive(webhook: WebhookData) {
    try {
      const res = await fetch(`/api/admin/webhooks/${webhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !webhook.isActive }),
      });
      if (res.ok) { toast.success(webhook.isActive ? "Webhook disabled" : "Webhook enabled"); fetchWebhooks(); }
    } catch { toast.error("Action failed"); }
  }

  async function testWebhook(id: string) {
    try {
      const res = await fetch(`/api/admin/webhooks/${id}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) toast.success("Test webhook sent!");
      else toast.error(data.error || "Failed to send test");
    } catch { toast.error("Network error"); }
  }

  async function deleteWebhook(id: string, name: string) {
    if (!confirm(`Delete webhook "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/webhooks/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Webhook deleted"); fetchWebhooks(); }
    } catch { toast.error("Network error"); }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text-white">Webhooks</h1>
          <p className="text-purple-300/50 text-sm mt-0.5">Send real-time events to external services</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Webhook
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-purple-500/5 animate-pulse" />
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Webhook className="w-12 h-12 text-purple-400/30 mx-auto mb-4" />
          <h3 className="font-semibold text-purple-200/60 mb-2">No webhooks configured</h3>
          <p className="text-sm text-purple-400/40 mb-6">Add a webhook to receive real-time notifications</p>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary gap-2 mx-auto">
            <Plus className="w-4 h-4" /> Add Webhook
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <div key={wh.id} className="glass rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${wh.isActive ? "bg-purple-500/15" : "bg-gray-500/15"}`}>
                    <Webhook className={`w-5 h-5 ${wh.isActive ? "text-purple-400" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{wh.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${wh.isActive ? "text-green-400 bg-green-400/10" : "text-gray-400 bg-gray-400/10"}`}>
                        {wh.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-xs text-purple-400/40 mt-0.5 truncate max-w-xs">{wh.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => testWebhook(wh.id)}
                    className="p-1.5 text-purple-400/60 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                    title="Send test"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleActive(wh)}
                    className="p-1.5 text-purple-400/60 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                    title={wh.isActive ? "Disable" : "Enable"}
                  >
                    {wh.isActive ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => deleteWebhook(wh.id, wh.name)}
                    className="p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-purple-500/10">
                {wh.events.map((evt) => (
                  <span key={evt} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                    {evt.replace(/_/g, " ")}
                  </span>
                ))}
                {wh.lastSentAt && (
                  <span className="ml-auto text-xs text-purple-400/40">
                    Last sent {formatDistanceToNow(new Date(wh.lastSentAt), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateWebhookModal onClose={() => setShowCreate(false)} onCreated={fetchWebhooks} />
      )}
    </div>
  );
}
