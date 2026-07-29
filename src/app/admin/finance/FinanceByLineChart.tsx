"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Datum = { name: string; salon: number; provider: number };

export function FinanceByLineChart({ data }: { data: Datum[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(n) => new Intl.NumberFormat("fa-IR").format(Math.round(n / 1000))} width={42} />
          <Tooltip
            cursor={{ fill: "rgba(255,77,151,0.06)" }}
            contentStyle={{ background: "rgba(29,16,41,0.92)", border: "1px solid rgba(255,77,151,0.25)", borderRadius: 14, color: "#fdf2f8", fontFamily: "Vazirmatn", boxShadow: "0 18px 50px -22px rgba(255,77,151,0.5)" }}
            formatter={(v: number) => new Intl.NumberFormat("fa-IR").format(v) + " ت"}
          />
          <Legend wrapperStyle={{ fontFamily: "Vazirmatn", fontSize: 12 }} />
          <Bar dataKey="salon" name="سهم سالن" fill="#ff4d97" radius={[6, 6, 0, 0]} />
          <Bar dataKey="provider" name="سهم خدمت‌دهنده" fill="#38bdf8" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
