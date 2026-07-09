"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface DonutChartProps {
  data: { name: string; value: number }[];
  colors?: string[];
}

const DEFAULT_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981"];

export function DonutChart({ data, colors = DEFAULT_COLORS }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ResponsiveContainer height="100%" width="100%">
      <PieChart>
        <Pie
          cx="50%"
          cy="45%"
          data={data}
          dataKey="value"
          innerRadius="55%"
          outerRadius="75%"
          paddingAngle={3}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
          }}
          formatter={(v) => {
            const n = Number(v ?? 0);
            return [`${n.toLocaleString()} (${total > 0 ? ((n / total) * 100).toFixed(1) : 0}%)`];
          }}
        />
        <Legend
          formatter={(value) => (
            <span style={{ fontSize: 12 }}>{value}</span>
          )}
          iconSize={8}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
