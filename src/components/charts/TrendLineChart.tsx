"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";

export interface TrendPoint {
  date: string;
  value: number | null;
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
          stroke={color}
          strokeWidth={2}
          dot={{ r: 2 }}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
