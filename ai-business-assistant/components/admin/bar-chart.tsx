"use client";

import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface BarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  horizontal?: boolean;
}

const DEFAULT_COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd",
  "#06b6d4", "#0ea5e9", "#3b82f6", "#818cf8",
];

export function BarChart({
  data,
  color,
  valuePrefix = "",
  valueSuffix = "",
  horizontal = false,
}: BarChartProps) {
  return (
    <ResponsiveContainer height="100%" width="100%">
      <RechartsBarChart
        data={data.map((d) => ({ name: d.label, value: d.value }))}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 4, right: 4, left: horizontal ? 80 : -20, bottom: 0 }}
      >
        <CartesianGrid stroke="currentColor" strokeDasharray="3 3" strokeOpacity={0.08} />
        {horizontal ? (
          <>
            <XAxis
              allowDecimals={false}
              axisLine={false}
              className="text-muted-foreground"
              tick={{ fontSize: 11 }}
              tickLine={false}
              type="number"
            />
            <YAxis
              axisLine={false}
              className="text-muted-foreground"
              dataKey="name"
              tick={{ fontSize: 11 }}
              tickLine={false}
              type="category"
              width={76}
            />
          </>
        ) : (
          <>
            <XAxis
              axisLine={false}
              className="text-muted-foreground"
              dataKey="name"
              tick={{ fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              className="text-muted-foreground"
              tick={{ fontSize: 11 }}
              tickLine={false}
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
          }}
          formatter={(v) => [`${valuePrefix}${Number(v ?? 0).toLocaleString()}${valueSuffix}`, "Value"]}
        />
        <Bar dataKey="value" maxBarSize={48} radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
