"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Globe, Plus, Trash2, RefreshCw, CheckCircle, Users, X, Link } from "lucide-react";
import Image from "next/image";

interface Group {
  id: string;
  robloxGroupId: string;
  name: string;
  description?: string | null;
  memberCount: number;
  thumbnailUrl?: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-purple-500/10 rounded-xl ${className}`} />;
}

function LinkGroupModal({ onClose, onLinked }: { onClose: () => void; onLinked: () => void }) {
  const [groupId, setGroupId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLink() {
    if (!groupId.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: groupId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || "Failed to link group");
      else {
        toast.success(`Group "${data.data.name}" linked!`);
        onLinked();
        onClose();
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md glow">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Link className="w-5 h-5 text-purple-400" /> Link Roblox Group
          </h2>
          <button onClick={onClose} className="text-purple-400/50 hover:text-purple-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Group ID</label>
            <input
              type="text"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              placeholder="e.g. 12345678"
              onKeyDown={(e) => e.key === "Enter" && handleLink()}
            />
            <p className="text-xs text-purple-400/40 mt-1">Find the group ID in the Roblox group URL</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={handleLink} disabled={loading || !groupId.trim()} className="btn btn-primary flex-1 disabled:opacity-60">
              {loading ? "Linking..." : "Link Group"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GroupsClient() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function fetchGroups() {
    try {
      const res = await fetch("/api/admin/groups");
      const data = await res.json();
      if (data.success) setGroups(data.data);
    } catch {
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchGroups(); }, []);

  async function unlinkGroup(id: string, name: string) {
    if (!confirm(`Unlink "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/groups/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Group unlinked");
        setGroups((g) => g.filter((gr) => gr.id !== id));
      } else {
        toast.error("Failed to unlink group");
      }
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text-white">Groups</h1>
          <p className="text-purple-300/50 text-sm mt-0.5">Manage your linked Roblox groups</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchGroups} className="btn btn-ghost gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={() => setShowModal(true)} className="btn btn-primary gap-2">
            <Plus className="w-4 h-4" />
            Link Group
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Globe className="w-12 h-12 text-purple-400/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-purple-200/60 mb-2">No groups linked</h3>
          <p className="text-sm text-purple-400/40 mb-6">Link your first Roblox group to get started</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary gap-2 mx-auto">
            <Plus className="w-4 h-4" /> Link Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div key={group.id} className="glass rounded-2xl p-5 hover:glow-sm transition-all">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-purple-500/20 flex-shrink-0">
                  {group.thumbnailUrl ? (
                    <Image src={group.thumbnailUrl} alt={group.name} width={56} height={56} className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Globe className="w-6 h-6 text-purple-400/50" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-semibold text-white truncate">{group.name}</h3>
                    {group.isVerified && (
                      <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-purple-400/50 mt-0.5">ID: {group.robloxGroupId}</p>
                  {group.description && (
                    <p className="text-xs text-purple-300/40 mt-1 line-clamp-2">{group.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-purple-500/10">
                <div className="flex items-center gap-1.5 text-sm text-purple-300/60">
                  <Users className="w-3.5 h-3.5" />
                  {group.memberCount.toLocaleString()} members
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    group.isActive ? "text-green-400 bg-green-400/10" : "text-gray-400 bg-gray-400/10"
                  }`}>
                    {group.isActive ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => unlinkGroup(group.id, group.name)}
                    className="p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Unlink group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <LinkGroupModal onClose={() => setShowModal(false)} onLinked={fetchGroups} />
      )}
    </div>
  );
}
