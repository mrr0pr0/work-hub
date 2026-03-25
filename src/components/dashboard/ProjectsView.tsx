'use client';

import { useMemo, useState } from 'react';
import { Avatar } from './Avatar';
import { StatusBadge, projectStatusTone } from './StatusBadge';

type Update = {
	id: number;
	message: string;
	author: string;
	created_at: string;
};

type GithubOverview = {
	defaultBranch: string;
	lastCommit: { message: string; date: string };
	openPrCount: number;
};

type ProjectCardData = {
	id: number;
	name: string;
	status: string;
	github_repo_url: string;
	client_name: string;
	github: GithubOverview | null;
	updates: Update[];
};

function formatDate(iso: string) {
	try {
		return new Intl.DateTimeFormat(undefined, {
			year: 'numeric',
			month: 'short',
			day: '2-digit',
		}).format(new Date(iso));
	} catch {
		return iso;
	}
}

export default function ProjectsView({
	projects,
}: {
	projects: ProjectCardData[];
}) {
	const [updatesByProject, setUpdatesByProject] = useState<
		Record<number, Update[]>
	>(() => {
		const map: Record<number, Update[]> = {};
		for (const p of projects) map[p.id] = p.updates;
		return map;
	});

	const [author, setAuthor] = useState('Team Member');
	const [messageByProject, setMessageByProject] = useState<
		Record<number, string>
	>({});

	const cards = useMemo(() => projects, [projects]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-semibold">Projects</h1>
				<p className="text-sm text-zinc-400 mt-1">
					Live GitHub activity + Neon-backed update feed.
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{cards.map((p) => {
					const updates = updatesByProject[p.id] ?? [];
					const team = Array.from(new Set(updates.map((u) => u.author))).slice(
						0,
						3
					);

					return (
						<div
							key={p.id}
							className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm"
						>
							<div className="flex items-start justify-between gap-4">
								<div>
									<div className="flex items-center gap-3">
										<h2 className="text-lg font-semibold">{p.name}</h2>
										<StatusBadge
											label={p.status}
											tone={projectStatusTone(p.status)}
										/>
									</div>
									<div className="text-xs text-zinc-400 mt-1">
										Client: {p.client_name}
									</div>
								</div>
								<a
									href={p.github_repo_url}
									target="_blank"
									rel="noreferrer"
									className="text-sm text-zinc-300 hover:text-white underline decoration-zinc-700 hover:decoration-zinc-400"
								>
									GitHub
								</a>
							</div>

							<div className="mt-4 flex items-center gap-3 flex-wrap">
								<div className="flex items-center gap-2">
									{team.length ? (
										team.map((name) => (
											<Avatar key={name} name={name} size={26} />
										))
									) : (
										<div className="text-xs text-zinc-500">
											No assignees yet
										</div>
									)}
								</div>
							</div>

							<div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
									<div className="text-xs text-zinc-400">Default branch</div>
									<div className="text-sm font-medium mt-1">
										{p.github?.defaultBranch ?? '—'}
									</div>
								</div>
								<div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
									<div className="text-xs text-zinc-400">Open PRs</div>
									<div className="text-sm font-medium mt-1">
										{p.github?.openPrCount ?? '—'}
									</div>
								</div>
								<div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:col-span-1">
									<div className="text-xs text-zinc-400">Last commit</div>
									<div className="text-sm font-medium mt-1 truncate">
										{p.github?.lastCommit?.message ?? '—'}
									</div>
									<div className="text-xs text-zinc-500 mt-1">
										{p.github?.lastCommit?.date
											? formatDate(p.github.lastCommit.date)
											: ''}
									</div>
								</div>
							</div>

							<div className="mt-4">
								<div className="flex items-center justify-between gap-3">
									<h3 className="text-sm font-semibold text-white">Activity</h3>
								</div>

								<div className="mt-2 space-y-2">
									{updates.slice(0, 4).map((u) => (
										<div
											key={u.id}
											className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
										>
											<div className="text-sm font-medium">{u.message}</div>
											<div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
												<span className="text-zinc-400">{u.author}</span>
												<span>•</span>
												<span>{formatDate(u.created_at)}</span>
											</div>
										</div>
									))}
									{updates.length === 0 ? (
										<div className="text-sm text-zinc-500">No updates yet.</div>
									) : null}
								</div>
							</div>

							<form
								className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
								onSubmit={async (e) => {
									e.preventDefault();
									const msg = (messageByProject[p.id] ?? '').trim();
									if (!msg) return;

									const res = await fetch(`/api/projects/${p.id}/updates`, {
										method: 'POST',
										headers: { 'content-type': 'application/json' },
										body: JSON.stringify({ message: msg, author }),
									});

									if (!res.ok) return;
									const json = (await res.json()) as { update: Update };

									setUpdatesByProject((prev) => ({
										...prev,
										[p.id]: [json.update, ...(prev[p.id] ?? [])],
									}));
									setMessageByProject((prev) => ({ ...prev, [p.id]: '' }));
								}}
							>
								<div className="sm:col-span-1">
									<label className="block text-xs text-zinc-400 mb-1">
										Author
									</label>
									<input
										value={author}
										onChange={(e) => setAuthor(e.target.value)}
										className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
										placeholder="Your name"
									/>
								</div>
								<div className="sm:col-span-1">
									<label className="block text-xs text-zinc-400 mb-1">
										New update
									</label>
									<input
										value={messageByProject[p.id] ?? ''}
										onChange={(e) =>
											setMessageByProject((prev) => ({
												...prev,
												[p.id]: e.target.value,
											}))
										}
										className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
										placeholder="e.g., Ready for review on PR #123"
									/>
								</div>
								<div className="sm:col-span-2 flex justify-end">
									<button
										type="submit"
										className="rounded-xl bg-zinc-100 text-zinc-950 px-4 py-2 text-sm font-medium hover:bg-white transition-colors"
									>
										Add update
									</button>
								</div>
							</form>
						</div>
					);
				})}
			</div>
		</div>
	);
}
