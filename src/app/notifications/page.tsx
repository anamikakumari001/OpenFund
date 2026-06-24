"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  GitCommit,
  DollarSign,
  Star,
  AlertCircle,
  GitPullRequest,
  Users,
  Megaphone,
  Loader2,
  Check,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string | null;
    image: string | null;
    githubUsername: string | null;
  } | null;
}

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; iconClass: string; bgClass: string }> = {
  DONATION:  { icon: DollarSign,    iconClass: "text-green-600", bgClass: "bg-green-50 border-green-200" },
  MILESTONE: { icon: GitCommit,     iconClass: "text-blue-600",  bgClass: "bg-blue-50 border-blue-200" },
  COMMENT:   { icon: AlertCircle,   iconClass: "text-purple-600",bgClass: "bg-purple-50 border-purple-200" },
  RELEASE:   { icon: GitPullRequest,iconClass: "text-amber-600", bgClass: "bg-amber-50 border-amber-200" },
  FOLLOW:    { icon: Users,         iconClass: "text-pink-600",  bgClass: "bg-pink-50 border-pink-200" },
  STAR:      { icon: Star,          iconClass: "text-yellow-600",bgClass: "bg-yellow-50 border-yellow-200" },
  SYSTEM:    { icon: Megaphone,     iconClass: "text-gray-500",  bgClass: "bg-gray-100 border-gray-200" },
};

const FILTERS = ["All", "Unread", "Donations", "Milestones", "Comments", "Releases"];

const FILTER_TO_TYPE: Record<string, string> = {
  Donations: "DONATION",
  Milestones: "MILESTONE",
  Comments: "COMMENT",
  Releases: "RELEASE",
};

function NotificationItem({ n, onMarkRead }: { n: Notification; onMarkRead: (id: string) => void }) {
  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.SYSTEM;
  const Icon = cfg.icon;

  return (
    <div
      className={`relative flex gap-4 p-4 rounded-2xl border transition-all group ${
        n.read
          ? "border-gray-100 bg-white hover:border-gray-200"
          : "border-gray-200 bg-white shadow-sm"
      }`}
    >
      {!n.read && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-600" />
      )}

      <div className={`flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center ${cfg.bgClass}`}>
        <Icon className={`w-4 h-4 ${cfg.iconClass}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className={`text-sm font-medium ${n.read ? "text-gray-600" : "text-gray-900"}`}>{n.title}</p>
            {n.body && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>}
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
            {timeAgo(new Date(n.createdAt))}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-2">
          {n.actor && (
            <div className="flex items-center gap-1.5">
              {n.actor.image ? (
                <Image src={n.actor.image} alt={n.actor.name ?? ""} width={16} height={16} className="rounded-full" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-gray-200" />
              )}
              <span className="text-xs text-gray-400">
                {n.actor.name ?? n.actor.githubUsername ?? "Someone"}
              </span>
            </div>
          )}
          {n.link && (
            <Link href={n.link} className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
              View →
            </Link>
          )}
          {!n.read && (
            <button
              onClick={() => onMarkRead(n.id)}
              className="ml-auto text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Check className="w-3 h-3" /> Mark read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState("All");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const r = await fetch("/api/notifications");
      if (!r.ok) throw new Error("Failed to fetch");
      const json = await r.json() as { notifications: Notification[] };
      return json.notifications;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = () => {
    const unread = (data ?? []).filter((n) => !n.read).map((n) => n.id);
    if (unread.length > 0) markReadMutation.mutate(unread);
  };

  const filtered = (data ?? []).filter((n) => {
    if (filter === "Unread") return !n.read;
    if (FILTER_TO_TYPE[filter]) return n.type === FILTER_TO_TYPE[filter];
    return true;
  });

  const unreadCount = (data ?? []).filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-400 mt-0.5">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markReadMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-600 hover:text-gray-900 border border-gray-200 bg-white hover:bg-gray-50 transition-all"
              >
                {markReadMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                Mark all read
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                {f}
                {f === "Unread" && unreadCount > 0 && (
                  <span className="ml-1.5 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium">No notifications</p>
            <p className="text-gray-400 text-sm mt-1">
              {filter === "Unread" ? "You're all caught up!" : "Nothing here yet."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((n) => (
              <NotificationItem
                key={n.id}
                n={n}
                onMarkRead={(id) => markReadMutation.mutate([id])}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
