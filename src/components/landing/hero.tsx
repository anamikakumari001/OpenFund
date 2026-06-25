"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, GitBranch, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "next-auth/react";

const STATS = [
  { label: "Projects funded", value: "2,840+" },
  { label: "Total raised", value: "$1.2M+" },
  { label: "Contributors", value: "18k+" },
  { label: "Repositories", value: "5,200+" },
];

export function Hero() {
  const { data: session } = useSession();

  return (
    <section className="relative bg-white overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "linear-gradient(#d1d5db 1px, transparent 1px), linear-gradient(to right, #d1d5db 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Fade out grid toward bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/50 to-white" />
      {/* Soft color blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-100 rounded-full blur-[100px] opacity-70 pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-28 pb-24 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gray-200 bg-white text-gray-500 text-xs font-medium mb-8 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
          Live on Stellar Testnet
          <span className="h-3 w-px bg-gray-200" />
          <span className="text-blue-600 font-semibold">Beta</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-bold tracking-tight text-gray-900 mb-6 leading-[1.06]">
          Fund the future of
          <br />
          <span className="relative inline-block">
            open source
            <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 400 12" fill="none" preserveAspectRatio="none">
              <path d="M2 9 Q100 2 200 8 Q300 14 398 6" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4"/>
            </svg>
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed font-normal">
          Connect your GitHub repo, set milestones, and let the community
          fund what matters — transparently on Stellar.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20">
          <Link href="/explore">
            <Button size="lg" variant="default" className="gap-2 h-11 px-6 text-sm group shadow-sm">
              Explore Projects
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
          {session ? (
            <Link href="/dashboard/new">
              <Button size="lg" variant="secondary" className="gap-2 h-11 px-6 text-sm shadow-sm">
                <Zap className="h-4 w-4" />
                Launch a Project
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              variant="secondary"
              onClick={() => signIn("github")}
              className="gap-2 h-11 px-6 text-sm shadow-sm"
            >
              <GitBranch className="h-4 w-4" />
              Connect with GitHub
            </Button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 max-w-2xl mx-auto shadow-sm">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-white px-4 py-5 text-center">
              <div className="text-2xl font-bold text-gray-900 tracking-tight">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
