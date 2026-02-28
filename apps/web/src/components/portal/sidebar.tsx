"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  DollarSign,
  FileText,
  Briefcase,
  BarChart3,
  MessageSquare,
  Settings,
  BookOpen,
  Workflow,
  Puzzle,
  Building2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Mail,
  FolderOpen,
  Target,
  Globe,
  HelpCircle,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: "",
    items: [
      { href: "/portal/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    title: "HR",
    items: [
      { href: "/portal/employees", icon: Users, label: "Employees" },
      { href: "/portal/timesheets", icon: Clock, label: "Timesheets" },
      { href: "/portal/leaves", icon: CalendarDays, label: "Leaves" },
      { href: "/portal/payroll", icon: DollarSign, label: "Payroll" },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/portal/invoices", icon: FileText, label: "Invoices" },
      { href: "/portal/subscriptions", icon: BarChart3, label: "Subscriptions" },
    ],
  },
  {
    title: "Work",
    items: [
      { href: "/portal/projects", icon: Briefcase, label: "Projects" },
      { href: "/portal/contracts", icon: FolderOpen, label: "Contracts" },
      { href: "/portal/documents", icon: BookOpen, label: "Documents" },
      { href: "/portal/calendar", icon: CalendarDays, label: "Calendar" },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/portal/crm", icon: Target, label: "CRM" },
      { href: "/portal/clients", icon: Building2, label: "Clients" },
    ],
  },
  {
    title: "Communicate",
    items: [
      { href: "/portal/campaigns", icon: Mail, label: "Campaigns" },
      { href: "/portal/articles", icon: Globe, label: "Articles" },
      { href: "/portal/support", icon: HelpCircle, label: "Support" },
    ],
  },
  {
    title: "Platform",
    items: [
      { href: "/portal/workflows", icon: Workflow, label: "Workflows" },
      { href: "/portal/integrations", icon: Puzzle, label: "Integrations" },
      { href: "/portal/reports", icon: BarChart3, label: "Reports" },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/portal/users", icon: Users, label: "Users" },
      { href: "/portal/roles", icon: ShieldCheck, label: "Roles" },
      { href: "/portal/settings", icon: Settings, label: "Settings" },
    ],
  },
  {
    title: "",
    items: [
      { href: "/portal/messages", icon: MessageSquare, label: "Messages" },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 border-r border-border bg-sidebar transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className={cn("h-16 flex items-center border-b border-border", collapsed ? "justify-center px-3" : "px-4 gap-2")}>
        <Image
          src="/logo.png"
          alt="Eqbis Logo"
          width={28}
          height={28}
          className="shrink-0"
        />
        {!collapsed && (
          <span className="text-base font-bold gradient-text">Eqbis</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navigation.map((section, si) => (
          <div key={si}>
            {section.title && !collapsed && (
              <div className="px-2 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {section.title}
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                if (collapsed) {
                  return (
                    <Tooltip key={item.href} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center justify-center h-9 w-9 mx-auto rounded-md transition-colors",
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 h-9 px-2.5 rounded-md text-sm transition-colors",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors w-full",
            collapsed ? "justify-center" : "gap-2.5 px-2.5"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
