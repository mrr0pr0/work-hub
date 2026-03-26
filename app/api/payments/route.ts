import { isDatabaseConfigured } from "@/src/server/db/neon";
import { NextResponse } from "next/server";

function toYearMonth(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}

export async function GET() {
    if (!isDatabaseConfigured()) {
        return NextResponse.json(
            { payments: [], summary: { totalEarned: 0, totalPending: 0, totalInvoiced: 0 }, monthlyEarnings: [] },
            { status: 503}
        )
    }
}