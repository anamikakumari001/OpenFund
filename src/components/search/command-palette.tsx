"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  Home,
  Compass,
  LayoutDashboard,
  Settings,
  User,
  Zap,
  TrendingUp,
  GitBranch,
  Bell,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "project" | "user";
  title: string;
  subtitle?: string;
  url: string;
  image?: string;
}

const STATIC_COMMANDS = [
  { id: "home", icon: Home, label: "Go Home", url: "/", group: "Navigation" },
  { id: "explore", icon: Compass, label: "Explore Projects", url: "/explore", group: "Navigation" },
  { id: "trending", icon: TrendingUp, label: "Trending Projects", url: "/explore?tab=trending", group: "Navigation" },
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", url: "/dashboard", group: "Navigation" },
  { id: "new", icon: Plus, label: "Launch New Project", url: "/dashboard/new", group: "Actions" },
  { id: "notifications", icon: Bell, label: "Notifications", url: "/notifications", group: "Navigation" },
  { id: "settings", icon: Settings, label: "Settings", url: "/settings", group: "Navigation" },
  { id: "profile", icon: User, label: "My Profile", url: "/profile", group: "Navigation" },
  { id: "marketplace", icon: GitBranch, label: "Contributor Marketplace", url: "/explore?tab=marketplace", group: "Navigation" },
];

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!commandPaletteOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
    }
  }, [commandPaletteOpen]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? []);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  const navigate = (url: string) => {
    router.push(url);
    setCommandPaletteOpen(false);
  };

  if (!commandPaletteOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      />
      <div className="fixed left-1/2 top-[18%] z-[101] w-full max-w-xl -translate-x-1/2 px-4">
        <Command
          className="rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-300/40 overflow-hidden"
          shouldFilter={false}
        >
          <div className="flex items-center gap-3 px-4 border-b border-gray-100">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search projects, maintainers..."
              className="flex-1 h-14 bg-transparent text-gray-900 placeholder:text-gray-400 text-sm outline-none"
            />
            {loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
            )}
            <kbd className="px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-400 font-sans">ESC</kbd>
          </div>

          <Command.List className="max-h-[380px] overflow-y-auto p-2 space-y-0.5">
            {results.length > 0 && (
              <Command.Group heading={
                <span className="px-2 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Results
                </span>
              }>
                {results.map((result) => (
                  <Command.Item
                    key={result.id}
                    value={result.id}
                    onSelect={() => navigate(result.url)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer",
                      "text-gray-700 hover:text-gray-900 hover:bg-gray-50",
                      "aria-selected:bg-gray-50 aria-selected:text-gray-900",
                      "transition-all"
                    )}
                  >
                    {result.image ? (
                      <Image src={result.image} alt="" width={32} height={32} className="rounded-lg object-cover border border-gray-200" />
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-xs text-gray-400 truncate">{result.subtitle}</div>
                      )}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {Object.entries(
              STATIC_COMMANDS.reduce((acc, cmd) => {
                if (!query || cmd.label.toLowerCase().includes(query.toLowerCase())) {
                  if (!acc[cmd.group]) acc[cmd.group] = [];
                  acc[cmd.group].push(cmd);
                }
                return acc;
              }, {} as Record<string, typeof STATIC_COMMANDS>)
            ).map(([group, cmds]) => (
              <Command.Group
                key={group}
                heading={
                  <span className="px-2 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    {group}
                  </span>
                }
              >
                {cmds.map((cmd) => (
                  <Command.Item
                    key={cmd.id}
                    value={cmd.id}
                    onSelect={() => navigate(cmd.url)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer",
                      "text-gray-700 hover:text-gray-900 hover:bg-gray-50",
                      "aria-selected:bg-gray-50 aria-selected:text-gray-900",
                      "transition-all"
                    )}
                  >
                    <div className="h-7 w-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <cmd.icon className="h-3.5 w-3.5 text-gray-500" />
                    </div>
                    <span className="text-sm text-gray-700">{cmd.label}</span>
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-gray-300" />
                  </Command.Item>
                ))}
              </Command.Group>
            ))}

            <Command.Empty className="py-8 text-center text-sm text-gray-400">
              No results for &quot;{query}&quot;
            </Command.Empty>
          </Command.List>

          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">↵</kbd> Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">ESC</kbd> Close
            </span>
          </div>
        </Command>
      </div>
    </>
  );
}
