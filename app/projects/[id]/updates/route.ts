import { NextResponse } from 'next/server';
import { getSql, isDatabaseConfigured } from '@/src/server/db/neon';
import { ensureSchemaAndSeed } from '@/src/server/db/ensureSchemaAndSeed';
import { z } from 'zod';

const BodySchema = z.object({
	message: z.string().min(1).max(2000),
	author: z.string().min(1).max(200),
});

export async function GET(
	req: Request,
	context: { params: Promise<{ id: string }> }
) {
	if (!isDatabaseConfigured()) {
		return NextResponse.json(
			{ error: 'DATABASE_URL is not configured' },
			{ status: 503 }
		);
	}
	await ensureSchemaAndSeed();
	const sql = getSql();
	const { id } = await context.params;
	const projectId = Number(id);

	if (!Number.isFinite(projectId)) {
		return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
	}

	const updates = (await sql`
    select id, message, author, created_at
    from updates
    where project_id = ${projectId}
    order by created_at desc
    limit 20;
  `) as Array<{
		id: number;
		message: string;
		author: string;
		created_at: string;
	}>;

	return NextResponse.json({ updates });
}

export async function POST(
	req: Request,
	context: { params: Promise<{ id: string }> }
) {
	if (!isDatabaseConfigured()) {
		return NextResponse.json(
			{ error: 'DATABASE_URL is not configured' },
			{ status: 503 }
		);
	}
	await ensureSchemaAndSeed();
	const sql = getSql();
	const { id } = await context.params;
	const projectId = Number(id);

	if (!Number.isFinite(projectId)) {
		return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
	}

	const json = await req.json().catch(() => null);
	const body = BodySchema.safeParse(json);
	if (!body.success) {
		return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
	}

	const res = (await sql`
    insert into updates (project_id, message, author, created_at)
    values (${projectId}, ${body.data.message}, ${body.data.author}, now())
    returning id, message, author, created_at;
  `) as Array<{
		id: number;
		message: string;
		author: string;
		created_at: string;
	}>;

	return NextResponse.json({ update: res[0] });
}
