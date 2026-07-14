"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";

export interface TrendPoint {
  date: string;
  value: number | null;
  /** Optional per-point dot color (hex). Falls back to the flat `color` prop when omitted. */
  color?: string;
}

export function TrendLineChart({
  data,
  color = "#0f8b8d",
  domain = [0, 10],
  height = 200,
}: {
  data: TrendPoint[];
  color?: string;
  domain?: [number, number];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => format(new Date(d), "M/d")}
          tick={{ fontSize: 11, fill: "#71717a" }}
          minTickGap={24}
        />
        <YAxis domain={domain} tick={{ fontSize: 11, fill: "#71717a" }} width={32} />
        <Tooltip
          labelFormatter={(d) => format(new Date(d), "MMM d, yyyy")}
          contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e4e4e7" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="none"
          isAnimationActive={false}
          dot={(props: { cx?: number; cy?: number; payload?: TrendPoint }) => {
            const { cx, cy, payload } = props;
            if (cx === undefined || cy === undefined || !payload || payload.value === null) {
              return <g key={payload?.date ?? `${cx}-${cy}`} />;
            }
            return (
              <circle
                key={payload.date}
                cx={cx}
                cy={cy}
                r={4}
                fill={payload.color ?? color}
                stroke="white"
                strokeWidth={1}
              />
            );
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
