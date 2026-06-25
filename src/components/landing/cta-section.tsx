"use client";

import Link from "next/link";
import { ArrowRight, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "next-auth/react";

export function CTASection() {
  const { data: session } = useSession();

  return (
    <section className="py-28 bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Card */}
        <div className="relative rounded-3xl bg-gray-900 px-8 py-16 text-center overflow-hidden">
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(white 1px, transparent 1px), linear-gradient(to right, white 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600 rounded-full blur-[100px] opacity-20 pointer-events-none" />

          <div className="relative">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-4">
              Get started free
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Ready to fund open source?
            </h2>
            <p className="text-gray-400 mb-10 max-w-lg mx-auto leading-relaxed">
              Join thousands of developers and organizations building the open source
              ecosystem of tomorrow. No credit card required.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/explore">
                <Button
                  size="lg"
                  className="gap-2 h-11 px-6 bg-white text-gray-900 hover:bg-gray-100 shadow-none group"
                >
                  Explore Projects
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              {session ? (
                <Link href="/dashboard/new">
                  <Button
                    size="lg"
                    className="gap-2 h-11 px-6 bg-white/10 text-white border border-white/20 hover:bg-white/20 shadow-none"
                  >
                    Launch Your Project
                  </Button>
                </Link>
              ) : (
                <Button
                  size="lg"
                  onClick={() => signIn("github")}
                  className="gap-2 h-11 px-6 bg-white/10 text-white border border-white/20 hover:bg-white/20 shadow-none"
                >
                  <GitBranch className="h-4 w-4" />
                  Sign in with GitHub
                </Button>
              )}
            </div>

            <p className="mt-6 text-xs text-gray-500">
              Free to use · Connect GitHub in 30 seconds · No credit card required
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
