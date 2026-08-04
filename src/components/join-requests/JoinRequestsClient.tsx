"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Inbox, Check, X, ChevronDown, RefreshCw, CheckCheck } from "lucide-react";

interface Group {
  id: string;
  robloxGroupId: string;
  name: string;
}

interface JoinRequest {
  requester: {
    userId: number;
    username: string;
    displayName: string;
  };
  created: string;
}

export default function JoinRequestsClient() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/admin/groups")
      .then((r) => r.json())
      .then((d) => { if (d.success) setGroups(d.data); });
  }, []);

  const fetchRequests = useCallback(async (group: Group) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/join-requests?groupId=${group.robloxGroupId}`);
      const data = await res.json();
      if (data.success) setRequests(data.data?.data || []);
    } catch {
      toast.error("Failed to load join requests");
    } finally {
      setLoading(false);
    }
  }, []);

  function selectGroup(group: Group) {
    setSelectedGroup(group);
    setRequests([]);
    fetchRequests(group);
  }

  async function handleAction(userId: number, username: string, action: "accept" | "decline") {
    if (!selectedGroup) return;
    setProcessing((prev) => new Set(prev).add(userId));
    try {
      const res = await fetch("/api/admin/join-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          groupId: selectedGroup.id,
          robloxGroupId: selectedGroup.robloxGroupId,
          userId: userId.toString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || "Action failed");
      else {
        toast.success(`${action === "accept" ? "Accepted" : "Declined"} ${username}`);
        setRequests((prev) => prev.filter((r) => r.requester.userId !== userId));
      }
    } catch {
      toast.error("Network error");
    } finally {
      setProcessing((prev) => { const n = new Set(prev); n.delete(userId); return n; });
    }
  }

  async function acceptAll() {
    if (!selectedGroup || requests.length === 0) return;
    if (!confirm(`Accept all ${requests.length} join requests?`)) return;
    for (const req of requests) {
      await handleAction(req.requester.userId, req.requester.username, "accept");
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text-white">Join Requests</h1>
          <p className="text-purple-300/50 text-sm mt-0.5">Review and manage pending group join requests</p>
        </div>
        {selectedGroup && requests.length > 0 && (
          <button onClick={acceptAll} className="btn btn-primary gap-2">
            <CheckCheck className="w-4 h-4" />
            Accept All ({requests.length})
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
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
          <button onClick={() => fetchRequests(selectedGroup)} className="btn btn-ghost gap-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {!selectedGroup ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Inbox className="w-12 h-12 text-purple-400/30 mx-auto mb-4" />
          <p className="text-purple-400/50">Select a group to see join requests</p>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-purple-500/5 animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Inbox className="w-12 h-12 text-purple-400/30 mx-auto mb-4" />
          <h3 className="font-semibold text-purple-200/60 mb-2">No pending requests</h3>
          <p className="text-sm text-purple-400/40">All join requests have been handled</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => {
                const isProcessing = processing.has(req.requester.userId);
                return (
                  <tr key={req.requester.userId}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-semibold text-purple-300">
                          {req.requester.username[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{req.requester.username}</p>
                          {req.requester.displayName !== req.requester.username && (
                            <p className="text-xs text-purple-400/40">{req.requester.displayName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-purple-300/50">
                      {new Date(req.created).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAction(req.requester.userId, req.requester.username, "accept")}
                          disabled={isProcessing}
                          className="btn gap-1.5 py-1.5 text-green-400 bg-green-400/10 border border-green-400/20 hover:bg-green-400/20 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                          onClick={() => handleAction(req.requester.userId, req.requester.username, "decline")}
                          disabled={isProcessing}
                          className="btn gap-1.5 py-1.5 text-red-400 bg-red-400/10 border border-red-400/20 hover:bg-red-400/20 disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" /> Decline
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
