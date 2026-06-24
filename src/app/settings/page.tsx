"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Settings,
  User,
  Bell,
  Shield,
  Wallet,
  Link2,
  Loader2,
  Check,
  AlertTriangle,
  Copy,
  ExternalLink,
  ArrowDownToLine,
} from "lucide-react";
import { FundWalletModal } from "@/components/wallet/fund-wallet-modal";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  githubUsername: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  twitterUsername: string | null;
  stellarPublicKey: string | null;
  role: string;
}

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "security", label: "Security", icon: Shield },
  { id: "integrations", label: "Integrations", icon: Link2 },
];

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function FieldInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-sm",
        className
      )}
      {...props}
    />
  );
}

function FieldTextarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-sm resize-none",
        className
      )}
      {...props}
    />
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? "bg-gray-900" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4.5 translate-x-[1.125rem]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

function ProfileTab({ profile }: { profile: UserProfile }) {
  const [form, setForm] = useState({
    name: profile.name ?? "",
    bio: profile.bio ?? "",
    website: profile.website ?? "",
    location: profile.location ?? "",
    twitterUsername: profile.twitterUsername ?? "",
  });
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const r = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("Update failed");
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  return (
    <div className="space-y-8">
      <Section title="Public Profile" description="This information will be shown publicly on your profile page.">
        <div className="flex items-center gap-4">
          {profile.image ? (
            <Image src={profile.image} alt="Avatar" width={56} height={56} className="rounded-xl border border-gray-200" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">{profile.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">@{profile.githubUsername}</p>
            <p className="text-xs text-gray-400 mt-1">Avatar synced from GitHub</p>
          </div>
        </div>

        <Field label="Display Name">
          <FieldInput
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Your name"
          />
        </Field>

        <Field label="Bio" hint="Brief description of yourself. Max 160 characters.">
          <FieldTextarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="Tell the community about yourself..."
            rows={3}
            maxLength={160}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Website">
            <FieldInput
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="https://yoursite.com"
              type="url"
            />
          </Field>
          <Field label="Location">
            <FieldInput
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="San Francisco, CA"
            />
          </Field>
        </div>

        <Field label="Twitter / X" hint="Username without @">
          <FieldInput
            value={form.twitterUsername}
            onChange={(e) => setForm((f) => ({ ...f, twitterUsername: e.target.value }))}
            placeholder="username"
          />
        </Field>

        <button
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : null}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </Section>
    </div>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    donations: true,
    milestones: true,
    comments: true,
    releases: true,
    follows: false,
    newsletter: false,
    emailDigest: true,
  });

  const NOTIFICATION_OPTIONS = [
    { key: "donations", label: "New Donations", desc: "When someone donates to your project" },
    { key: "milestones", label: "Milestone Updates", desc: "Milestone completions and progress" },
    { key: "comments", label: "Comments", desc: "New comments on your projects" },
    { key: "releases", label: "Releases", desc: "New releases from projects you follow" },
    { key: "follows", label: "New Followers", desc: "When someone follows you" },
    { key: "emailDigest", label: "Weekly Email Digest", desc: "Summary of activity sent weekly" },
    { key: "newsletter", label: "OpenFund Newsletter", desc: "Platform updates and announcements" },
  ] as const;

  return (
    <Section title="Notification Preferences" description="Control what you get notified about.">
      <div className="space-y-0.5">
        {NOTIFICATION_OPTIONS.map((opt) => (
          <div
            key={opt.key}
            className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{opt.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
            </div>
            <Toggle
              checked={prefs[opt.key]}
              onChange={(v) => setPrefs((p) => ({ ...p, [opt.key]: v }))}
            />
          </div>
        ))}
      </div>
    </Section>
  );
}

interface WalletBalance {
  xlm: string;
  usdc: string;
}

function WalletTab({ profile }: { profile: UserProfile }) {
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const address = profile.stellarPublicKey;
  const isTestnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK !== "mainnet";

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    const load = async () => {
      setBalanceLoading(true);
      try {
        const r = await fetch(`/api/stellar/treasury?address=${address}`);
        const d = await r.json() as { balance?: WalletBalance };
        if (!cancelled && d.balance) setBalance(d.balance);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [address]);

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!address) {
    return (
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          No wallet found. Sign out and sign back in to auto-create your Stellar wallet.
        </p>
      </div>
    );
  }

  const explorerUrl = isTestnet
    ? `https://stellar.expert/explorer/testnet/account/${address}`
    : `https://stellar.expert/explorer/public/account/${address}`;

  return (
    <div className="space-y-8">
      <Section title="Your Stellar Wallet" description="Auto-created when you signed up. Send XLM or USDC here to fund your account.">
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-gray-700">
                Stellar {isTestnet ? "Testnet" : "Mainnet"} Wallet
              </span>
            </div>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Explorer
            </a>
          </div>

          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <div className="px-4 py-4">
              <p className="text-xs text-gray-400 mb-1">XLM Balance</p>
              {balanceLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <p className="text-xl font-bold text-gray-900 font-mono">
                  {balance ? parseFloat(balance.xlm).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                  <span className="text-sm text-gray-400 ml-1 font-sans">XLM</span>
                </p>
              )}
            </div>
            <div className="px-4 py-4">
              <p className="text-xs text-gray-400 mb-1">USDC Balance</p>
              {balanceLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <p className="text-xl font-bold text-gray-900 font-mono">
                  {balance ? parseFloat(balance.usdc).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                  <span className="text-sm text-gray-400 ml-1 font-sans">USDC</span>
                </p>
              )}
            </div>
          </div>

          <div className="px-4 pb-4 space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-2">Wallet Address</p>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
                <code className="flex-1 text-xs text-gray-600 font-mono break-all leading-relaxed">
                  {address}
                </code>
                <button
                  onClick={() => copy(address)}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowFundModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-colors font-medium text-sm"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Add Funds to Wallet
            </button>
          </div>
        </div>
      </Section>

      <FundWalletModal
        open={showFundModal}
        onClose={() => setShowFundModal(false)}
        address={address}
        isTestnet={isTestnet}
      />

      <Section title="How to Fund Your Wallet" description="Send funds to your wallet address above to start donating.">
        <div className="space-y-2.5">
          {[
            { step: "1", title: "Copy your wallet address above", desc: "Use the copy button to copy your full Stellar public key." },
            {
              step: "2",
              title: isTestnet ? "Get testnet XLM from Friendbot" : "Send XLM or USDC from any exchange",
              desc: isTestnet
                ? "Visit laboratory.stellar.org and paste your address to get free testnet XLM."
                : "Transfer XLM or USDC from your exchange or another Stellar wallet.",
            },
            { step: "3", title: "Donate to any project", desc: "Once funded, click 'Support This Project' on any project page." },
          ].map((item) => (
            <div key={item.step} className="flex gap-3.5 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-gray-600">{item.step}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {isTestnet && (
          <a
            href="https://laboratory.stellar.org/#account-creator?network=test"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Open Stellar Friendbot
          </a>
        )}
      </Section>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-8">
      <Section title="Authentication" description="Manage how you sign in to OpenFund.">
        <div className="p-4 rounded-xl border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">GitHub OAuth</p>
              <p className="text-xs text-gray-400">Primary sign-in method</p>
            </div>
          </div>
          <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full">Active</span>
        </div>
      </Section>

      <Section title="Danger Zone">
        <div className="p-4 rounded-xl border border-red-200 bg-red-50">
          <p className="text-sm font-medium text-red-700 mb-1">Delete Account</p>
          <p className="text-xs text-gray-500 mb-3">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <button className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-100 text-sm transition-all">
            Request Account Deletion
          </button>
        </div>
      </Section>
    </div>
  );
}

function IntegrationsTab({ profile }: { profile: UserProfile }) {
  return (
    <Section title="Connected Services" description="Manage third-party integrations.">
      <div className="space-y-2">
        <div className="p-4 rounded-xl border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">GitHub</p>
              <p className="text-xs text-gray-400">@{profile.githubUsername}</p>
            </div>
          </div>
          <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full">Connected</span>
        </div>
      </div>
    </Section>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["me"],
    queryFn: async () => {
      const r = await fetch("/api/users/me");
      if (!r.ok) throw new Error("Not authenticated");
      const data = await r.json() as { user?: UserProfile } | UserProfile;
      return ("user" in data && data.user ? data.user : data) as UserProfile;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Please sign in to access settings</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar nav */}
          <nav className="w-44 flex-shrink-0">
            <div className="space-y-0.5 sticky top-24">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                      activeTab === tab.id
                        ? "bg-white border border-gray-200 text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-900 hover:bg-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
              {activeTab === "profile" && <ProfileTab profile={profile} />}
              {activeTab === "notifications" && <NotificationsTab />}
              {activeTab === "wallet" && <WalletTab profile={profile} />}
              {activeTab === "security" && <SecurityTab />}
              {activeTab === "integrations" && <IntegrationsTab profile={profile} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
