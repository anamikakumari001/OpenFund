"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import {
  GitBranch,
  Search,
  Star,
  GitFork,
  ChevronRight,
  ChevronLeft,
  Check,
  Rocket,
  Target,
  FileText,
  Loader2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  owner: { login: string; avatar_url: string };
  private: boolean;
}

const STEPS = [
  { id: 1, label: "Connect GitHub", icon: GitBranch },
  { id: 2, label: "Select Repo", icon: Search },
  { id: 3, label: "Configure", icon: Target },
  { id: 4, label: "Launch", icon: Rocket },
];

const CATEGORIES = [
  "DEVELOPER_TOOLS", "INFRASTRUCTURE", "LIBRARIES", "FRAMEWORKS",
  "SECURITY", "DATA", "ML_AI", "BLOCKCHAIN", "MOBILE", "WEB",
  "DESKTOP", "DEVOPS", "DOCUMENTATION", "EDUCATION", "COMMUNITY", "OTHER",
];

export default function NewProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [fundingGoal, setFundingGoal] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [longDescription, setLongDescription] = useState("");
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [launched, setLaunched] = useState(false);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const fetchRepos = useCallback(async () => {
    setReposLoading(true);
    setReposError(null);
    try {
      const res = await fetch("/api/github/repos");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to load repositories");
      }
      const data = await res.json();
      setRepos(data.repos ?? []);
    } catch (err) {
      setReposError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setReposLoading(false);
    }
  }, []);

  const goTo = (next: number) => {
    setStep(next);
    if (next === 2 && repos.length === 0) {
      fetchRepos();
    }
  };

  const handleLaunch = async () => {
    if (!selectedRepo) return;
    setLaunching(true);
    setLaunchError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubOwner: selectedRepo.owner.login,
          githubRepo: selectedRepo.name,
          fundingGoal: fundingGoal || undefined,
          category,
          longDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create project");
      setCreatedSlug(data.project?.slug ?? null);
      setLaunched(true);
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLaunching(false);
    }
  };

  const filteredRepos = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  const isGithubConnected = !!session?.user?.id;
  const displayUsername = session?.user?.githubUsername ?? session?.user?.name ?? "your account";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-900">Launch Your Project</h1>
          <p className="text-gray-500 mt-2 text-sm">Fund your open source work in minutes</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((s, i) => {
            const isDone = step > s.id;
            const isActive = step === s.id;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                      isDone
                        ? "bg-gray-900 border-gray-900"
                        : isActive
                        ? "bg-white border-gray-900"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <s.icon className={`w-4 h-4 ${isActive ? "text-gray-900" : "text-gray-400"}`} />
                    )}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-medium ${
                    isActive ? "text-gray-900" : isDone ? "text-gray-600" : "text-gray-400"
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="flex-1 h-px mx-3 mb-5 transition-colors"
                    style={{ background: step > s.id ? "#111827" : "#e5e7eb" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                <GitBranch className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isGithubConnected ? "GitHub Connected" : "Connect GitHub"}
                </h2>
                <p className="text-gray-500 text-sm mt-2 max-w-sm">
                  {isGithubConnected
                    ? `Connected as @${session?.user?.githubUsername}. Ready to select a repository.`
                    : "Connect your GitHub account to access your repositories."}
                </p>
              </div>

              {isGithubConnected ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 w-full justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-700 text-sm font-medium">
                      @{displayUsername} connected
                    </span>
                  </div>
                  <Button variant="default" className="w-full" onClick={() => goTo(2)}>
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="default"
                  className="w-full gap-2"
                  onClick={() => signIn("github", { callbackUrl: "/dashboard/new" })}
                >
                  <GitBranch className="w-4 h-4" />
                  Authorize with GitHub
                </Button>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-4">Select a Repository</h2>
              <Input
                placeholder="Search repositories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4"
              />

              {reposLoading && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
              )}

              {reposError && (
                <div className="flex items-center gap-2 text-red-600 text-sm py-3 px-3 bg-red-50 rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {reposError}
                </div>
              )}

              {!reposLoading && !reposError && (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                  {filteredRepos.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-8">No repositories found</p>
                  )}
                  {filteredRepos.map((repo) => {
                    const isSelected = selectedRepo?.id === repo.id;
                    return (
                      <button
                        key={repo.id}
                        onClick={() => setSelectedRepo(repo)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? "border-gray-900 bg-gray-50"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-gray-900 truncate">
                                {repo.name}
                              </span>
                              {repo.language && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {repo.language}
                                </Badge>
                              )}
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-gray-900 flex-shrink-0" />
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{repo.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {repo.stargazers_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <GitFork className="w-3 h-3" />
                              {repo.forks_count}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <Button variant="secondary" onClick={() => goTo(1)} className="flex-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  variant="default"
                  onClick={() => goTo(3)}
                  disabled={!selectedRepo}
                  className="flex-1"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">Configure Project</h2>
              {selectedRepo && (
                <p className="text-sm text-gray-500 mb-5">
                  Setting up <span className="text-gray-900 font-medium">{selectedRepo.full_name}</span>
                </p>
              )}

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Funding Goal (USDC) <span className="text-gray-400 font-normal">— optional</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 5000"
                      value={fundingGoal}
                      onChange={(e) => setFundingGoal(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Description <span className="text-gray-400 font-normal">— optional</span>
                    </span>
                  </label>
                  <textarea
                    value={longDescription}
                    onChange={(e) => setLongDescription(e.target.value)}
                    placeholder="Tell potential supporters about your project, its impact, and how funds will be used..."
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="secondary" onClick={() => goTo(2)} className="flex-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button variant="default" onClick={() => goTo(4)} className="flex-1">
                  Preview <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div>
              {launched ? (
                <div className="flex flex-col items-center text-center py-6 gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center">
                    <Rocket className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Project Launched!</h2>
                    <p className="text-gray-500 mt-1 text-sm">Your project is now live on OpenFund</p>
                  </div>
                  <div className="flex gap-3 w-full">
                    {createdSlug && (
                      <Button
                        variant="default"
                        className="flex-1 gap-2"
                        onClick={() => router.push(`/project/${createdSlug}`)}
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Project
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => router.push("/dashboard")}
                    >
                      Dashboard
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Preview & Launch</h2>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 mb-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-200 border border-gray-300 flex items-center justify-center flex-shrink-0">
                        <GitBranch className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {selectedRepo?.full_name ?? "—"}
                        </p>
                        {selectedRepo?.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{selectedRepo.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="p-2.5 rounded-lg bg-white border border-gray-200">
                        <p className="text-xs text-gray-400">Goal</p>
                        <p className="font-medium text-gray-900 mt-0.5">
                          {fundingGoal ? `$${parseFloat(fundingGoal).toFixed(2)}` : "Open"}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-gray-200">
                        <p className="text-xs text-gray-400">Category</p>
                        <p className="font-medium text-gray-900 mt-0.5 text-[11px]">
                          {category.replace(/_/g, " ")}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-gray-200">
                        <p className="text-xs text-gray-400">Language</p>
                        <p className="font-medium text-gray-900 mt-0.5">
                          {selectedRepo?.language ?? "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {launchError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm py-3 px-3 bg-red-50 rounded-xl border border-red-200 mb-4">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {launchError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => goTo(3)} className="flex-1" disabled={launching}>
                      <ChevronLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleLaunch}
                      loading={launching}
                      className="flex-1 gap-2"
                    >
                      <Rocket className="w-4 h-4" />
                      Launch Project
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
