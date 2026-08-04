"use client";

import { useEffect, useState } from "react";
import { Globe, Users, UserCheck, Inbox, TrendingUp, Clock, Key, Zap, Crown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface Stats {
  groupCount: number;
  memberCount: number;
  activeStaff: number;
  pendingRequests: number;
  recentLogs: Array<{
    id: string;
    action: string;
    actor?: { username: string } | null;
    targetUsername?: string | null;
    createdAt: string;
    details: Record<string, unknown>;
  }>;
  licenseInfo: {
    tier: string;
    status: string;
    maxGroups: number;
    maxStaff: number;
    expiresAt?: string | null;
  } | null;
  apiUsage: Array<{ date: string; count: number }>;
}

const actionColors: Record<string, string> = {
  PROMOTE: "text-green-400 bg-green-400/10",
  DEMOTE: "text-orange-400 bg-orange-400/10",
  EXILE: "text-red-400 bg-red-400/10",
  LOGIN: "text-blue-400 bg-blue-400/10",
  USER_CREATED: "text-purple-400 bg-purple-400/10",
  API_KEY_CREATED: "text-yellow-400 bg-yellow-400/10",
  GROUP_LINKED: "text-cyan-400 bg-cyan-400/10",
  ACCEPT_REQUEST: "text-emerald-400 bg-emerald-400/10",
  REJECT_REQUEST: "text-rose-400 bg-rose-400/10",
  WARNING_ISSUED: "text-amber-400 bg-amber-400/10",
};

function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  sub?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 glow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-purple-300/50 font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1 gradient-text-white">{value}</p>
          {sub && <p className="text-xs text-purple-400/40 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-purple-500/10 rounded-lg ${className}`} />;
}

export default function DashboardClient({ user }: { user?: { name?: string | null } | null }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const tierColors: Record<string, string> = {
    STARTER: "text-blue-400",
    PROFESSIONAL: "text-purple-400",
    ENTERPRISE: "text-yellow-400",
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text-white">Dashboard</h1>
        <p className="text-purple-300/50 text-sm mt-0.5">
          Welcome back, <span className="text-purple-300">{user?.name || "User"}</span>
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={Globe}
              label="Total Groups"
              value={stats?.groupCount || 0}
              color="bg-purple-500/15 text-purple-400"
            />
            <StatCard
              icon={Users}
              label="Total Members"
              value={(stats?.memberCount || 0).toLocaleString()}
              color="bg-blue-500/15 text-blue-400"
              sub="Across all groups"
            />
            <StatCard
              icon={UserCheck}
              label="Active Staff"
              value={stats?.activeStaff || 0}
              color="bg-green-500/15 text-green-400"
            />
            <StatCard
              icon={Inbox}
              label="Pending Requests"
              value={stats?.pendingRequests || 0}
              color="bg-orange-500/15 text-orange-400"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="xl:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Recent Activity
            </h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : stats?.recentLogs?.length ? (
            <div className="space-y-2">
              {stats.recentLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-500/5 transition-colors">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${actionColors[log.action] || "text-purple-400 bg-purple-400/10"}`}>
                    {log.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm text-purple-200/70 flex-1 truncate">
                    {log.actor?.username && <span className="font-medium text-purple-300">{log.actor.username}</span>}
                    {log.targetUsername && <span> → {log.targetUsername}</span>}
                  </span>
                  <span className="text-xs text-purple-400/40 whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-purple-400/30 text-sm">
              No recent activity
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* License Card */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-purple-400" />
              <h2 className="font-semibold">License</h2>
            </div>
            {loading ? (
              <Skeleton className="h-20" />
            ) : stats?.licenseInfo ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-300/60">Plan</span>
                  <span className={`text-sm font-semibold ${tierColors[stats.licenseInfo.tier] || "text-purple-400"}`}>
                    {stats.licenseInfo.tier}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-300/60">Status</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    stats.licenseInfo.status === "ACTIVE"
                      ? "text-green-400 bg-green-400/10"
                      : "text-red-400 bg-red-400/10"
                  }`}>
                    {stats.licenseInfo.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-300/60">Max Groups</span>
                  <span className="text-sm">{stats.licenseInfo.maxGroups}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-300/60">Max Staff</span>
                  <span className="text-sm">{stats.licenseInfo.maxStaff}</span>
                </div>
                {stats.licenseInfo.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-300/60">Expires</span>
                    <span className="text-xs text-orange-400">
                      {formatDistanceToNow(new Date(stats.licenseInfo.expiresAt), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-purple-400/40">No license found</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-purple-400" />
              <h2 className="font-semibold">Quick Actions</h2>
            </div>
            <div className="space-y-2">
              {[
                { label: "Link Group", href: "/groups", icon: Globe },
                { label: "Manage Members", href: "/members", icon: Users },
                { label: "Generate API Key", href: "/api-keys", icon: Key },
              ].map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-purple-500/10 text-sm text-purple-300/70 hover:text-purple-200 transition-colors"
                >
                  <Icon className="w-4 h-4 text-purple-400/60" />
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* API Usage Chart */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <h2 className="font-semibold">API Usage – Last 7 Days</h2>
        </div>
        {loading ? (
          <Skeleton className="h-48" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats?.apiUsage || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,85,247,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(168,85,247,0.5)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(168,85,247,0.5)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 5, 30, 0.95)",
                  border: "1px solid rgba(168,85,247,0.25)",
                  borderRadius: "10px",
                  color: "#f0e8ff",
                  fontSize: 12,
                }}
                cursor={{ fill: "rgba(168,85,247,0.06)" }}
              />
              <Bar dataKey="count" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
