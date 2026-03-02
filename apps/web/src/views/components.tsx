/** @jsxImportSource hono/jsx */
/**
 * Shared UI components — used across portal views.
 * All server-rendered Hono JSX; no client-side state in these components.
 */

import type { FC, PropsWithChildren } from 'hono/jsx';

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label:  string;
  value:  string | number;
  icon:   string;
  delta?: string;     // e.g. "+12%" — shown in muted text below value
  accent?: boolean;
}

export const StatCard: FC<StatCardProps> = ({ label, value, icon, delta, accent }) => (
  <div class={`rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 flex items-start gap-3 ${accent ? 'border-[var(--accent)]/40' : ''}`}>
    <div class={`w-9 h-9 rounded flex items-center justify-center shrink-0 ${accent ? 'bg-[var(--accent)]/15' : 'bg-[var(--bg)]'}`}>
      <span class={`material-symbols-outlined text-[20px] ${accent ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>{icon}</span>
    </div>
    <div>
      <p class="text-xs text-[var(--text-muted)]">{label}</p>
      <p class="text-xl font-bold text-[var(--text)] mt-0.5">{value}</p>
      {delta && <p class="text-xs text-[var(--text-muted)] mt-0.5">{delta}</p>}
    </div>
  </div>
);

// ── Badge ─────────────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-[var(--border)] text-[var(--text-muted)]',
  success: 'bg-green-500/15 text-green-400',
  warning: 'bg-amber-500/15 text-amber-400',
  danger:  'bg-red-500/15 text-red-400',
  info:    'bg-blue-500/15 text-blue-400',
  purple:  'bg-violet-500/15 text-violet-400',
};

/** Map common status strings to badge variant */
export function statusVariant(status: string): BadgeVariant {
  const s = status.toLowerCase();
  if (['active', 'paid', 'approved', 'completed', 'resolved', 'hired'].includes(s)) return 'success';
  if (['pending', 'draft', 'new', 'open', 'reviewing'].includes(s))                  return 'info';
  if (['in_progress', 'sent', 'shortlisted', 'on_hold'].includes(s))                 return 'warning';
  if (['inactive', 'rejected', 'cancelled', 'overdue', 'terminated', 'closed'].includes(s)) return 'danger';
  return 'default';
}

interface BadgeProps {
  label:    string;
  variant?: BadgeVariant;
}

export const Badge: FC<BadgeProps> = ({ label, variant = 'default' }) => (
  <span class={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${BADGE_CLASSES[variant]}`}>
    {label}
  </span>
);

// ── Table ─────────────────────────────────────────────────────────────────────

export const Table: FC<PropsWithChildren<{ headers: string[] }>> = ({ headers, children }) => (
  <div class="overflow-x-auto rounded-lg border border-[var(--border)]">
    <table class="w-full text-sm">
      <thead class="border-b border-[var(--border)]">
        <tr>
          {headers.map(h => (
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody class="divide-y divide-[var(--border)]">
        {children as any}
      </tbody>
    </table>
  </div>
);

export const Td: FC<PropsWithChildren<{ muted?: boolean; nowrap?: boolean }>> = ({ children, muted, nowrap }) => (
  <td class={`px-4 py-2.5 ${muted ? 'text-[var(--text-muted)]' : 'text-[var(--text)]'} ${nowrap ? 'whitespace-nowrap' : ''}`}>
    {children as any}
  </td>
);

// ── Button ────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const BTN_CLASSES: Record<ButtonVariant, string> = {
  primary:   'bg-[var(--accent)] text-white hover:opacity-90',
  secondary: 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg)]',
  danger:    'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25',
  ghost:     'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]',
};

interface ButtonProps {
  variant?:  ButtonVariant;
  type?:     'button' | 'submit' | 'reset';
  href?:     string;
  small?:    boolean;
  disabled?: boolean;
  class?:    string;
  onclick?:  string;
}

export const Button: FC<PropsWithChildren<ButtonProps>> = ({
  variant = 'primary', type = 'button', href, small, disabled, class: cls, onclick, children,
}) => {
  const base = `inline-flex items-center gap-1.5 ${small ? 'h-7 px-2.5 text-xs' : 'h-9 px-4 text-sm'} rounded font-medium transition-colors disabled:opacity-50 cursor-pointer`;
  const classes = `${base} ${BTN_CLASSES[variant]} ${cls ?? ''}`;

  if (href) {
    return <a href={href} class={classes}>{children as any}</a>;
  }
  return (
    <button type={type} class={classes} disabled={disabled} onclick={onclick}>
      {children as any}
    </button>
  );
};

// ── Card ──────────────────────────────────────────────────────────────────────

export const Card: FC<PropsWithChildren<{ title?: string; action?: unknown; class?: string }>> = ({
  title, action, class: cls, children,
}) => (
  <div class={`rounded-lg border border-[var(--border)] bg-[var(--surface)] ${cls ?? ''}`}>
    {(title || action) && (
      <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        {title && <h2 class="text-sm font-semibold text-[var(--text)]">{title}</h2>}
        {action as any}
      </div>
    )}
    <div class="p-4">{children as any}</div>
  </div>
);

// ── Empty State ───────────────────────────────────────────────────────────────

interface EmptyProps {
  icon:    string;
  title:   string;
  message?: string;
  action?: unknown;
}

export const Empty: FC<EmptyProps> = ({ icon, title, message, action }) => (
  <div class="py-16 flex flex-col items-center gap-3 text-center">
    <span class="material-symbols-outlined text-4xl text-[var(--text-muted)]">{icon}</span>
    <p class="font-medium text-[var(--text)]">{title}</p>
    {message && <p class="text-sm text-[var(--text-muted)] max-w-xs">{message}</p>}
    {action as any}
  </div>
);

// ── Input / Field helpers (for use in form HTML strings) ──────────────────────

export function inputClass(): string {
  return 'w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)]';
}

export function labelClass(): string {
  return 'block text-xs font-medium text-[var(--text-muted)] mb-1';
}

// ── Page Header ───────────────────────────────────────────────────────────────

export const PageHeader: FC<PropsWithChildren<{ title: string; subtitle?: string }>> = ({
  title, subtitle, children,
}) => (
  <div class="flex items-start justify-between mb-6">
    <div>
      <h2 class="text-lg font-bold text-[var(--text)]">{title}</h2>
      {subtitle && <p class="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
    </div>
    <div class="flex items-center gap-2">{children as any}</div>
  </div>
);

// ── Modal (Alpine-powered) ────────────────────────────────────────────────────

export const Modal: FC<PropsWithChildren<{
  id:    string;  // unique ID for x-data binding
  title: string;
  trigger: unknown; // the button/element that opens the modal
}>> = ({ id, title, trigger, children }) => (
  <div x-data={`{ open_${id}: false }`}>
    <div x-on:click={`open_${id} = true`}>{trigger as any}</div>
    <div
      x-show={`open_${id}`}
      x-transition
      class="fixed inset-0 z-50 flex items-center justify-center"
      style="display:none"
    >
      <div class="absolute inset-0 bg-black/60" x-on:click={`open_${id} = false`}></div>
      <div class="relative z-10 w-full max-w-lg mx-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h3 class="font-semibold text-[var(--text)]">{title}</h3>
          <button x-on:click={`open_${id} = false`} class="text-[var(--text-muted)] hover:text-[var(--text)]">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div class="p-5">{children as any}</div>
      </div>
    </div>
  </div>
);

// ── Alert / Flash messages ────────────────────────────────────────────────────

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

const ALERT_CLASSES: Record<AlertVariant, string> = {
  success: 'bg-green-500/10 border-green-500/30 text-green-400',
  error:   'bg-red-500/10 border-red-500/30 text-red-400',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  info:    'bg-blue-500/10 border-blue-500/30 text-blue-400',
};

export const Alert: FC<{ message: string; variant: AlertVariant }> = ({ message, variant }) => (
  <div class={`flex items-center gap-2 px-3 py-2 rounded border text-sm ${ALERT_CLASSES[variant]}`}>
    <span class="material-symbols-outlined text-[16px]">
      {variant === 'success' ? 'check_circle' : variant === 'error' ? 'error' : 'info'}
    </span>
    {message}
  </div>
);

// ── Format helpers ────────────────────────────────────────────────────────────

export function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function timeAgo(ts: number): string {
  const diff = Date.now() / 1000 - ts;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
