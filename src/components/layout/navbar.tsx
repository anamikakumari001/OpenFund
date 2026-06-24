"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Search, Bell, Command, GitBranch, ChevronDown,
  LogOut, Settings, LayoutDashboard, User, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUIStore } from "@/stores/ui";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/explore", label: "Projects" },
  { href: "/explore?tab=trending", label: "Explore" },
  { href: "/explore?tab=marketplace", label: "Funding" },
  { href: "/wallet", label: "Wallet" },
];

export function Navbar() {
  const { data: session, status } = useSession();
  const { setCommandPaletteOpen } = useUIStore();
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setCommandPaletteOpen]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.06)]"
          : "bg-white"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 h-14 items-center">

          {/* LEFT — Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-7 w-7 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
                  <path d="M8 2L14 6V10L8 14L2 10V6L8 2Z" fill="white" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900 tracking-tight">
                OpenFund
              </span>
            </Link>
          </div>

          {/* CENTER — Nav links */}
          <nav className="hidden md:flex items-center justify-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-1.5 text-sm text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-150 font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* RIGHT — Actions */}
          <div className="flex items-center justify-end gap-1.5">
            {/* Search */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all text-sm"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:block text-xs">Search</span>
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[10px] text-gray-400 font-sans ml-1">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </button>

            {status === "loading" ? (
              <div className="h-7 w-7 rounded-full bg-gray-100 animate-pulse" />
            ) : session ? (
              <>
                <Link href="/notifications">
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                    <Bell className="h-4 w-4" />
                  </button>
                </Link>

                <Link href="/dashboard/new" className="hidden sm:block">
                  <Button size="sm" variant="default" className="gap-1.5 h-7 text-xs px-3">
                    <Plus className="h-3 w-3" />
                    Launch
                  </Button>
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={session.user?.image ?? ""} />
                      <AvatarFallback className="text-[10px]">
                        {session.user?.name?.[0] ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 text-gray-400 transition-transform hidden sm:block",
                        userMenuOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-1.5 w-52 rounded-xl border border-gray-200 bg-white shadow-lg shadow-gray-200/60 overflow-hidden z-50">
                        <div className="px-3.5 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 leading-tight">{session.user?.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            @{session.user?.githubUsername ?? "user"}
                          </p>
                        </div>
                        <div className="p-1.5 space-y-0.5">
                          {[
                            { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
                            { href: `/profile/${session.user?.githubUsername}`, icon: User, label: "Profile" },
                            { href: "/settings", icon: Settings, label: "Settings" },
                          ].map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all"
                            >
                              <item.icon className="h-3.5 w-3.5 text-gray-400" />
                              {item.label}
                            </Link>
                          ))}
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button
                              onClick={() => { signOut(); setUserMenuOpen(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-all"
                            >
                              <LogOut className="h-3.5 w-3.5" />
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Button
                onClick={() => signIn("github")}
                size="sm"
                variant="default"
                className="gap-1.5 h-7 text-xs px-3"
              >
                <GitBranch className="h-3 w-3" />
                Sign in
              </Button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
