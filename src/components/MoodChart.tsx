import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Confession } from "./ConfessionCard";

interface MoodChartProps {
  confessions: Confession[];
}

const MOOD_COLORS: Record<string, string> = {
  "😔": "#6b7280",
  "😢": "#3b82f6",
  "😤": "#ef4444",
  "😰": "#f59e0b",
  "💔": "#ec4899",
  "😌": "#10b981",
  "🤔": "#8b5cf6",
  "😶": "#6b7280",
  "🙃": "#f97316",
  "😊": "#22c55e",
};

export const MoodChart = ({ confessions }: MoodChartProps) => {
  const moodCounts: Record<string, number> = {};
  confessions.forEach((c) => {
    moodCounts[c.mood] = (moodCounts[c.mood] || 0) + 1;
  });

  const data = Object.entries(moodCounts)
    .map(([mood, count]) => ({
      name: mood,
      value: count,
      color: MOOD_COLORS[mood] || "#6b7280",
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No mood data yet</p>
        <p className="text-sm mt-1">Start recording to see your patterns</p>
      </div>
    );
  }

  const total = confessions.length;

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                const percentage = ((item.value / total) * 100).toFixed(1);
                return (
                  <div className="glass-effect border border-border rounded-lg px-3 py-2">
                    <p className="text-lg">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.value} times ({percentage}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-2">
        {data.slice(0, 6).map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-2 text-sm"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-lg">{item.name}</span>
            <span className="text-muted-foreground">
              {item.value} ({((item.value / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground mb-2">Insights</p>
        <div className="space-y-1 text-sm">
          {data[0] && (
            <p>
              Most common: <span className="text-lg">{data[0].name}</span> ({data[0].value} times)
            </p>
          )}
          <p className="text-muted-foreground">
            {total} total confession{total !== 1 ? 's' : ''} recorded
          </p>
        </div>
      </div>
    </div>
  );
};
