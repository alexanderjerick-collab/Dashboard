"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Settings, Globe, Shield, Crown, Bell, User, Eye, EyeOff,
  CheckCircle, XCircle, Unlink, Loader2
} from "lucide-react";
import Image from "next/image";

type Tab = "general" | "roblox" | "security" | "license" | "notifications";

interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
  robloxUserId?: string | null;
  robloxUsername?: string | null;
  robloxAvatarUrl?: string | null;
  twoFactorEnabled: boolean;
}

interface LicenseData {
  id: string;
  tier: string;
  status: string;
  maxGroups: number;
  maxStaff: number;
  hasAnalytics: boolean;
  hasWebhooks: boolean;
  apiRateLimit: number;
  expiresAt?: Date | null;
}

const tierDetails: Record<string, { color: string; features: string[] }> = {
  STARTER: {
    color: "text-blue-400",
    features: ["1 Group", "5 Staff Members", "100 API calls/min", "Basic Management"],
  },
  PROFESSIONAL: {
    color: "text-purple-400",
    features: ["5 Groups", "25 Staff Members", "500 API calls/min", "Analytics", "Webhooks"],
  },
  ENTERPRISE: {
    color: "text-yellow-400",
    features: ["Unlimited Groups", "Unlimited Staff", "Unlimited API calls", "All Features", "Priority Support"],
  },
};

export default function SettingsClient({
  user: initialUser,
  license,
}: {
  user: UserData | null;
  license: LicenseData | null;
}) {
  const [tab, setTab] = useState<Tab>("general");
  const [user, setUser] = useState(initialUser);
  const [robloxCookie, setRobloxCookie] = useState("");
  const [showCookie, setShowCookie] = useState(false);
  const [linkingRoblox, setLinkingRoblox] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [changingPass, setChangingPass] = useState(false);

  async function linkRoblox() {
    if (!robloxCookie.trim()) return;
    setLinkingRoblox(true);
    try {
      const res = await fetch("/api/admin/settings/roblox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie: robloxCookie }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || "Failed to link Roblox account");
      else {
        toast.success(`Linked as ${data.data.robloxUsername}!`);
        setUser((u) => u ? {
          ...u,
          robloxUserId: data.data.robloxUserId.toString(),
          robloxUsername: data.data.robloxUsername,
          robloxAvatarUrl: data.data.avatarUrl,
        } : u);
        setRobloxCookie("");
      }
    } catch { toast.error("Network error"); }
    finally { setLinkingRoblox(false); }
  }

  async function unlinkRoblox() {
    if (!confirm("Unlink your Roblox account? You won't be able to perform actions on groups.")) return;
    try {
      const res = await fetch("/api/admin/settings/roblox", { method: "DELETE" });
      if (res.ok) {
        toast.success("Roblox account unlinked");
        setUser((u) => u ? { ...u, robloxUserId: null, robloxUsername: null, robloxAvatarUrl: null } : u);
      }
    } catch { toast.error("Network error"); }
  }

  async function changePassword() {
    if (newPass !== confirmPass) { toast.error("Passwords don't match"); return; }
    if (newPass.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setChangingPass(true);
    try {
      const res = await fetch("/api/admin/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || "Failed to change password");
      else { toast.success("Password changed successfully"); setOldPass(""); setNewPass(""); setConfirmPass(""); }
    } catch { toast.error("Network error"); }
    finally { setChangingPass(false); }
  }

  const tabs: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
    { id: "general", label: "General", icon: Settings },
    { id: "roblox", label: "Roblox", icon: Globe },
    { id: "security", label: "Security", icon: Shield },
    { id: "license", label: "License", icon: Crown },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold gradient-text-white">Settings</h1>
        <p className="text-purple-300/50 text-sm mt-0.5">Configure your dashboard preferences</p>
      </div>

      <div className="flex gap-1 glass rounded-2xl p-1.5 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === id
                ? "bg-purple-600/30 text-white border border-purple-500/30"
                : "text-purple-300/60 hover:text-purple-200 hover:bg-purple-500/10"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" /> Account Info
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Username</label>
              <input value={user?.username || ""} readOnly className="opacity-60 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Email</label>
              <input value={user?.email || ""} readOnly className="opacity-60 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Role</label>
              <input value={user?.role || ""} readOnly className="opacity-60 cursor-not-allowed" />
            </div>
          </div>
          <p className="text-xs text-purple-400/40">Contact an administrator to change your username or email.</p>
        </div>
      )}

      {tab === "roblox" && (
        <div className="glass rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-400" /> Roblox Account
          </h2>

          {user?.robloxUsername ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-3">
                {user.robloxAvatarUrl && (
                  <Image src={user.robloxAvatarUrl} alt="Avatar" width={40} height={40} className="rounded-full" />
                )}
                <div>
                  <p className="font-medium text-green-400">{user.robloxUsername}</p>
                  <p className="text-xs text-green-400/60">ID: {user.robloxUserId}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-400 ml-2" />
              </div>
              <button onClick={unlinkRoblox} className="btn btn-ghost gap-2 text-sm">
                <Unlink className="w-4 h-4" /> Unlink
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-orange-400" />
              <p className="text-sm text-orange-400">No Roblox account linked. Link one to perform group actions.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-purple-200/70 mb-1.5">
              {user?.robloxUsername ? "Update" : "Enter"} .ROBLOSECURITY Cookie
            </label>
            <div className="relative">
              <input
                type={showCookie ? "text" : "password"}
                value={robloxCookie}
                onChange={(e) => setRobloxCookie(e.target.value)}
                placeholder=".ROBLOSECURITY=_|WARNING:-DO-NOT..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCookie(!showCookie)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400/50 hover:text-purple-400"
              >
                {showCookie ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-purple-400/40 mt-1">
              Get this from your browser cookies on roblox.com. It&apos;s encrypted before storage.
            </p>
          </div>

          <button
            onClick={linkRoblox}
            disabled={linkingRoblox || !robloxCookie.trim()}
            className="btn btn-primary gap-2 disabled:opacity-60"
          >
            {linkingRoblox ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {linkingRoblox ? "Linking..." : user?.robloxUsername ? "Update Account" : "Link Account"}
          </button>
        </div>
      )}

      {tab === "security" && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" /> Change Password
            </h2>
            <div className="space-y-3 max-w-sm">
              <div>
                <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Current Password</label>
                <input type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200/70 mb-1.5">New Password</label>
                <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200/70 mb-1.5">Confirm New Password</label>
                <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="••••••••" />
              </div>
              <button
                onClick={changePassword}
                disabled={changingPass || !oldPass || !newPass || !confirmPass}
                className="btn btn-primary gap-2 disabled:opacity-60"
              >
                {changingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Change Password
              </button>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
              Two-Factor Authentication
            </h2>
            <div className={`p-3 rounded-xl flex items-center gap-2 mb-4 ${
              user?.twoFactorEnabled ? "bg-green-500/10 border border-green-500/20" : "bg-orange-500/10 border border-orange-500/20"
            }`}>
              {user?.twoFactorEnabled
                ? <><CheckCircle className="w-4 h-4 text-green-400" /><span className="text-sm text-green-400">2FA is enabled</span></>
                : <><XCircle className="w-4 h-4 text-orange-400" /><span className="text-sm text-orange-400">2FA is not enabled</span></>
              }
            </div>
            <p className="text-sm text-purple-400/40">2FA setup coming soon. Contact support for assistance.</p>
          </div>
        </div>
      )}

      {tab === "license" && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-5">
            <Crown className="w-5 h-5 text-purple-400" /> License Details
          </h2>
          {license ? (
            <div className="space-y-4">
              <div className={`text-3xl font-bold ${tierDetails[license.tier]?.color || "text-purple-400"}`}>
                {license.tier}
              </div>
              <div className={`inline-flex text-xs px-3 py-1 rounded-full ${
                license.status === "ACTIVE" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
              }`}>
                {license.status}
              </div>
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-purple-500/10">
                <div>
                  <p className="text-sm text-purple-400/50">Max Groups</p>
                  <p className="text-xl font-semibold">{license.maxGroups}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-400/50">Max Staff</p>
                  <p className="text-xl font-semibold">{license.maxStaff}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-400/50">API Rate Limit</p>
                  <p className="text-xl font-semibold">{license.apiRateLimit}/min</p>
                </div>
                <div>
                  <p className="text-sm text-purple-400/50">Analytics</p>
                  <p className="text-xl font-semibold">{license.hasAnalytics ? "Yes" : "No"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-purple-400/50 mb-2">Features</p>
                <ul className="space-y-1">
                  {(tierDetails[license.tier]?.features || []).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-purple-200/70">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              {license.tier !== "ENTERPRISE" && (
                <div className="pt-4 border-t border-purple-500/10">
                  <p className="text-sm text-purple-300/50 mb-3">Want more features? Upgrade your plan.</p>
                  <button className="btn btn-primary gap-2">
                    <Crown className="w-4 h-4" /> Upgrade Plan
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-purple-400/40">No license found. Contact support.</p>
          )}
        </div>
      )}

      {tab === "notifications" && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-5">
            <Bell className="w-5 h-5 text-purple-400" /> Notification Preferences
          </h2>
          <div className="space-y-4 max-w-sm">
            {[
              { label: "Email on new join requests", key: "email_join_requests" },
              { label: "Email on staff warnings", key: "email_warnings" },
              { label: "Email on API key usage", key: "email_api_keys" },
            ].map(({ label, key }) => (
              <label key={key} className="flex items-center justify-between p-3 rounded-xl hover:bg-purple-500/5 transition-colors cursor-pointer">
                <span className="text-sm text-purple-200/70">{label}</span>
                <input type="checkbox" className="w-4 h-4 accent-purple-500" style={{ width: "16px" }} />
              </label>
            ))}
            <p className="text-xs text-purple-400/40 pt-2">Email notification settings coming soon.</p>
          </div>
        </div>
      )}
    </div>
  );
}
