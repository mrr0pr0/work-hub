import { NextResponse } from 'next/server';
import { getRepoOverview } from '@/src/server/integrations/github';

export async function GET(
	req: Request,
	context: { params: Promise<{ owner: string; repo: string }> }
) {
	const { owner, repo } = await context.params;
	if (!owner || !repo) {
		return NextResponse.json(
			{ error: 'Missing owner or repo' },
			{ status: 400 }
		);
	}

	try {
		const overview = await getRepoOverview(owner, repo);
		return NextResponse.json({ owner, repo, ...overview });
	} catch (e) {
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : 'GitHub request failed' },
			{ status: 502 }
		);
	}
}
