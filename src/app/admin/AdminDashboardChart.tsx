"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Datum = { label: string; salon: number; total: number };

const faNum = (n: number) => new Intl.NumberFormat("fa-IR").format(Math.round(n / 1000));

export function AdminDashboardChart({ data }: { data: Datum[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="gSalon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff4d97" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#ff4d97" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={faNum} width={42} />
          <Tooltip
            contentStyle={{ background: "rgba(29,16,41,0.92)", border: "1px solid rgba(255,77,151,0.25)", borderRadius: 14, color: "#fdf2f8", fontFamily: "Vazirmatn", boxShadow: "0 18px 50px -22px rgba(255,77,151,0.5)" }}
            labelStyle={{ color: "rgba(255,255,255,0.6)" }}
            formatter={(v: number) => new Intl.NumberFormat("fa-IR").format(v) + " ت"}
          />
          <Area type="monotone" dataKey="total" name="گردش کل" stroke="#a855f7" strokeWidth={2} fill="url(#gTotal)" />
          <Area type="monotone" dataKey="salon" name="سهم سالن" stroke="#ff4d97" strokeWidth={2.5} fill="url(#gSalon)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
