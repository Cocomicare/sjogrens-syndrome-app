"use client";

import { useId } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";

export interface TrendPoint {
  date: string;
  value: number | null;
  /** Optional per-point color (hex). When any point sets this, the line renders as a color gradient instead of a flat color. */
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
  const gradientId = useId();
  const hasPerPointColor = data.some((d) => d.color);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
        {hasPerPointColor && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              {data.map((d, i) => (
                <stop
                  key={i}
                  offset={data.length > 1 ? `${(i / (data.length - 1)) * 100}%` : "0%"}
                  stopColor={d.color ?? "#d4d4d8"}
                />
              ))}
            </linearGradient>
          </defs>
        )}
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
          stroke={hasPerPointColor ? `url(#${gradientId})` : color}
          strokeWidth={2}
          dot={
            hasPerPointColor
              ? (props: { cx?: number; cy?: number; payload?: TrendPoint }) => {
                  const { cx, cy, payload } = props;
                  if (cx === undefined || cy === undefined || !payload || payload.value === null) return <g key={`${cx}-${cy}`} />;
                  return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.5} fill={payload.color ?? color} stroke="none" />;
                }
              : { r: 2 }
          }
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
