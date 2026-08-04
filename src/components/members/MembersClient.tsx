"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Users, Search, ChevronDown, UserX, TrendingUp, TrendingDown, RefreshCw, X } from "lucide-react";
import Image from "next/image";

interface RobloxGroup {
  id: string;
  robloxGroupId: string;
  name: string;
}

interface Member {
  user: { userId: number; username: string; displayName: string };
  role: { id: number; name: string; rank: number };
}

interface Role {
  id: number;
  name: string;
  rank: number;
  memberCount?: number;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-purple-500/10 rounded-lg ${className}`} />;
}

function RankModal({
  member,
  roles,
  action,
  onClose,
  onConfirm,
}: {
  member: Member;
  roles: Role[];
  action: "promote" | "demote" | "setRank";
  onClose: () => void;
  onConfirm: (rankId: number) => void;
}) {
  const [selectedRank, setSelectedRank] = useState<number | null>(null);

  const sortedRoles = [...roles].sort((a, b) => a.rank - b.rank);
  const currentRank = member.role.rank;
  const filtered = action === "promote"
    ? sortedRoles.filter((r) => r.rank > currentRank && r.rank < 255)
    : action === "demote"
    ? sortedRoles.filter((r) => r.rank < currentRank && r.rank > 0)
    : sortedRoles.filter((r) => r.rank !== currentRank && r.rank > 0 && r.rank < 255);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md glow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold capitalize">{action} {member.user.username}</h2>
          <button onClick={onClose} className="text-purple-400/50 hover:text-purple-300"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-purple-300/50 mb-4">Current rank: <span className="text-purple-300">{member.role.name}</span> (Rank {currentRank})</p>
        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-purple-400/40 text-center py-4">No available ranks</p>
          ) : filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRank(r.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-sm transition-colors ${
                selectedRank === r.id
                  ? "bg-purple-500/20 border border-purple-500/40 text-white"
                  : "hover:bg-purple-500/10 text-purple-300/70"
              }`}
            >
              <span>{r.name}</span>
              <span className="text-purple-400/50">Rank {r.rank}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
          <button
            onClick={() => selectedRank && onConfirm(selectedRank)}
            disabled={!selectedRank}
            className="btn btn-primary flex-1 disabled:opacity-60"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MembersClient() {
  const [groups, setGroups] = useState<RobloxGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<RobloxGroup | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [modal, setModal] = useState<{ member: Member; action: "promote" | "demote" | "setRank" } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/admin/groups")
      .then((r) => r.json())
      .then((d) => { if (d.success) setGroups(d.data); });
  }, []);

  const fetchMembers = useCallback(async (group: RobloxGroup, cur?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ groupId: group.robloxGroupId });
      if (cur) params.set("cursor", cur);
      const res = await fetch(`/api/admin/members?${params}`);
      const data = await res.json();
      if (data.success) {
        setMembers(cur ? (prev) => [...prev, ...data.data.data] : data.data.data || []);
        setNextCursor(data.data.nextPageCursor || null);
      }
    } catch {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  }, []);

  async function fetchRoles(group: RobloxGroup) {
    try {
      const res = await fetch(`/api/admin/groups/${group.id}/roles?robloxGroupId=${group.robloxGroupId}`);
      const data = await res.json();
      if (data.success) setRoles(data.data.roles || []);
    } catch {}
  }

  function selectGroup(group: RobloxGroup) {
    setSelectedGroup(group);
    setMembers([]);
    setCursor(null);
    setNextCursor(null);
    setSelected(new Set());
    fetchMembers(group);
    fetchRoles(group);
  }

  async function performAction(member: Member, action: "exile", rankId?: number): Promise<void>;
  async function performAction(member: Member, action: "promote" | "demote" | "setRank", rankId: number): Promise<void>;
  async function performAction(member: Member, action: string, rankId?: number) {
    if (!selectedGroup) return;
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          groupId: selectedGroup.id,
          robloxGroupId: selectedGroup.robloxGroupId,
          userId: member.user.userId.toString(),
          targetRankId: rankId,
        }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || "Action failed");
      else {
        toast.success(`${action} successful`);
        fetchMembers(selectedGroup);
        setModal(null);
      }
    } catch {
      toast.error("Network error");
    }
  }

  const filtered = members.filter((m) =>
    !search || m.user.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold gradient-text-white">Members</h1>
        <p className="text-purple-300/50 text-sm mt-0.5">Manage group members and ranks</p>
      </div>

      {/* Group selector */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <select
            value={selectedGroup?.id || ""}
            onChange={(e) => {
              const g = groups.find((g) => g.id === e.target.value);
              if (g) selectGroup(g);
            }}
            className="pr-10 appearance-none min-w-48"
          >
            <option value="">Select a group...</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/50 pointer-events-none" />
        </div>

        {selectedGroup && (
          <>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members..."
                className="pl-10"
              />
            </div>
            <button
              onClick={() => fetchMembers(selectedGroup)}
              className="btn btn-ghost gap-2"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {!selectedGroup ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Users className="w-12 h-12 text-purple-400/30 mx-auto mb-4" />
          <p className="text-purple-400/50">Select a group to manage members</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      className="w-auto"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelected(new Set(filtered.map((m) => m.user.userId)));
                        else setSelected(new Set());
                      }}
                    />
                  </th>
                  <th>Member</th>
                  <th>Rank</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && members.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4}>
                        <div className="h-10 bg-purple-500/5 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-purple-400/40 py-8">No members found</td>
                  </tr>
                ) : (
                  filtered.map((member) => (
                    <tr key={member.user.userId}>
                      <td className="w-8">
                        <input
                          type="checkbox"
                          className="w-auto"
                          checked={selected.has(member.user.userId)}
                          onChange={(e) => {
                            const next = new Set(selected);
                            if (e.target.checked) next.add(member.user.userId);
                            else next.delete(member.user.userId);
                            setSelected(next);
                          }}
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-semibold text-purple-300">
                            {member.user.username[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{member.user.username}</p>
                            {member.user.displayName !== member.user.username && (
                              <p className="text-xs text-purple-400/40">{member.user.displayName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-purple-300/70">
                          {member.role.name} <span className="text-purple-400/40">(#{member.role.rank})</span>
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setModal({ member, action: "promote" })}
                            className="p-1.5 text-green-400/60 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                            title="Promote"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setModal({ member, action: "demote" })}
                            className="p-1.5 text-orange-400/60 hover:text-orange-400 hover:bg-orange-400/10 rounded-lg transition-colors"
                            title="Demote"
                          >
                            <TrendingDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Exile ${member.user.username}?`)) {
                                performAction(member, "exile");
                              }
                            }}
                            className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Exile"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {nextCursor && (
            <div className="p-4 border-t border-purple-500/10 text-center">
              <button
                onClick={() => { setCursor(nextCursor); fetchMembers(selectedGroup, nextCursor); }}
                className="btn btn-ghost"
                disabled={loading}
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}

      {modal && (
        <RankModal
          member={modal.member}
          roles={roles}
          action={modal.action}
          onClose={() => setModal(null)}
          onConfirm={(rankId) => performAction(modal.member, modal.action, rankId)}
        />
      )}
    </div>
  );
}
