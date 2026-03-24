"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MonthlyEarningPoint = { month: string; total: number };

export function MonthlyEarningsBarChart({
  data,
}: {
  data: MonthlyEarningPoint[];
}) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="month" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
          <YAxis
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            tickFormatter={(v) => `$${Math.round(v)}`}
          />
          <Tooltip
            contentStyle={{ background: "#111827", borderColor: "#334155" }}
            formatter={(value: unknown) => {
              const n = typeof value === "number" ? value : Number(value);
              return [`$${n.toFixed(0)}`, "Earned"];
            }}
            labelStyle={{ color: "#e4e4e7" }}
          />
          <Bar dataKey="total" fill="#22c55e" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

