import { PortalHeader } from "@/components/portal/header";
import { StatsCard } from "@/components/portal/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  DollarSign,
  Briefcase,
  BarChart3,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

const stats = [
  { title: "Total employees", value: "48", change: 4, icon: Users },
  { title: "Monthly revenue", value: "$124k", change: 12, icon: DollarSign },
  { title: "Active projects", value: "16", change: -2, icon: Briefcase },
  { title: "Open support tickets", value: "7", change: -18, icon: BarChart3 },
];

const recentActivity = [
  {
    type: "employee",
    message: "Sarah Chen joined as Product Designer",
    time: "2h ago",
    status: "success",
  },
  {
    type: "invoice",
    message: "Invoice #INV-0412 sent to Meridian LLC",
    time: "4h ago",
    status: "info",
  },
  {
    type: "project",
    message: "Website Redesign project marked complete",
    time: "Yesterday",
    status: "success",
  },
  {
    type: "support",
    message: "3 support tickets require urgent attention",
    time: "Yesterday",
    status: "warning",
  },
  {
    type: "leave",
    message: "Marcus Williams approved leave for Dec 25–27",
    time: "2 days ago",
    status: "success",
  },
];

const quickActions = [
  { label: "Add employee", href: "/portal/employees/new", icon: Users },
  { label: "Create invoice", href: "/portal/invoices/new", icon: DollarSign },
  { label: "New project", href: "/portal/projects/new", icon: Briefcase },
  { label: "View reports", href: "/portal/reports", icon: BarChart3 },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <PortalHeader
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Good morning, Jane</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Here&apos;s what&apos;s happening with your workspace today.
            </p>
          </div>
          <Badge
            variant="secondary"
            className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20"
          >
            Pro plan
          </Badge>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Recent activity */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Recent activity</h2>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" asChild>
                <Link href="/portal/activity">
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                  <div className="mt-0.5 shrink-0">
                    {item.status === "success" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    {item.status === "warning" && (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    )}
                    {item.status === "info" && (
                      <Clock className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground/80">{item.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions + upcoming */}
          <div className="space-y-5">
            {/* Quick actions */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-3">Quick actions</h2>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:border-blue-500/30 hover:bg-white/[0.02] transition-all text-center group"
                    >
                      <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                        {action.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Pending items */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-3">Needs attention</h2>
              <div className="space-y-2">
                {[
                  { label: "3 leave requests pending", href: "/portal/leaves", dot: "amber" },
                  { label: "2 invoices overdue", href: "/portal/invoices", dot: "red" },
                  { label: "5 candidates to review", href: "/portal/applications", dot: "blue" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-2.5 py-2 group"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        item.dot === "amber"
                          ? "bg-amber-400"
                          : item.dot === "red"
                          ? "bg-red-400"
                          : "bg-blue-400"
                      }`}
                    />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      {item.label}
                    </span>
                    <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
