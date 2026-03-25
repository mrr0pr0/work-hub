import { getSql } from './neon';

let ensured: Promise<void> | null = null;

const seedPhotoUrls = [
	'https://placehold.co/150x150?text=Ava',
	'https://placehold.co/150x150?text=Noah',
	'https://placehold.co/150x150?text=Sophia',
];

function parseGithubRepo(
	repoUrl: string
): { owner: string; repo: string } | null {
	// Accept both https://github.com/owner/repo and just owner/repo
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

function isoDateDaysAgo(daysAgo: number) {
	const d = new Date();
	d.setDate(d.getDate() - daysAgo);
	return d.toISOString();
}

export async function ensureSchemaAndSeed() {
	if (ensured) return ensured;

	ensured = (async () => {
		const sql = getSql();

		await sql`
      create table if not exists clients (
        id bigserial primary key,
        name text not null,
        company text not null,
        photo_url text,
        email text,
        status text not null default 'Active',
        notes text not null default ''
      );
    `;

		await sql`
      create table if not exists projects (
        id bigserial primary key,
        name text not null,
        status text not null,
        github_repo_url text not null,
        client_id bigint not null references clients(id) on delete cascade,
        created_at timestamptz not null default now()
      );
    `;

		await sql`
      create table if not exists payments (
        id bigserial primary key,
        client_id bigint not null references clients(id) on delete cascade,
        project_id bigint not null references projects(id) on delete cascade,
        hourly_rate numeric not null,
        hours_logged numeric not null,
        payment_status text not null,
        created_at timestamptz not null default now()
      );
    `;

		await sql`
      create table if not exists bugs (
        id bigserial primary key,
        project_id bigint not null references projects(id) on delete cascade,
        deepsource_issue_id text not null unique,
        title text not null,
        severity text not null,
        file_path text not null,
        category text not null,
        status text not null default 'Open'
      );
    `;

		await sql`
      create table if not exists updates (
        id bigserial primary key,
        project_id bigint not null references projects(id) on delete cascade,
        message text not null,
        author text not null,
        created_at timestamptz not null default now()
      );
    `;

		const [{ count }] = (await sql`
      select count(*)::int as count from clients;
    `) as Array<{ count: number }>;

		if (count > 0) return;

		const seededClientIds: number[] = [];

		const clients = [
			{
				name: 'Fredik dal',
				company: 'Gameworks',
				photo_url: seedPhotoUrls[0],
				email: 'Fredrik.dal@gameworks.com',
				status: 'Active',
				notes: 'Velger åtteukersleveranser og raskt retur på tilbakemeldinger.',
			},
			{
				name: 'Nora dal',
				company: 'Overedal Skole',
				photo_url: seedPhotoUrls[1],
				email: 'noara.leder@oslo',
				status: 'Paused',
				notes: 'pga ueniger innen skolen',
			},
			{
				name: 'Sophia metari',
				company: 'qualtiy hotell',
				photo_url: seedPhotoUrls[2],
				email: 'sophia@qualtyhotell.no',
				status: 'Active',
				notes: 'bedre design mangler ',
			},
		];

		for (const c of clients) {
			const res = (await sql`
        insert into clients (name, company, photo_url, email, status, notes)
        values (${c.name}, ${c.company}, ${c.photo_url}, ${c.email}, ${c.status}, ${c.notes})
        returning id;
      `) as Array<{ id: number }>;
			seededClientIds.push(res[0].id);
		}

		const atlasRepo = 'https://github.com/vercel/next.js';
		const routerRepo = 'https://github.com/remix-run/react-router';
		const reactRepo = 'https://github.com/facebook/react';
		const tailwindRepo = 'https://github.com/tailwindlabs/tailwindcss';

		const projects = [
			{
				name: 'residen evil guide',
				status: 'In Progress',
				github_repo_url: atlasRepo,
				client_id: seededClientIds[0],
			},
			{
				name: 'smart hotell',
				status: 'Review',
				github_repo_url: routerRepo,
				client_id: seededClientIds[0],
			},
			{
				name: 'Client Portal',
				status: 'Done',
				github_repo_url: reactRepo,
				client_id: seededClientIds[1],
			},
			{
				name: 'typescirpt workengige',
				status: 'Archived',
				github_repo_url: tailwindRepo,
				client_id: seededClientIds[2],
			},
		];

		const seededProjectIds: number[] = [];
		for (const p of projects) {
			const res = (await sql`
        insert into projects (name, status, github_repo_url, client_id)
        values (${p.name}, ${p.status}, ${p.github_repo_url}, ${p.client_id})
        returning id;
      `) as Array<{ id: number }>;
			seededProjectIds.push(res[0].id);
		}

		// Monthly-ish payments for the bar chart (paid/invoiced/pending)
		const now = new Date();
		const monthOffsets = [5, 4, 3, 2, 1, 0];
		const paymentStatusByIndex = [
			'Paid',
			'Invoiced',
			'Pending',
			'Paid',
			'Paid',
			'Invoiced',
		] as const;

		const paymentsToSeed: Array<{
			client_id: number;
			project_id: number;
			hourly_rate: number;
			hours_logged: number;
			payment_status: string;
			created_at: string;
		}> = [];

		const projectPaymentSpecs = [
			{ projectIndex: 0, hourly_rate: 85 },
			{ projectIndex: 1, hourly_rate: 110 },
			{ projectIndex: 2, hourly_rate: 95 },
			{ projectIndex: 3, hourly_rate: 140 },
		];

		for (const spec of projectPaymentSpecs) {
			const pId = seededProjectIds[spec.projectIndex];
			const cId = projects[spec.projectIndex].client_id;
			monthOffsets.forEach((offset, i) => {
				const createdAt = new Date(now);
				createdAt.setMonth(createdAt.getMonth() - offset);
				createdAt.setDate(3 + i);
				paymentsToSeed.push({
					client_id: cId,
					project_id: pId,
					hourly_rate: spec.hourly_rate,
					hours_logged: Number((5 + (spec.projectIndex + i) * 2.25).toFixed(2)),
					payment_status:
						paymentStatusByIndex[
							(i + spec.projectIndex) % paymentStatusByIndex.length
						],
					created_at: createdAt.toISOString(),
				});
			});
		}

		for (const pay of paymentsToSeed) {
			await sql`
        insert into payments (client_id, project_id, hourly_rate, hours_logged, payment_status, created_at)
        values (${pay.client_id}, ${pay.project_id}, ${pay.hourly_rate}, ${pay.hours_logged}, ${pay.payment_status}, ${pay.created_at});
      `;
		}

		const bugsToSeed = [
			{
				projectIndex: 0,
				deepsource_issue_id: 'seed-DS-001',
				title: 'Auth middleware bypass',
				severity: 'Critical',
				file_path: 'src/middleware/auth.ts',
				category: 'security',
				status: 'Open',
			},
			{
				projectIndex: 1,
				deepsource_issue_id: 'seed-DS-002',
				title: 'Race condition in checkout flow',
				severity: 'Major',
				file_path: 'app/payments/checkout.ts',
				category: 'bug-risk',
				status: 'In Progress',
			},
			{
				projectIndex: 2,
				deepsource_issue_id: 'seed-DS-003',
				title: 'Potential XSS via input rendering',
				severity: 'Major',
				file_path: 'components/forms/TextInput.tsx',
				category: 'security',
				status: 'Resolved',
			},
			{
				projectIndex: 1,
				deepsource_issue_id: 'seed-DS-004',
				title: 'Deprecated API usage in legacy util',
				severity: 'Minor',
				file_path: 'src/utils/legacy.ts',
				category: 'bug-risk',
				status: 'Open',
			},
			{
				projectIndex: 3,
				deepsource_issue_id: 'seed-DS-005',
				title: 'Missing rate limiting on endpoint',
				severity: 'Critical',
				file_path: 'pages/api/webhook.ts',
				category: 'bug-risk',
				status: 'Resolved',
			},
		];

		for (const b of bugsToSeed) {
			await sql`
        insert into bugs (project_id, deepsource_issue_id, title, severity, file_path, category, status)
        values (${seededProjectIds[b.projectIndex]}, ${b.deepsource_issue_id}, ${b.title}, ${b.severity}, ${b.file_path}, ${b.category}, ${b.status});
      `;
		}

		const updatesToSeed = [
			{
				projectIndex: 0,
				message:
					'Reviewed the auth guard paths and moved risky logic behind a feature flag.',
				author: 'Evelyn Parker',
			},
			{
				projectIndex: 0,
				message: 'Updated routing layer to ensure consistent tenant isolation.',
				author: 'Marcus Lee',
			},
			{
				projectIndex: 1,
				message: 'Captured QA notes for the payment pipeline review round.',
				author: 'Evelyn Parker',
			},
			{
				projectIndex: 1,
				message:
					'Refined PR checklist for review: logging + idempotency guarantees.',
				author: 'Riley Chen',
			},
			{
				projectIndex: 2,
				message:
					'Completed UI polish pass and confirmed invoice calculations match spec.',
				author: 'Marcus Lee',
			},
			{
				projectIndex: 3,
				message: 'Archived security audit after remediations were merged.',
				author: 'Sophia Martinez',
			},
		];

		for (const u of updatesToSeed) {
			await sql`
        insert into updates (project_id, message, author, created_at)
        values (${seededProjectIds[u.projectIndex]}, ${u.message}, ${u.author}, ${isoDateDaysAgo(
					7 + u.projectIndex * 10
				)}::timestamptz);
      `;
		}

		// Keep TS from complaining about unused helpers (parseGithubRepo is used later by other modules).
		void parseGithubRepo;
	})();

	return ensured;
}
