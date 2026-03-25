import { NextResponse } from "next/server";
import { ensureSchemaAndSeed } from "@/src/server/db/ensureSchemaAndSeed";
import { getSql, isDatabaseConfigured } from "@/src/server/db/neon";
import { fetchDeepSourceIssuesByRepo } from "@/src/server/integrations/deepsource";

function parseGithubRepoUrl(repoUrl: string): { owner: string; repo: string } | null {
  try {
    const url = repoUrl.includes("github.com")
      ? new URL(repoUrl)
      : new URL(`https://github.com/${repoUrl.replace(/^\/+/, "")}`);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ bugs: [], error: "DATABASE_URL is not configured" }, { status: 503 });
  }
  await ensureSchemaAndSeed();
  const sql = getSql();

  const projects = (await sql`
    select id, github_repo_url from projects;
  `) as Array<{
    id: number;
    github_repo_url: string;
  }>;

    // Best-effort: if DeepSource token is missing or GraphQL fails, we still return local bugs.
  if (process.env.DEEPSOURCE_TOKEN) {
    for (const project of projects) {
        const parsed = parseGithubRepoUrl(project.github_repo_url);
        if (!parsed) continue;

        try {
            const issues = await fetchDeepSourceIssuesByRepo(parsed.owner, parsed.repo);
            for (const issue of issues) {
                // keep local satus as the confromft of overwrtie
                
            }
        }
    }
  }
}