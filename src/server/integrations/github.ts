type GithubRepoOverview = {
	defaultBranch: string;
	lastCommit: { message: string; date: string };
	openPrCount: number;
};

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

async function githubFetch<T>(path: string): Promise<T> {
	const token = process.env.GITHUB_TOKEN;
	const headers: Record<string, string> = {
		Accept: 'application/vnd.github+json',
	};
	if (token) {
		headers.Authorization = `token ${token}`;
	}

	const res = await fetch(`https://api.github.com${path}`, {
		headers,
		// Avoid caching; this is intended to be "live data".
		cache: 'no-store',
	});

	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`GitHub API error ${res.status}: ${text}`);
	}

	return (await res.json()) as T;
}

export async function getRepoOverview(
	owner: string,
	repo: string
): Promise<GithubRepoOverview> {
	const repoData = await githubFetch<{ default_branch: string }>(
		`/repos/${owner}/${repo}`
	);
	const defaultBranch = repoData.default_branch;

	const commits = await githubFetch<
		Array<{
			commit: {
				message: string;
				author?: { date: string };
				committer?: { date: string };
			};
		}>
	>(
		`/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(
			defaultBranch
		)}&per_page=1`
	);

	const lastCommit = commits[0];
	const date =
		lastCommit?.commit?.author?.date ??
		lastCommit?.commit?.committer?.date ??
		new Date().toISOString();

	const { total_count } = await githubFetch<{ total_count: number }>(
		`/search/issues?q=${encodeURIComponent(`repo:${owner}/${repo}+type:pr+state:open`)}`
	);

	return {
		defaultBranch,
		lastCommit: {
			message: lastCommit?.commit?.message ?? '',
			date,
		},
		openPrCount: total_count ?? 0,
	};
}

export function parseGithubRepoUrlPublic(repoUrl: string) {
	// Exported under a different name to avoid accidental re-export.
	return parseGithubRepoUrl(repoUrl);
}
