// Local type definitions that mirror Prisma generated types
// to avoid issues with client-side imports of @prisma/client

export interface ProjectOwner {
  id: string;
  name: string | null;
  image: string | null;
  githubUsername: string | null;
  bio?: string | null;
  website?: string | null;
}

export interface MilestoneData {
  id: string;
  projectId: string;
  githubId: string | null;
  title: string;
  description: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  fundingGoal: number | null;
  totalRaised: number;
  escrowBalance: number;
  escrowReleased: boolean;
  escrowCancelled: boolean;
  progress: number;
  issueCount: number;
  closedCount: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  project: { ownerId: string; treasuryAddress: string | null };
}

export interface ContributorData {
  id: string;
  projectId: string;
  githubLogin: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  contributions: number;
  role: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReleaseData {
  id: string;
  projectId: string;
  githubId: string | null;
  tagName: string;
  name: string | null;
  body: string | null;
  url: string;
  prerelease: boolean;
  publishedAt: Date | null;
  createdAt: Date;
}

export interface FundedIssueData {
  id: string;
  projectId: string;
  githubId: string | null;
  number: number;
  title: string;
  description: string | null;
  url: string;
  labels: string[];
  state: string;
  fundingGoal: number | null;
  totalRaised: number;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BadgeData {
  id: string;
  userId: string;
  badge: string;
  earnedAt: Date;
}

export interface ProjectWithOwner {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  githubOwner: string;
  githubRepo: string;
  githubUrl: string;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  language: string | null;
  topics: string[];
  website: string | null;
  fundingGoal: number | null;
  totalRaised: number;
  monthlyRaised: number;
  supporterCount: number;
  healthScore: number;
  category: string;
  status: string;
  featured: boolean;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner: ProjectOwner;
  _count?: {
    donations: number;
    watchers: number;
    votes: number;
  };
}

export interface ProjectWithDetails extends ProjectWithOwner {
  milestones: MilestoneData[];
  contributors: ContributorData[];
  releases: ReleaseData[];
  issues: FundedIssueData[];
  readme: string | null;
  treasuryAddress: string | null;
  license: string | null;
  _count: {
    donations: number;
    watchers: number;
    votes: number;
    comments: number;
  };
}

export interface DonationWithDetails {
  id: string;
  projectId: string;
  userId: string;
  amount: number;
  currency: string;
  stellarTxHash: string | null;
  status: string;
  message: string | null;
  anonymous: boolean;
  createdAt: Date;
  user: Pick<ProjectOwner, "id" | "name" | "image" | "githubUsername">;
  project: Pick<ProjectWithOwner, "id" | "name" | "slug" | "logoUrl">;
}

export interface UserWithStats {
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
  createdAt: Date;
  badges: BadgeData[];
  _count: {
    projects: number;
    donations: number;
    watchedProjects: number;
  };
}

export interface ProjectCardData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  stars: number;
  forks: number;
  language: string | null;
  totalRaised: number;
  fundingGoal: number | null;
  supporterCount: number;
  healthScore: number;
  category: string;
  topics: string[];
  owner: {
    name: string | null;
    image: string | null;
    githubUsername: string | null;
  };
}

export interface SearchResult {
  type: "project" | "user";
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  url: string;
  meta?: Record<string, string | number>;
}

export interface DonationPayload {
  projectId: string;
  amount: string;
  currency: "USDC" | "XLM";
  milestoneId?: string;
  issueId?: string;
  message?: string;
  anonymous?: boolean;
  stellarTxHash: string;
  stellarTxMemo?: string;
}
