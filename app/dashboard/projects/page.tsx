import { ensureSchemaAndSeed } from '@/src/server/db/ensureSchemaAndSeed';
import { getSql, isDatabaseConfigured } from '@/src/server/db/neon';
import { getRepoOverview } from '@/src/server/integrations/github';
import ProjectsView from '@/src/components/dashboard/ProjectsView';

export const dynamic = 'force-dynamic';

function parseGithubRepoUrl(
	repoUrl: string
): { owner: string; repo: string } | null {
	try {
		const url = repoUrl.includes('github.com')
			? new URL(repoUrl)
			: new URL(`https://github.com/${repoUrl.replace(/^\/+/, '')}`);
		const parts = url.pathname.split('/').filter(Boolean);
		if (parts.length < 2) return null;
		return { owner: parts[0], repo: parts[1] };
	} catch {
		return null;
	}
}

export default async function ProjectsPage() {
	if (!isDatabaseConfigured()) {
		return (
			<div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
				<h1 className="text-xl font-semibold">Projects</h1>
				<p className="text-sm text-zinc-400 mt-2">
					Set `DATABASE_URL` to load data.
				</p>
			</div>
		);
	}
	await ensureSchemaAndSeed();
	const sql = getSql();

	const projects = (await sql`
    select
      p.id,
      p.name,
      p.status,
      p.github_repo_url,
      c.name as client_name
    from projects p
    join clients c on c.id = p.client_id
    order by p.created_at desc;
  `) as Array<{
		id: number;
		name: string;
		status: string;
		github_repo_url: string;
		client_name: string;
	}>;

	const projectCards = await Promise.all(
		projects.map(async (p) => {
			const updates = (await sql`
        select id, message, author, created_at
        from updates
        where project_id = ${p.id}
        order by created_at desc
        limit 6;
      `) as Array<{
				id: number;
				message: string;
				author: string;
				created_at: string;
			}>;

			const parsed = parseGithubRepoUrl(p.github_repo_url);
			let github = null as {
				defaultBranch: string;
				lastCommit: { message: string; date: string };
				openPrCount: number;
			} | null;
			if (parsed) {
				try {
					github = await getRepoOverview(parsed.owner, parsed.repo);
				} catch {
					github = null;
				}
			}

			return {
				id: p.id,
				name: p.name,
				status: p.status,
				github_repo_url: p.github_repo_url,
				client_name: p.client_name,
				github,
				updates,
			};
		})
	);

	return <ProjectsView projects={projectCards} />;
}
