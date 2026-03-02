/** @jsxImportSource hono/jsx */

import { renderToString } from 'hono/jsx/dom/server';
import { Layout } from '../layout.js';
import { StatCard, Card, formatDate, timeAgo } from '../components.js';
import type { JWTPayload } from '../../types/jwt.js';

export interface DashboardData {
  stats: {
    employees:   number;
    invoicesOpen: number;
    invoicesPaid: number;
    clients:     number;
    tickets:     number;
    pendingLeaves: number;
  };
  recentActivity: Array<{
    id:        string;
    action:    string;
    module:    string;
    user_name: string | null;
    created_at: number;
  }>;
  user: JWTPayload;
}

export function renderDashboard(data: DashboardData): string {
  const { stats, recentActivity, user } = data;

  return renderToString(
    <Layout title="Dashboard" user={user} currentPath="/portal">
      <div class="p-6 space-y-6">

        {/* Welcome */}
        <div>
          <h2 class="text-xl font-bold text-[var(--text)]">
            Good {getGreeting()}, {user.name.split(' ')[0]}
          </h2>
          <p class="text-sm text-[var(--text-muted)] mt-0.5">Here's what's happening at your organisation.</p>
        </div>

        {/* Stat cards */}
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard label="Employees"      value={stats.employees}    icon="badge"           />
          <StatCard label="Open Invoices"  value={stats.invoicesOpen} icon="receipt"  accent />
          <StatCard label="Paid Invoices"  value={stats.invoicesPaid} icon="payments"        />
          <StatCard label="Clients"        value={stats.clients}      icon="handshake"       />
          <StatCard label="Open Tickets"   value={stats.tickets}      icon="support_agent"   />
          <StatCard label="Pending Leaves" value={stats.pendingLeaves}icon="event_busy"      />
        </div>

        {/* Recent activity */}
        <Card title="Recent Activity">
          {recentActivity.length === 0 ? (
            <p class="text-sm text-[var(--text-muted)] py-4 text-center">No activity yet.</p>
          ) : (
            <div class="divide-y divide-[var(--border)]">
              {recentActivity.map(log => (
                <div class="flex items-center gap-3 py-2.5">
                  <div class="w-7 h-7 rounded-full bg-[var(--bg)] flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-[14px] text-[var(--text-muted)]">
                      {moduleIcon(log.module)}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs text-[var(--text)]">
                      <span class="font-medium">{log.user_name ?? 'System'}</span>
                      {' '}{formatAction(log.action)}
                    </p>
                    <p class="text-[10px] text-[var(--text-muted)]">{timeAgo(log.created_at)}</p>
                  </div>
                  <span class="text-[10px] text-[var(--text-muted)] capitalize shrink-0">{log.module}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </Layout>
  );
}

function getGreeting(): string {
  const h = new Date().getUTCHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatAction(action: string): string {
  return action.replace(/_/g, ' ');
}

function moduleIcon(module: string): string {
  const icons: Record<string, string> = {
    auth:     'login',
    hr:       'groups',
    finance:  'receipt_long',
    crm:      'handshake',
    projects: 'folder_kanban',
    support:  'support_agent',
    comms:    'mark_email_unread',
    users:    'manage_accounts',
    roles:    'shield_person',
    org:      'corporate_fare',
  };
  return icons[module] ?? 'history';
}
