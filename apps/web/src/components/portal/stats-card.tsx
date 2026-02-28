import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  className?: string;
}

export function StatsCard({ title, value, change, icon: Icon, className }: StatsCardProps) {
  const positive = change !== undefined && change >= 0;

  return (
    <div
      className={cn(
        "p-5 rounded-xl border border-border bg-card",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-muted-foreground font-medium">{title}</span>
        <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs mb-0.5",
              positive ? "text-emerald-400" : "text-red-400"
            )}
          >
            {positive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      {change !== undefined && (
        <p className="text-xs text-muted-foreground mt-1">vs last month</p>
      )}
    </div>
  );
}
