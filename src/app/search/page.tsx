"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, GitBranch, Users, Star, ArrowRight, Loader2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";
import type { SearchResult } from "@/types";

function ProjectResult({ result }: { result: SearchResult }) {
  return (
    <Link href={result.url}>
      <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all group">
        <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {result.image ? (
            <Image src={result.image} alt={result.title} width={40} height={40} className="rounded-xl" />
          ) : (
            <GitBranch className="w-4 h-4 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {result.title}
          </p>
          {result.subtitle && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{result.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
          {result.meta?.stars !== undefined && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {formatNumber(result.meta.stars as number)}
            </span>
          )}
          {result.meta?.raised !== undefined && (
            <span className="text-green-600">${formatNumber(result.meta.raised as number)}</span>
          )}
          <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-blue-500 transition-colors" />
        </div>
      </div>
    </Link>
  );
}

function UserResult({ result }: { result: SearchResult }) {
  return (
    <Link href={result.url}>
      <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all group">
        <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-gray-100 border border-gray-200">
          {result.image ? (
            <Image src={result.image} alt={result.title} width={40} height={40} className="rounded-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {result.title}
          </p>
          {result.subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{result.subtitle}</p>
          )}
        </div>
        <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
      </div>
    </Link>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query) {
        const url = new URL(window.location.href);
        url.searchParams.set("q", query);
        router.replace(url.pathname + url.search, { scroll: false });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, router]);

  const { data, isLoading, isFetching } = useQuery<{ projects: SearchResult[]; users: SearchResult[] }>({
    queryKey: ["search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return { projects: [], users: [] };
      const r = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!r.ok) throw new Error("Search failed");
      return r.json() as Promise<{ projects: SearchResult[]; users: SearchResult[] }>;
    },
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 30_000,
  });

  const projects = data?.projects ?? [];
  const users = data?.users ?? [];
  const hasResults = projects.length > 0 || users.length > 0;
  const isEmpty = debouncedQuery.trim().length === 0;
  const loading = isLoading || isFetching;

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Search</h1>
          <p className="text-sm text-gray-400">Find projects, maintainers, and organizations</p>
        </div>

        <div className="relative mb-8">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {loading && query ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects or people..."
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-base shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium">Start typing to search</p>
            <p className="text-gray-400 text-sm mt-1">Search across projects, maintainers, and organizations</p>
          </div>
        ) : loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
          </div>
        ) : !hasResults ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium">No results for &ldquo;{debouncedQuery}&rdquo;</p>
            <p className="text-gray-400 text-sm mt-1">Try a different keyword or browse explore</p>
            <Link href="/explore" className="mt-4 text-sm text-blue-600 hover:text-blue-800 transition-colors">
              Browse all projects →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {projects.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="w-4 h-4 text-gray-400" />
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Projects</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{projects.length}</span>
                </div>
                <div className="space-y-2">
                  {projects.map((r) => <ProjectResult key={r.id} result={r} />)}
                </div>
              </section>
            )}

            {users.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">People</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{users.length}</span>
                </div>
                <div className="space-y-2">
                  {users.map((r) => <UserResult key={r.id} result={r} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
