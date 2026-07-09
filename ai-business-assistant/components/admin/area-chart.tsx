"use client";

import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface AreaChartProps {
  data: { date: string; value: number }[];
  label?: string;
  color?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}

export function AreaChart({
  data,
  label = "Value",
  color = "#6366f1",
  valuePrefix = "",
  valueSuffix = "",
}: AreaChartProps) {
  const maxTicks = 7;
  const step = Math.max(1, Math.floor(data.length / maxTicks));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval={step - 1}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
          }}
          formatter={(v) => [
            `${valuePrefix}${Number(v ?? 0).toLocaleString()}${valueSuffix}`,
            label,
          ]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color.replace("#", "")})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
