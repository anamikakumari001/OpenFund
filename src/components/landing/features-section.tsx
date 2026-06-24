import {
  GitBranch, Zap, Target, BarChart3, Shield, Users, TrendingUp, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: GitBranch,
    title: "GitHub Native",
    description: "Connect any repo in seconds. Auto-import stars, issues, milestones, contributors, and releases.",
    dark: true,
    accent: false,
  },
  {
    icon: Zap,
    title: "Stellar Payments",
    description: "Instant, low-fee USDC or XLM donations. Every transaction is transparent and on-chain.",
    dark: false,
    accent: true,
  },
  {
    icon: Target,
    title: "Milestone Funding",
    description: "Fund specific features and bug fixes. Supporters get direct impact visibility on progress.",
    dark: false,
    accent: false,
  },
  {
    icon: BarChart3,
    title: "Health Engine",
    description: "Project health scoring based on commits, releases, community activity, and funding.",
    dark: false,
    accent: false,
  },
  {
    icon: Shield,
    title: "Treasury Transparency",
    description: "Every project has a Stellar treasury wallet. All inflows and outflows are public.",
    dark: false,
    accent: false,
  },
  {
    icon: Users,
    title: "Contributor Marketplace",
    description: "Discover good first issues, funded bounties, and contribution opportunities.",
    dark: false,
    accent: false,
  },
  {
    icon: TrendingUp,
    title: "Real-time Analytics",
    description: "Live funding trends, supporter growth, GitHub metrics, and community analytics.",
    dark: false,
    accent: false,
  },
  {
    icon: Globe,
    title: "Open Source Universe",
    description: "Explore the entire ecosystem by category, language, funding stage, and activity.",
    dark: false,
    accent: false,
  },
];

export function FeaturesSection() {
  return (
    <section className="py-28 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">
            Platform
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Everything you need to fund open source
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
            OpenFund combines GitHub, crowdfunding, and Stellar into one
            developer-first experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={cn(
                "p-5 rounded-2xl border transition-all duration-150",
                feature.dark
                  ? "bg-gray-900 border-gray-900"
                  : feature.accent
                  ? "bg-blue-600 border-blue-600"
                  : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
              )}
            >
              <div
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center mb-4",
                  feature.dark
                    ? "bg-white/10"
                    : feature.accent
                    ? "bg-white/15"
                    : "bg-gray-100"
                )}
              >
                <feature.icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    feature.dark || feature.accent ? "text-white" : "text-gray-600"
                  )}
                />
              </div>
              <h3
                className={cn(
                  "text-sm font-semibold mb-1.5",
                  feature.dark || feature.accent ? "text-white" : "text-gray-900"
                )}
              >
                {feature.title}
              </h3>
              <p
                className={cn(
                  "text-sm leading-relaxed",
                  feature.dark ? "text-gray-400" : feature.accent ? "text-blue-100" : "text-gray-500"
                )}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
