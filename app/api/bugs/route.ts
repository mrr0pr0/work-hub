import { NextResponse } from "next/server";
import { ensureSchemaAndSeed } from "@/src/server/db/ensureSchemaAndSeed";
import { getSql, isDatabaseConfigured } from "@/src/server/db/neon";
import { fetchDeepSourceIssuesByRepo } from "@/src/server/integrations/deepsource";
import { getRepoOverview } from "@/src/server/integrations/github";

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
          // Keep local status as the conflict resolution override.
          await sql`
            insert into bugs (project_id, deepsource_issue_id, title, severity, file_path, category, status)
            values (${project.id}, ${issue.deepsourceIssueId}, ${issue.title}, ${issue.severity}, ${issue.file_path}, ${issue.category}, 'Open')
            on conflict (deepsource_issue_id) do update set
              title = excluded.title,
              severity = excluded.severity,
              file_path = excluded.file_path,
              category = excluded.category;
          `;
        }
      } catch {
        // Swallow DeepSource errors to keep the dashboard responsive.
      }
    }
  }

  const bugs = (await sql`
    select
      b.id,
      b.project_id,
      b.title,
      b.severity,
      b.file_path,
      b.category,
      b.status,
      b.deepsource_issue_id,
      p.name as project_name,
      p.github_repo_url
    from bugs b
    join projects p on p.id = b.project_id
    order by b.id desc;
  `) as Array<{
    id: number;
    project_id: number;
    title: string;
    severity: string;
    file_path: string;
    category: string;
    status: string;
    deepsource_issue_id: string;
    project_name: string;
    github_repo_url: string;
  }>;

  const defaultBranchCache = new Map<string, string>();

  async function getDefaultBranch(owner: string, repo: string) {
    const key = `${owner}/${repo}`;
    if (defaultBranchCache.has(key)) return defaultBranchCache.get(key)!;
    const overview = await getRepoOverview(owner, repo);
    defaultBranchCache.set(key, overview.defaultBranch);
    return overview.defaultBranch;
  }

  const bugsWithGithubLinks = await Promise.all(
    bugs.map(async (b) => {
      const parsed = parseGithubRepoUrl(b.github_repo_url);
      let githubFileUrl: string | null = null;
      if (parsed) {
        try {
          const defaultBranch = await getDefaultBranch(parsed.owner, parsed.repo);
          githubFileUrl = `https://github.com/${parsed.owner}/${parsed.repo}/blob/${encodeURIComponent(
            defaultBranch
          )}/${b.file_path}`;
        } catch {
          githubFileUrl = null;
        }
      }
      return {
        id: b.id,
        projectId: b.project_id,
        title: b.title,
        severity: b.severity,
        filePath: b.file_path,
        category: b.category,
        status: b.status,
        deepsourceIssueId: b.deepsource_issue_id,
        projectName: b.project_name,
        githubFileUrl,
      };
    })
  );

  return NextResponse.json({ bugs: bugsWithGithubLinks });
}

