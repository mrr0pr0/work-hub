import { NextResponse } from 'next/server';
import { getSql, isDatabaseConfigured } from '@/src/server/db/neon';
import { ensureSchemaAndSeed } from '@/src/server/db/ensureSchemaAndSeed';

export async function GET() {
	if (!isDatabaseConfigured()) {
		return NextResponse.json(
			{ projects: [], error: 'DATABASE_URL is not configured' },
			{ status: 503 }
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
      p.client_id,
      c.name as client_name,
      c.company as client_company,
      c.photo_url as client_photo_url,
      p.created_at
    from projects p
    join clients c on c.id = p.client_id
    order by p.created_at desc;
  `) as Array<{
		id: number;
		name: string;
		status: string;
		github_repo_url: string;
		client_id: number;
		client_name: string;
		client_company: string;
		client_photo_url: string | null;
		created_at: string;
	}>;

	return NextResponse.json({ projects });
}
