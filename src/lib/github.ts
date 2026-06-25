const GITHUB_API = "https://api.github.com";

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  language: string | null;
  license: { spdx_id: string } | null;
  topics: string[];
  homepage: string | null;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: {
    login: string;
    avatar_url: string;
    type: string;
  };
}

export interface GithubContributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export interface GithubMilestone {
  id: number;
  number: number;
  title: string;
  description: string | null;
  state: string;
  due_on: string | null;
  closed_at: string | null;
  open_issues: number;
  closed_issues: number;
}

export interface GithubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  labels: { name: string; color: string }[];
  closed_at: string | null;
  created_at: string;
}

export interface GithubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  html_url: string;
  prerelease: boolean;
  published_at: string | null;
}

async function githubFetch<T>(
  url: string,
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }
  // 204 No Content or empty body (e.g. empty repo contributors)
  const text = await res.text();
  if (!text.trim()) return [] as unknown as T;
  return JSON.parse(text) as T;
}

export async function getRepo(owner: string, repo: string, token?: string | null): Promise<GithubRepo> {
  return githubFetch(`${GITHUB_API}/repos/${owner}/${repo}`, token);
}

export async function getRepoLanguages(owner: string, repo: string, token?: string | null): Promise<Record<string, number>> {
  return githubFetch(`${GITHUB_API}/repos/${owner}/${repo}/languages`, token);
}

export async function getContributors(owner: string, repo: string, token?: string | null): Promise<GithubContributor[]> {
  return githubFetch(`${GITHUB_API}/repos/${owner}/${repo}/contributors?per_page=30`, token);
}

export async function getMilestones(owner: string, repo: string, token?: string | null): Promise<GithubMilestone[]> {
  return githubFetch(`${GITHUB_API}/repos/${owner}/${repo}/milestones?state=all&per_page=20`, token);
}

export async function getIssues(
  owner: string,
  repo: string,
  labels: string,
  token?: string | null
): Promise<GithubIssue[]> {
  return githubFetch(
    `${GITHUB_API}/repos/${owner}/${repo}/issues?labels=${labels}&state=open&per_page=30`,
    token
  );
}

export async function getReleases(owner: string, repo: string, token?: string | null): Promise<GithubRelease[]> {
  return githubFetch(`${GITHUB_API}/repos/${owner}/${repo}/releases?per_page=10`, token);
}

export async function getReadme(owner: string, repo: string, token?: string | null): Promise<string> {
  try {
    const data = await githubFetch<{ content: string }>(
      `${GITHUB_API}/repos/${owner}/${repo}/readme`,
      token
    );
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

export async function getUserRepos(token: string): Promise<GithubRepo[]> {
  return githubFetch(
    `${GITHUB_API}/user/repos?sort=updated&per_page=50&type=owner`,
    token
  );
}

export function calculateHealthScore(repo: GithubRepo): number {
  let score = 0;
  if (repo.pushed_at) {
    const daysSincePush = (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePush < 7) score += 30;
    else if (daysSincePush < 30) score += 20;
    else if (daysSincePush < 90) score += 10;
  }
  if (repo.stargazers_count > 1000) score += 20;
  else if (repo.stargazers_count > 100) score += 15;
  else if (repo.stargazers_count > 10) score += 10;
  if (repo.forks_count > 100) score += 15;
  else if (repo.forks_count > 10) score += 10;
  if (repo.description) score += 10;
  if (repo.homepage) score += 5;
  if (repo.license) score += 5;
  if (repo.topics && repo.topics.length > 0) score += 5;
  if (repo.open_issues_count > 0 && repo.open_issues_count < 50) score += 10;
  return Math.min(score, 100);
}
