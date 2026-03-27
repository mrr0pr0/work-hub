import { ensureSchemaAndSeed } from "@/src/server/db/ensureSchemaAndSeed";
import { getSql } from "@/src/server/db/neon";
import { isDatabaseConfigured } from "@/src/server/db/neon";
import { fetchDeepSourceIssuesByRepo } from "@/src/server/integrations/deepsource";
import { getRepoOverview } from "@/src/server/integrations/github";
import {
  bugLocalStatusTone,
  bugSeverityTone,
  StatusBadge,
} from "@/src/components/dashboard/StatusBadge";

export const dynamic = "force-dynamic";

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

function formatSeverity(sev: string) {
  return sev;
}

export default async function BugsPage() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h1 className="text-xl font-semibold">Bugs</h1>
        <p className="text-sm text-zinc-400 mt-2">Set `DATABASE_URL` to load data.</p>
      </div>
    );
  }
  await ensureSchemaAndSeed();
  const sql = getSql();

  const projects = (await sql`
    select id, github_repo_url from projects;
  `) as Array<{ id: number; github_repo_url: string }>;

  if (process.env.DEEPSOURCE_TOKEN) {
    for (const project of projects) {
      const parsed = parseGithubRepoUrl(project.github_repo_url);
      if (!parsed) continue;

      try {
        const issues = await fetchDeepSourceIssuesByRepo(parsed.owner, parsed.repo);
        for (const issue of issues) {
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
        // Best-effort only.
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
    try {
      const overview = await getRepoOverview(owner, repo);
      defaultBranchCache.set(key, overview.defaultBranch);
      return overview.defaultBranch;
    } catch {
      defaultBranchCache.set(key, "main");
      return "main";
    }
  }

  const bugsWithGithubLinks = await Promise.all(
    bugs.map(async (b) => {
      const parsed = parseGithubRepoUrl(b.github_repo_url);
      if (!parsed) {
        return { ...b, githubFileUrl: null as string | null };
      }

      const defaultBranch = await getDefaultBranch(parsed.owner, parsed.repo);
      const githubFileUrl = `https://github.com/${parsed.owner}/${parsed.repo}/blob/${encodeURIComponent(
        defaultBranch
      )}/${b.file_path}`;

      return { ...b, githubFileUrl };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Bugs</h1>
        <p className="text-sm text-zinc-400 mt-1">
          DeepSource issues with local status overrides.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {bugsWithGithubLinks.map((b) => {
          const categoryTone = b.category === "security" ? "red" : b.category === "bug-risk" ? "yellow" : "gray";
          return (
            <div key={b.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={b.githubFileUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      aria-disabled={!b.githubFileUrl}
                      className="text-base font-semibold hover:underline"
                    >
                      {b.title}
                    </a>
                    <StatusBadge
                      label={formatSeverity(b.severity)}
                      tone={bugSeverityTone(b.severity)}
                    />
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">{b.project_name}</div>
                </div>
                <StatusBadge label={b.status} tone={bugLocalStatusTone(b.status)} />
              </div>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <StatusBadge label={b.category} tone={categoryTone} />
                <span className="text-xs text-zinc-400">•</span>
                <div className="text-xs text-zinc-300">{b.file_path}</div>
              </div>

              {/* Use the resolved default branch when possible (best-effort; main fallback above). */}
              <div className="mt-3 text-xs text-zinc-500">
                {b.githubFileUrl ? (
                  <span>Linked to the GitHub file for this issue.</span>
                ) : (
                  <span>GitHub file link unavailable (invalid repo URL).</span>
                )}
              </div>
            </div>
          );
        })}
        {bugs.length === 0 ? <div className="text-sm text-zinc-500">No bugs found.</div> : null}
      </div>
    </div>
  );
}

