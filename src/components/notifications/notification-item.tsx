"use client";

import {
  Heart, CheckCircle2, Target, GitBranch, Bug, Zap, Star, MessageCircle, Bell,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

type NotificationType =
  | "DONATION_RECEIVED"
  | "MILESTONE_COMPLETED"
  | "FUNDING_GOAL_REACHED"
  | "NEW_RELEASE"
  | "NEW_ISSUE"
  | "DONATION_CONFIRMED"
  | "PROJECT_UPDATE"
  | "BADGE_EARNED"
  | "COMMENT_REPLY";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date | string;
  projectId?: string | null;
}

const ICON_MAP: Record<NotificationType, { icon: typeof Heart; iconClass: string; bgClass: string }> = {
  DONATION_RECEIVED:   { icon: Heart,        iconClass: "text-pink-600",  bgClass: "bg-pink-50 border-pink-200" },
  MILESTONE_COMPLETED: { icon: CheckCircle2, iconClass: "text-green-600", bgClass: "bg-green-50 border-green-200" },
  FUNDING_GOAL_REACHED:{ icon: Target,       iconClass: "text-blue-600",  bgClass: "bg-blue-50 border-blue-200" },
  NEW_RELEASE:         { icon: GitBranch,    iconClass: "text-purple-600",bgClass: "bg-purple-50 border-purple-200" },
  NEW_ISSUE:           { icon: Bug,          iconClass: "text-amber-600", bgClass: "bg-amber-50 border-amber-200" },
  DONATION_CONFIRMED:  { icon: Zap,          iconClass: "text-blue-600",  bgClass: "bg-blue-50 border-blue-200" },
  PROJECT_UPDATE:      { icon: Star,         iconClass: "text-yellow-600",bgClass: "bg-yellow-50 border-yellow-200" },
  BADGE_EARNED:        { icon: Star,         iconClass: "text-amber-600", bgClass: "bg-amber-50 border-amber-200" },
  COMMENT_REPLY:       { icon: MessageCircle,iconClass: "text-gray-500",  bgClass: "bg-gray-100 border-gray-200" },
};

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const { icon: Icon, iconClass, bgClass } = ICON_MAP[notification.type] ?? { icon: Bell, iconClass: "text-gray-500", bgClass: "bg-gray-100 border-gray-200" };

  return (
    <div
      onClick={() => !notification.read && onRead?.(notification.id)}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer",
        notification.read
          ? "border-gray-100 bg-white opacity-70"
          : "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      <div className={cn("h-8 w-8 rounded-xl border flex items-center justify-center shrink-0", bgClass, iconClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-xs text-gray-300 mt-1">{timeAgo(notification.createdAt)}</p>
      </div>
      {!notification.read && (
        <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" />
      )}
    </div>
  );
}
