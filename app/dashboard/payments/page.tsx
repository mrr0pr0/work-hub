import { ensureSchemaAndSeed } from "@/src/server/db/ensureSchemaAndSeed";
import { getSql, isDatabaseConfigured } from "@/src/server/db/neon";
import {
  paymentStatusTone,
  StatusBadge,
} from "@/src/components/dashboard/StatusBadge";
import { MonthlyEarningsBarChart } from "@/src/components/dashboard/MonthlyEarningsBarChart";

export const dynamic = "force-dynamic";

function toYearMonth(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default async function PaymentsPage() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h1 className="text-xl font-semibold">Payments</h1>
        <p className="text-sm text-zinc-400 mt-2">Set `DATABASE_URL` to load data.</p>
      </div>
    );
  }
  await ensureSchemaAndSeed();
  const sql = getSql();

  const rows = (await sql`
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

  // Monthly bar chart: Paid-only (Total Earned).
  const monthlyMap = new Map<string, number>();

  for (const r of rows) {
    const total = Number(r.total_payout);
    if (r.payment_status === "Paid") totalEarned += total;
    if (r.payment_status === "Pending") totalPending += total;
    if (r.payment_status === "Invoiced") totalInvoiced += total;

    if (r.payment_status === "Paid") {
      const ym = toYearMonth(new Date(r.created_at));
      monthlyMap.set(ym, (monthlyMap.get(ym) ?? 0) + total);
    }
  }

  const monthlyEarnings = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-6)
    .map(([month, total]) => ({ month, total }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Payments</h1>
        <p className="text-sm text-zinc-400 mt-1">Earnings summary and monthly payout chart.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="text-xs text-zinc-400">Total Earned</div>
          <div className="text-2xl font-semibold mt-2">{money(totalEarned)}</div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="text-xs text-zinc-400">Total Pending</div>
          <div className="text-2xl font-semibold mt-2">{money(totalPending)}</div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="text-xs text-zinc-400">Total Invoiced</div>
          <div className="text-2xl font-semibold mt-2">{money(totalInvoiced)}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-sm font-semibold">Monthly earnings (Paid)</h2>
        </div>
        <MonthlyEarningsBarChart data={monthlyEarnings} />
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold mb-3">Payment entries</h2>
        <div className="space-y-3">
          {rows.slice(0, 20).map((r) => (
            <div key={r.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">{r.client_name}</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Project: {r.project_name}
                  </div>
                </div>
                <StatusBadge
                  label={r.payment_status}
                  tone={paymentStatusTone(r.payment_status)}
                />
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-xs text-zinc-400">Rate</div>
                  <div className="font-medium">${Number(r.hourly_rate).toFixed(2)}/hr</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400">Hours</div>
                  <div className="font-medium">{Number(r.hours_logged).toFixed(2)} hrs</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400">Total payout</div>
                  <div className="font-medium">{money(Number(r.total_payout))}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400">Created</div>
                  <div className="font-medium">
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {rows.length === 0 ? <div className="text-sm text-zinc-500">No payments found.</div> : null}
        </div>
      </div>
    </div>
  );
}

