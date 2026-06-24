"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProjectWithOwner } from "@/types";

interface ProjectsParams {
  page?: number;
  limit?: number;
  category?: string;
  sort?: string;
  q?: string;
}

interface ProjectsResponse {
  projects: ProjectWithOwner[];
  total: number;
  page: number;
  totalPages: number;
}

export function useProjects(params: ProjectsParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.category && params.category !== "all") searchParams.set("category", params.category);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.q) searchParams.set("q", params.q);

  return useQuery<ProjectsResponse>({
    queryKey: ["projects", params],
    queryFn: async () => {
      const res = await fetch(`/api/projects?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
    staleTime: 30000,
  });
}

export function useProject(slug: string) {
  return useQuery({
    queryKey: ["project", slug],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${slug}`);
      if (!res.ok) throw new Error("Project not found");
      return res.json();
    },
    staleTime: 10000,
  });
}

export function useDonations(projectId?: string) {
  const params = new URLSearchParams();
  if (projectId) params.set("projectId", projectId);
  params.set("limit", "10");

  return useQuery({
    queryKey: ["donations", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/donations?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch donations");
      return res.json();
    },
    staleTime: 10000,
    refetchInterval: 30000,
  });
}
