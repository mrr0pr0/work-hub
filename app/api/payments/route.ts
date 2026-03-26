import { NextResponse } from 'next/server';
import { ensureSchemaAndSeed } from '@/src/server/db/ensureSchemaAndSeed';
import { getSql, isDatabaseConfigured } from '@/src/server/db/neon';

function toYearMonth(d: Date) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	return `${y}-${m}`;
}

export async function GET() {
	if (!isDatabaseConfigured()) {
		return NextResponse.json(
			{
				payments: [],
				summary: { totalEarned: 0, totalPending: 0, totalInvoiced: 0 },
				monthlyEarnings: [],
			},
			{ status: 503 }
		);
	}
	await ensureSchemaAndSeed();
	const sql = getSql();

	const payments = (await sql`
    select
      pmt.id,
      pmt.created_at,
      pmt.payment_status,
      pmt.hourly_rate,
      pmt.hours_logged,
      (pmt.hourly_rate * pmt.hours_logged) as total_payout,
      c.name as client_name,
      pr.name as project_name
    from payments pmt
    join clients c on c.id = pmt.client_id
    join projects pr on pr.id = pmt.project_id
    order by pmt.created_at desc;
  `) as Array<{
		id: number;
		created_at: string;
		payment_status: string;
		hourly_rate: string | number;
		hours_logged: string | number;
		total_payout: string | number;
		client_name: string;
		project_name: string;
	}>;

	let totalEarned = 0;
	let totalPending = 0;
	let totalInvoiced = 0;

	// Monthly bar chart: Paid-only (Total Earned). (Can be expanded later if desired.)
	const monthlyMap = new Map<string, number>();

	for (const p of payments) {
		const total = Number(p.total_payout);
		const status = p.payment_status;

		if (status === 'Paid') totalEarned += total;
		if (status === 'Pending') totalPending += total;
		if (status === 'Invoiced') totalInvoiced += total;

		const created = new Date(p.created_at);
		const ym = toYearMonth(created);
		if (status === 'Paid') {
			monthlyMap.set(ym, (monthlyMap.get(ym) ?? 0) + total);
		}
	}

	const sortedMonthly = Array.from(monthlyMap.entries())
		.sort(([a], [b]) => (a < b ? -1 : 1))
		.slice(-6)
		.map(([month, total]) => ({ month, total }));

	return NextResponse.json({
		payments: payments.map((p) => ({
			id: p.id,
			createdAt: p.created_at,
			paymentStatus: p.payment_status,
			hourlyRate: Number(p.hourly_rate),
			hoursLogged: Number(p.hours_logged),
			totalPayout: Number(p.total_payout),
			clientName: p.client_name,
			projectName: p.project_name,
		})),
		summary: {
			totalEarned,
			totalPending,
			totalInvoiced,
		},
		monthlyEarnings: sortedMonthly,
	});
}
