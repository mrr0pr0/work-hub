import { ensureSchemaAndSeed } from '@/src/server/db/ensureSchemaAndSeed';
import { getSql, isDatabaseConfigured } from '@/src/server/db/neon';
import ClientsView from '@/src/components/dashboard/ClientsView';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
	if (!isDatabaseConfigured()) {
		return (
			<div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
				<h1 className="text-xl font-semibold">Clients</h1>
				<p className="text-sm text-zinc-400 mt-2">
					Set `DATABASE_URL` to load data.
				</p>
			</div>
		);
	}
	await ensureSchemaAndSeed();
	const sql = getSql();

	const clients = (await sql`
    select id, name, company, photo_url, email, status, notes
    from clients
    order by id desc;
  `) as Array<{
		id: number;
		name: string;
		company: string;
		photo_url: string | null;
		email: string | null;
		status: string;
		notes: string;
	}>;

	const enriched = await Promise.all(
		clients.map(async (c) => {
			const activeProjects = (await sql`
        select id, name, status, github_repo_url
        from projects
        where client_id = ${c.id} and status <> 'Archived'
        order by created_at desc;
      `) as Array<{
				id: number;
				name: string;
				status: string;
				github_repo_url: string;
			}>;

			return { ...c, activeProjects };
		})
	);

	return <ClientsView clients={enriched} />;
}
