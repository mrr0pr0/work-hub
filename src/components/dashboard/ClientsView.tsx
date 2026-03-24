'use client';

import { useMemo, useState } from 'react';
import { Avatar } from './Avatar';
import { clientStatusTone, StatusBadge } from './StatusBadge';

type ActiveProject = {
	id: number;
	name: string;
	status: string;
	github_repo_url: string;
};
type Client = {
	id: number;
	name: string;
	company: string;
	photo_url: string | null;
	email: string | null;
	status: string;
	notes: string;
	activeProjects: ActiveProject[];
};

function formatEmail(email: string | null) {
	if (!email) return '—';
	return email;
}

export default function ClientsView({ clients }: { clients: Client[] }) {
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const selected = useMemo(
		() => clients.find((c) => c.id === selectedId) ?? null,
		[clients, selectedId]
	);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-semibold">Clients</h1>
				<p className="text-sm text-zinc-400 mt-1">
					Click a client to view full details.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				{clients.map((c) => (
					<button
						key={c.id}
						onClick={() => setSelectedId(c.id)}
						className="text-left rounded-2xl border border-zinc-800 bg-zinc-900 p-4 hover:bg-zinc-800 transition-colors"
					>
						<div className="flex items-start justify-between gap-3">
							<div className="flex items-center gap-3">
								{c.photo_url ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={c.photo_url}
										alt={c.name}
										className="w-11 h-11 rounded-full border border-zinc-800 object-cover"
									/>
								) : (
									<Avatar name={c.name} size={44} />
								)}
								<div>
									<div className="text-sm font-semibold">{c.name}</div>
									<div className="text-xs text-zinc-400">{c.company}</div>
								</div>
							</div>
							<StatusBadge label={c.status} tone={clientStatusTone(c.status)} />
						</div>

						<div className="mt-3 text-xs text-zinc-400">
							Email: {formatEmail(c.email)}
						</div>

						<div className="mt-3">
							<div className="text-xs text-zinc-400 mb-2">Active projects</div>
							{c.activeProjects.length ? (
								<div className="flex flex-col gap-2">
									{c.activeProjects.slice(0, 3).map((p) => (
										<div
											key={p.id}
											className="flex items-center justify-between gap-2"
										>
											<div className="text-sm font-medium truncate">
												{p.name}
											</div>
											<StatusBadge
												label={p.status}
												tone={
													p.status === 'Done'
														? 'green'
														: p.status === 'Archived'
															? 'gray'
															: p.status === 'In Progress' ||
																  p.status === 'Review'
																? 'yellow'
																: 'gray'
												}
											/>
										</div>
									))}
								</div>
							) : (
								<div className="text-sm text-zinc-500">No active projects.</div>
							)}
						</div>
					</button>
				))}
			</div>

			{/* Drawer */}
			<div
				className={`fixed inset-0 z-50 ${selected ? 'pointer-events-auto' : 'pointer-events-none'}`}
				aria-hidden={!selected}
			>
				<div
					className={`absolute inset-0 bg-black/50 transition-opacity ${
						selected ? 'opacity-100' : 'opacity-0'
					}`}
					onClick={() => setSelectedId(null)}
				/>

				<div
					className={`absolute right-0 top-0 h-full w-full sm:w-[420px] bg-zinc-950 border-l border-zinc-800 transition-transform duration-200 ${
						selected ? 'translate-x-0' : 'translate-x-full'
					}`}
				>
					{selected ? (
						<div className="h-full flex flex-col p-5">
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-center gap-3">
									{selected.photo_url ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={selected.photo_url}
											alt={selected.name}
											className="w-12 h-12 rounded-full border border-zinc-800 object-cover"
										/>
									) : (
										<Avatar name={selected.name} size={48} />
									)}
									<div>
										<div className="text-base font-semibold">
											{selected.name}
										</div>
										<div className="text-xs text-zinc-400">
											{selected.company}
										</div>
									</div>
								</div>
								<div className="flex flex-col items-end gap-2">
									<StatusBadge
										label={selected.status}
										tone={clientStatusTone(selected.status)}
									/>
									<button
										className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1 text-sm text-zinc-200 hover:bg-zinc-800"
										onClick={() => setSelectedId(null)}
										type="button"
									>
										Close
									</button>
								</div>
							</div>

							<div className="mt-5 space-y-4 overflow-auto">
								<div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
									<div className="text-xs text-zinc-400">Email</div>
									<div className="text-sm font-medium mt-1">
										{formatEmail(selected.email)}
									</div>
								</div>

								<div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
									<div className="text-sm font-semibold">Notes</div>
									<div className="text-sm text-zinc-300 mt-2 whitespace-pre-wrap">
										{selected.notes}
									</div>
								</div>

								<div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
									<div className="text-sm font-semibold">Active projects</div>
									<div className="mt-3 space-y-2">
										{selected.activeProjects.length ? (
											selected.activeProjects.map((p) => (
												<div
													key={p.id}
													className="flex items-center justify-between gap-3"
												>
													<a
														href={p.github_repo_url}
														target="_blank"
														rel="noreferrer"
														className="text-sm font-medium hover:underline"
													>
														{p.name}
													</a>
													<StatusBadge
														label={p.status}
														tone={
															p.status === 'Done'
																? 'green'
																: p.status === 'Archived'
																	? 'gray'
																	: 'yellow'
														}
													/>
												</div>
											))
										) : (
											<div className="text-sm text-zinc-500">
												No active projects.
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
