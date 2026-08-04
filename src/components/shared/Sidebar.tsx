"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  Zap, LayoutDashboard, Users, Shield, Key, FileText,
  Webhook, Settings, LogOut, ChevronLeft, ChevronRight,
  Globe, UserCog, AlertTriangle, GitBranch, Inbox, Crown,
  Star, Rocket, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navSections = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Group Management",
    items: [
      { label: "Groups", href: "/groups", icon: Globe },
      { label: "Members", href: "/members", icon: Users },
      { label: "Ranks", href: "/ranks", icon: GitBranch },
      { label: "Join Requests", href: "/join-requests", icon: Inbox },
    ],
  },
  {
    label: "Staff",
    items: [
      { label: "Users", href: "/users", icon: UserCog },
      { label: "Permissions", href: "/permissions", icon: Shield },
      { label: "Warnings", href: "/warnings", icon: AlertTriangle },
    ],
  },
  {
    label: "System",
    items: [
      { label: "API Keys", href: "/api-keys", icon: Key },
      { label: "Audit Logs", href: "/audit-logs", icon: FileText },
      { label: "Webhooks", href: "/webhooks", icon: Webhook },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

const tierConfig = {
  STARTER: { label: "Starter", icon: Star, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  PROFESSIONAL: { label: "Professional", icon: Rocket, color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  ENTERPRISE: { label: "Enterprise", icon: Crown, color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
};

interface SidebarProps {
  user: { name?: string | null; email?: string | null; role?: string };
  licenseTier?: string;
}

export default function Sidebar({ user, licenseTier = "STARTER" }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const tier = tierConfig[licenseTier as keyof typeof tierConfig] || tierConfig.STARTER;
  const TierIcon = tier.icon;

  const sidebarContent = (
    <div className={cn(
      "flex flex-col h-full transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-purple-500/10">
        <div className="w-9 h-9 rounded-xl glass-strong glow-sm flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-purple-400" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-lg gradient-text-white">RankFlow</span>
            <p className="text-xs text-purple-400/40 -mt-0.5">Group Dashboard</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 text-purple-400/40 hover:text-purple-400 transition-colors hidden md:flex"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="text-xs font-semibold text-purple-500/40 uppercase tracking-wider px-2 mb-2">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group",
                      active
                        ? "text-white bg-purple-600/20 border border-purple-500/25"
                        : "text-purple-300/60 hover:text-purple-200 hover:bg-purple-500/8"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-purple-400 rounded-r" />
                    )}
                    <Icon className={cn("w-4 h-4 flex-shrink-0", active && "text-purple-400")} />
                    {!collapsed && item.label}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* License Badge */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium", tier.color)}>
            <TierIcon className="w-3.5 h-3.5" />
            <span>{tier.label} Plan</span>
          </div>
        </div>
      )}

      {/* User */}
      <div className="border-t border-purple-500/10 p-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-purple-300">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-purple-400/50 truncate">{user.role || "Staff"}</p>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 text-purple-400/40 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden glass p-2 rounded-xl"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen z-40 glass-strong border-r border-purple-500/10 transition-transform duration-300",
          "md:relative md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
