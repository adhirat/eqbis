/** @jsxImportSource hono/jsx */
/**
 * Portal Layout — wraps all portal pages.
 * Sidebar is collapsible via Alpine.js; state persisted to localStorage.
 * Sections are labelled (CRM, HR, Activities, etc.) with coloured icons.
 * A global bottom bar provides quick-access smart features.
 * Profile panel: slideout from right, triggered by header avatar.
 */

import type { FC } from 'hono/jsx';
import type { JWTPayload } from '../types/jwt.js';
import type { Permission } from '../lib/permissions.js';
import { PERMISSIONS } from '../lib/permissions.js';

// ── Nav types ─────────────────────────────────────────────────────────────────

interface NavSection {
  type:  'section';
  label: string;
}

interface NavItem {
  label:      string;
  href:       string;
  icon:       string;
  iconColor:  string;
  permission: Permission | null;
  children?:  Array<{ label: string; href: string; permission: Permission | null }>;
}

type NavEntry = NavSection | NavItem;

// ── Accent colour palette ─────────────────────────────────────────────────────

const ACCENT_COLORS = [
  { label: 'Indigo',  hex: '#6366f1' },
  { label: 'Blue',    hex: '#3b82f6' },
  { label: 'Violet',  hex: '#8b5cf6' },
  { label: 'Purple',  hex: '#a855f7' },
  { label: 'Pink',    hex: '#ec4899' },
  { label: 'Rose',    hex: '#f43f5e' },
  { label: 'Orange',  hex: '#f97316' },
  { label: 'Amber',   hex: '#f59e0b' },
  { label: 'Emerald', hex: '#10b981' },
  { label: 'Teal',    hex: '#14b8a6' },
  { label: 'Cyan',    hex: '#06b6d4' },
  { label: 'Slate',   hex: '#64748b' },
];

// ── Navigation definition ─────────────────────────────────────────────────────

const NAV: NavEntry[] = [
  {
    label: 'Dashboard', href: '/portal', icon: 'grid_view',
    iconColor: 'text-blue-400', permission: PERMISSIONS.VIEW_DASHBOARD,
  },

  // ── CRM ───────────────────────────────────────────────────────────────────
  { type: 'section', label: 'CRM' },
  { label: 'Leads',     href: '/portal/crm/leads',     icon: 'person_add',        iconColor: 'text-violet-400', permission: PERMISSIONS.VIEW_CRM },
  { label: 'Contacts',  href: '/portal/crm/contacts',  icon: 'contacts',          iconColor: 'text-violet-400', permission: PERMISSIONS.VIEW_CRM },
  { label: 'Accounts',  href: '/portal/crm/accounts',  icon: 'domain',            iconColor: 'text-violet-400', permission: PERMISSIONS.VIEW_CRM },
  { label: 'Deals',     href: '/portal/crm/deals',     icon: 'monetization_on',   iconColor: 'text-violet-400', permission: PERMISSIONS.VIEW_CRM },
  { label: 'Clients',   href: '/portal/crm/clients',   icon: 'handshake',         iconColor: 'text-violet-400', permission: PERMISSIONS.VIEW_CRM },
  { label: 'Campaigns', href: '/portal/crm/campaigns', icon: 'campaign',          iconColor: 'text-violet-400', permission: PERMISSIONS.VIEW_CRM },
  { label: 'Forecasts', href: '/portal/crm/forecasts', icon: 'trending_up',       iconColor: 'text-violet-400', permission: PERMISSIONS.VIEW_CRM },

  // ── HR ────────────────────────────────────────────────────────────────────
  { type: 'section', label: 'HR' },
  { label: 'Employees',    href: '/portal/hr/employees',    icon: 'badge',           iconColor: 'text-emerald-400', permission: PERMISSIONS.VIEW_EMPLOYEES },
  { label: 'Timesheets',   href: '/portal/hr/timesheets',   icon: 'schedule',        iconColor: 'text-emerald-400', permission: PERMISSIONS.VIEW_TIMESHEET },
  { label: 'Leaves',       href: '/portal/hr/leaves',       icon: 'event_busy',      iconColor: 'text-emerald-400', permission: PERMISSIONS.VIEW_LEAVES },
  { label: 'Documents',    href: '/portal/hr/documents',    icon: 'description',     iconColor: 'text-emerald-400', permission: PERMISSIONS.VIEW_DOCUMENTS },
  { label: 'Careers',      href: '/portal/hr/careers',      icon: 'work',            iconColor: 'text-emerald-400', permission: PERMISSIONS.VIEW_CAREERS },
  { label: 'Applications', href: '/portal/hr/applications', icon: 'assignment_ind',  iconColor: 'text-emerald-400', permission: PERMISSIONS.VIEW_APPLICATIONS },

  // ── Activities ────────────────────────────────────────────────────────────
  { type: 'section', label: 'Activities' },
  { label: 'Tasks',    href: '/portal/activities/tasks',    icon: 'task_alt',   iconColor: 'text-orange-400', permission: PERMISSIONS.VIEW_ACTIVITIES },
  { label: 'Meetings', href: '/portal/activities/meetings', icon: 'video_call', iconColor: 'text-orange-400', permission: PERMISSIONS.VIEW_ACTIVITIES },
  { label: 'Calls',    href: '/portal/activities/calls',    icon: 'call',       iconColor: 'text-orange-400', permission: PERMISSIONS.VIEW_ACTIVITIES },

  // ── Finance ───────────────────────────────────────────────────────────────
  { type: 'section', label: 'Finance' },
  { label: 'Invoices', href: '/portal/finance/invoices', icon: 'receipt_long',  iconColor: 'text-yellow-400', permission: PERMISSIONS.VIEW_INVOICES },
  { label: 'Receipts', href: '/portal/finance/receipts', icon: 'payments',      iconColor: 'text-yellow-400', permission: PERMISSIONS.VIEW_PAYROLL },

  // ── Inventory ─────────────────────────────────────────────────────────────
  { type: 'section', label: 'Inventory' },
  { label: 'Products',        href: '/portal/inventory/products',        icon: 'inventory_2',    iconColor: 'text-pink-400', permission: PERMISSIONS.VIEW_INVENTORY },
  { label: 'Price Books',     href: '/portal/inventory/price-books',     icon: 'menu_book',      iconColor: 'text-pink-400', permission: PERMISSIONS.VIEW_INVENTORY },
  { label: 'Quotes',          href: '/portal/inventory/quotes',          icon: 'request_quote',  iconColor: 'text-pink-400', permission: PERMISSIONS.VIEW_INVENTORY },
  { label: 'Sales Orders',    href: '/portal/inventory/sales-orders',    icon: 'shopping_cart',  iconColor: 'text-pink-400', permission: PERMISSIONS.VIEW_INVENTORY },
  { label: 'Purchase Orders', href: '/portal/inventory/purchase-orders', icon: 'shopping_bag',   iconColor: 'text-pink-400', permission: PERMISSIONS.VIEW_INVENTORY },
  { label: 'Vendors',         href: '/portal/inventory/vendors',         icon: 'store',          iconColor: 'text-pink-400', permission: PERMISSIONS.VIEW_INVENTORY },

  // ── Support ───────────────────────────────────────────────────────────────
  { type: 'section', label: 'Support' },
  { label: 'Tickets',   href: '/portal/support/tickets',   icon: 'support_agent',  iconColor: 'text-red-400', permission: PERMISSIONS.VIEW_TICKETS },
  { label: 'Cases',     href: '/portal/support/cases',     icon: 'folder_special', iconColor: 'text-red-400', permission: PERMISSIONS.VIEW_CASES },
  { label: 'Solutions', href: '/portal/support/solutions', icon: 'lightbulb',      iconColor: 'text-red-400', permission: PERMISSIONS.VIEW_SOLUTIONS },

  // ── Comms ─────────────────────────────────────────────────────────────────
  { type: 'section', label: 'Communications' },
  { label: 'Messages',   href: '/portal/comms/messages',   icon: 'forum',     iconColor: 'text-teal-400', permission: PERMISSIONS.VIEW_SUBMISSIONS },
  { label: 'Newsletter', href: '/portal/comms/newsletter', icon: 'newspaper', iconColor: 'text-teal-400', permission: PERMISSIONS.VIEW_SUBSCRIPTIONS },

  // ── Services / Projects ───────────────────────────────────────────────────
  { type: 'section', label: 'Services' },
  { label: 'Projects', href: '/portal/projects', icon: 'view_kanban', iconColor: 'text-cyan-400', permission: PERMISSIONS.VIEW_PROJECTS },

  // ── Admin ─────────────────────────────────────────────────────────────────
  { type: 'section', label: 'Admin' },
  { label: 'Users',        href: '/portal/users',        icon: 'manage_accounts', iconColor: 'text-blue-400',   permission: PERMISSIONS.VIEW_USERS },
  { label: 'Roles',        href: '/portal/roles',        icon: 'shield_person',   iconColor: 'text-purple-400', permission: PERMISSIONS.VIEW_ROLES },
  { label: 'Organisation', href: '/portal/organization', icon: 'corporate_fare',  iconColor: 'text-indigo-400', permission: PERMISSIONS.MANAGE_ORGANIZATION },
  { label: 'Activity',     href: '/portal/activity',     icon: 'history',         iconColor: 'text-amber-400',  permission: PERMISSIONS.MANAGE_SETTINGS },
  { label: 'Settings',     href: '/portal/settings',     icon: 'settings',        iconColor: 'text-rose-400',   permission: PERMISSIONS.VIEW_SETTINGS },
];

// ── Component interfaces ──────────────────────────────────────────────────────

interface LayoutProps {
  title:       string;
  user:        JWTPayload;
  currentPath: string;
  children:    unknown;
}

// ── SidebarItem ───────────────────────────────────────────────────────────────

const SidebarItem: FC<{ item: NavItem; user: JWTPayload; currentPath: string }> = ({ item, user, currentPath }) => {
  const userPerms = new Set(user.permissions);
  if (item.permission && !userPerms.has(item.permission)) return null;

  const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');

  if (item.children) {
    const visibleChildren = item.children.filter(c => !c.permission || userPerms.has(c.permission));
    if (visibleChildren.length === 0) return null;
    const childActive    = visibleChildren.some(c => currentPath.startsWith(c.href));
    const firstChildHref = visibleChildren[0]?.href ?? '#';

    return (
      <div x-data={`{ open: ${childActive} }`} class="space-y-px">
        <button
          x-on:click={`collapsed ? (window.location.href='${firstChildHref}') : (open = !open)`}
          title={item.label}
          class="w-full flex items-center h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
          x-bind:class="collapsed ? 'justify-center' : 'gap-2 px-2'"
        >
          <span class={`material-symbols-outlined text-[16px] shrink-0 ${item.iconColor}`}>{item.icon}</span>
          <span class="flex-1 text-left truncate text-[12px]" x-show="!collapsed" x-cloak>{item.label}</span>
          <span
            class="material-symbols-outlined text-[12px] transition-transform shrink-0 text-[var(--text-muted)]"
            x-show="!collapsed" x-cloak
            x-bind:class="open ? 'rotate-90' : ''"
          >chevron_right</span>
        </button>
        <div x-show="open && !collapsed" x-collapse class="pl-6 space-y-px">
          {visibleChildren.map(child => (
            <a
              href={child.href}
              class={`flex items-center h-6 px-2 rounded-md text-[11px] transition-colors ${
                currentPath === child.href || currentPath.startsWith(child.href + '/')
                  ? 'text-[var(--text)] bg-[var(--accent)]/10 font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
              }`}
            >
              {child.label}
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      x-data="{ tip: false, tipY: 0 }"
      x-effect="if (!collapsed) tip = false"
      x-on:mouseenter="if (collapsed) { tip = true; tipY = $el.getBoundingClientRect().top + $el.getBoundingClientRect().height / 2; }"
      x-on:mouseleave="tip = false"
      class="relative"
    >
      <a
        href={item.href}
        class={`flex items-center h-7 rounded-md text-[12px] transition-colors ${
          isActive
            ? 'text-[var(--text)] bg-[var(--accent)]/10 font-medium'
            : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
        }`}
        x-bind:class="collapsed ? 'justify-center' : 'gap-2 px-2'"
      >
        <span class={`material-symbols-outlined text-[16px] shrink-0 ${item.iconColor}`}>{item.icon}</span>
        <span class="truncate" x-show="!collapsed" x-cloak>{item.label}</span>
      </a>
      {/* Tooltip — only mounted in DOM when collapsed; x-if removes it entirely when expanded */}
      <template x-if="collapsed">
        <div
          x-show="tip"
          x-transition:enter="transition-opacity duration-100"
          x-transition:enter-start="opacity-0"
          x-transition:enter-end="opacity-100"
          x-transition:leave="transition-opacity duration-75"
          x-transition:leave-start="opacity-100"
          x-transition:leave-end="opacity-0"
          x-bind:style="`position:fixed;left:${sidebarWidth+10}px;top:${tipY}px;transform:translateY(-50%);z-index:200;pointer-events:none;`"
          class="bg-[var(--surface)] border border-[var(--border)] rounded-md shadow-lg px-2 py-1 text-xs text-[var(--text)] whitespace-nowrap"
        >
          {item.label}
        </div>
      </template>
    </div>
  );
};

// ── Layout ────────────────────────────────────────────────────────────────────

export const Layout: FC<LayoutProps> = ({ title, user, currentPath, children }) => {
  const initials = user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const userId   = (user.sub ?? user.userId ?? '').slice(0, 10).toUpperCase();

  // Compute which sections contain the currently active nav item (server-side, passed to Alpine)
  const activeSectionKeys: string[] = [];
  let _curSection: string | null = null;
  for (const entry of NAV) {
    if ('type' in entry) {
      _curSection = (entry as NavSection).label;
    } else {
      const item = entry as NavItem;
      if (currentPath === item.href || currentPath.startsWith(item.href + '/')) {
        if (_curSection) activeSectionKeys.push(_curSection);
      }
    }
  }

  return (
    <html
      lang="en"
      data-theme="dark"
      x-data={`{
        theme:        localStorage.getItem('eqbis-theme')  || 'dark',
        collapsed:    localStorage.getItem('eqbis-sidebar') === 'true',
        sidebarWidth: Number(localStorage.getItem('eqbis-sidebar-w')) || (localStorage.getItem('eqbis-sidebar') === 'true' ? 48 : 208),
        isResizing:   false,
        profileOpen:  false,
        accent:       localStorage.getItem('eqbis-accent') || '',
        activeSections: new Set(${JSON.stringify(activeSectionKeys)}),
        openSections: (() => {
          const def = {CRM:true,HR:true,Activities:true,Finance:true,Inventory:true,Support:true,Communications:true,Services:true,Admin:true};
          try {
            const saved = localStorage.getItem('eqbis-sections');
            const result = saved ? {...def,...JSON.parse(saved)} : {...def};
            // Active sections are always open on load regardless of saved state
            ${activeSectionKeys.map(k => `result['${JSON.stringify(k).slice(1,-1)}'] = true;`).join(' ')}
            return result;
          } catch { return def; }
        })(),
        startResize(e) {
          this.isResizing = true;
          const startX = e.clientX, startW = this.sidebarWidth;
          const move = ev => {
            const w = Math.max(48, Math.min(320, startW + ev.clientX - startX));
            this.sidebarWidth = w;
            this.collapsed = w < 100;
            localStorage.setItem('eqbis-sidebar-w', w);
            localStorage.setItem('eqbis-sidebar', this.collapsed);
          };
          const up = () => {
            this.isResizing = false;
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
          };
          document.addEventListener('mousemove', move);
          document.addEventListener('mouseup', up);
        },
        applyTheme(t) {
          this.theme = t;
          if (t === 'auto') {
            const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
          } else {
            document.documentElement.setAttribute('data-theme', t);
          }
          localStorage.setItem('eqbis-theme', t);
        },
        setAccent(color) {
          this.accent = color;
          document.documentElement.style.setProperty('--accent', color);
          localStorage.setItem('eqbis-accent', color);
        },
        toggleSection(key) {
          // Don't collapse the section that contains the active page
          if (!this.openSections[key] || !this.activeSections.has(key)) {
            this.openSections[key] = !this.openSections[key];
            localStorage.setItem('eqbis-sections', JSON.stringify(this.openSections));
          }
        }
      }`}
      x-init={`
        (() => {
          const t = theme;
          if (t === 'auto') {
            const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            $el.setAttribute('data-theme', dark ? 'dark' : 'light');
          } else {
            $el.setAttribute('data-theme', t);
          }
        })();
        if (accent) document.documentElement.style.setProperty('--accent', accent);
        $watch('collapsed', v => localStorage.setItem('eqbis-sidebar', v));
      `}
    >
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title} — EQBIS</title>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('eqbis-theme');if(t&&t!=='auto')document.documentElement.setAttribute('data-theme',t);var a=localStorage.getItem('eqbis-accent');if(a)document.documentElement.style.setProperty('--accent',a);})();` }} />
        <link rel="stylesheet" href="/css/app.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: `
          /* Hide Alpine x-cloak elements until Alpine initialises */
          [x-cloak] { display: none !important; }
          aside nav .material-symbols-outlined { font-size: 16px; line-height: 1; }
          aside > div .material-symbols-outlined { font-size: 18px; line-height: 1; }
          header .material-symbols-outlined { font-size: 18px; line-height: 1; }
          [data-bottombar] .material-symbols-outlined { font-size: 12px; line-height: 1; }
          /* Thin sidebar scrollbar */
          aside nav::-webkit-scrollbar { width: 3px; }
          aside nav::-webkit-scrollbar-track { background: transparent; }
          aside nav::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
          aside nav::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
          aside nav { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
        ` }} />
      </head>

      <body class="h-screen overflow-hidden flex flex-col bg-[var(--bg)] text-[var(--text)] font-sans antialiased">

        {/* ── Top area (sidebar + content) ──────────────────────────────────── */}
        <div class="flex flex-1 overflow-hidden">

          {/* ── Sidebar ──────────────────────────────────────────────────────── */}
          <aside
            x-bind:style="`width:${sidebarWidth}px; transition:${isResizing ? 'none' : 'width 180ms ease-in-out'};`"
            class="relative shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--bg)] overflow-x-hidden"
          >
            {/* Logo + org + collapse toggle */}
            <div
              class="h-12 flex items-center border-b border-[var(--border)] shrink-0 overflow-hidden px-2"
              x-data="{ hdr: false }"
              x-on:mouseenter="hdr = true"
              x-on:mouseleave="hdr = false"
            >
              {/* Logo link — clicking when collapsed expands the sidebar instead of navigating */}
              <a
                href="/portal"
                class="flex items-center gap-2 min-w-0 flex-1 relative"
                title="EQBIS"
                x-on:click="if(collapsed) { collapsed = false; sidebarWidth = 208; localStorage.setItem('eqbis-sidebar-w', 208); $event.preventDefault(); }"
              >
                {/* Logo icon — fades out on hover when collapsed to reveal chevron */}
                <img
                  src="/images/logo.png" alt="EQBIS" class="w-6 h-6 shrink-0"
                  x-bind:style="collapsed && hdr ? 'opacity:0' : 'opacity:1'"
                  style="transition:opacity 120ms ease;"
                />
                {/* Chevron overlay — only visible when collapsed + hovered */}
                <span
                  class="absolute flex items-center justify-center"
                  style="left:0;width:24px;height:24px;pointer-events:none;"
                  x-show="collapsed && hdr"
                  x-cloak
                >
                  <span class="material-symbols-outlined" style="font-size:16px;color:var(--accent);">chevron_right</span>
                </span>
                {/* Org name + text — only when expanded */}
                <div class="min-w-0 flex-1" x-show="!collapsed" x-cloak>
                  <p class="font-bold text-[13px] leading-tight text-[var(--text)] truncate">EQBIS</p>
                  <p class="text-[10px] text-[var(--text-muted)] truncate uppercase tracking-wide leading-tight">{user.orgSlug}</p>
                </div>
              </a>
              {/* Collapse button — only shown when sidebar is expanded */}
              <button
                x-on:click="collapsed = true; sidebarWidth = 48; localStorage.setItem('eqbis-sidebar-w', 48);"
                x-show="!collapsed"
                x-cloak
                title="Collapse sidebar"
                class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
              >
                <span class="material-symbols-outlined" style="font-size:15px;">chevron_left</span>
              </button>
            </div>

            {/* Navigation */}
            <nav class="flex-1 px-1.5 py-1.5 overflow-y-auto overflow-x-hidden">
              {(() => {
                // Group NAV entries by section
                type NavGroup = { section: NavSection | null; items: NavItem[] };
                const groups: NavGroup[] = [];
                let cur: NavGroup = { section: null, items: [] };
                for (const entry of NAV) {
                  if ('type' in entry) {
                    if (cur.items.length > 0 || cur.section !== null) groups.push({ ...cur, items: [...cur.items] });
                    cur = { section: entry as NavSection, items: [] };
                  } else {
                    cur.items.push(entry as NavItem);
                  }
                }
                if (cur.items.length > 0 || cur.section !== null) groups.push(cur);

                return groups.map(group => {
                  if (!group.section) {
                    // Dashboard — no section wrapper
                    return group.items.map(item =>
                      <SidebarItem item={item as NavItem} user={user} currentPath={currentPath} />
                    );
                  }

                  const key = group.section.label;

                  return (
                    <div>
                      {/* Section header — clickable in expanded mode */}
                      <div class="flex items-center px-1 pt-2.5 pb-0.5 group" x-show="!collapsed" x-cloak>
                        <button
                          x-on:click={`toggleSection('${key}')`}
                          class="flex-1 flex items-center justify-between min-w-0"
                          title={`Toggle ${key}`}
                        >
                          <p class="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">{key}</p>
                          <span
                            class="material-symbols-outlined text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            style="font-size:11px;"
                            x-bind:class={`openSections['${key}'] ? '' : 'rotate-180'`}
                          >expand_less</span>
                        </button>
                      </div>
                      {/* Divider in collapsed (icon-only) mode */}
                      <div class="mx-2 my-1 border-t border-[var(--border)]" x-show="collapsed" x-cloak />

                      {/* Section items — shown when open OR sidebar is collapsed (icon-only shows all) */}
                      <div x-show={`openSections['${key}'] || collapsed`} x-collapse>
                        {group.items.map(item =>
                          <SidebarItem item={item as NavItem} user={user} currentPath={currentPath} />
                        )}
                      </div>
                    </div>
                  );
                });
              })()}

            </nav>
            {/* ── Resize handle — drag to resize sidebar width ────────────────── */}
            <div
              x-data="{ rh: false }"
              x-on:mouseenter="rh = true"
              x-on:mouseleave="rh = false"
              x-on:mousedown="$event.preventDefault(); startResize($event)"
              class="absolute right-0 top-0 bottom-0"
              style="width:5px; cursor:col-resize; z-index:20;"
            >
              <div
                class="h-full"
                style="width:2px;margin-left:auto;transition:background-color 150ms ease;"
                x-bind:style="rh || isResizing ? 'background-color:var(--accent);opacity:0.6;' : 'background-color:transparent;'"
              />
            </div>
          </aside>

          {/* ── Main Content ──────────────────────────────────────────────────── */}
          <div class="flex-1 flex flex-col overflow-hidden min-w-0">

            {/* Top header */}
            <header class="h-12 shrink-0 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--bg)]">
              <h1 class="text-sm font-semibold text-[var(--text)] truncate">{title}</h1>

              <div class="flex items-center gap-2 shrink-0">
                {/* Search */}
                <button
                  title="Search (⌘K)"
                  class="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                >
                  <span class="material-symbols-outlined" style="font-size:18px;line-height:1;">search</span>
                </button>

                {/* Notifications */}
                <button
                  title="Notifications"
                  class="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                >
                  <span class="material-symbols-outlined" style="font-size:18px;line-height:1;">notifications</span>
                </button>

                {/* Avatar — opens profile panel */}
                <button
                  x-on:click="profileOpen = true"
                  title={`${user.name} — Open profile`}
                  class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-opacity hover:opacity-90 shrink-0"
                  style="background-color: var(--accent);"
                >
                  {initials}
                </button>
              </div>
            </header>

            {/* Page content */}
            <main class="flex-1 overflow-y-auto">
              {children as any}
            </main>
          </div>

        </div>{/* end top area */}

        {/* ── Global Bottom Bar — compact icon strip ─────────────────────────── */}
        <div
          data-bottombar
          class="shrink-0 flex items-center justify-between border-t border-[var(--border)] bg-[var(--bg)]"
          style="height:18px; padding: 0 8px;"
        >
          {/* Left: quick-access icons */}
          <div class="flex items-center" style="gap:2px;">
            <a href="/portal/comms/messages" title="Chats" class="flex items-center justify-center rounded hover:bg-[var(--surface)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]" style="width:22px;height:16px;">
              <span class="material-symbols-outlined" style="font-size:12px;color:#2dd4bf;">chat</span>
            </a>
            <a href="/portal/crm/contacts" title="Contacts" class="flex items-center justify-center rounded hover:bg-[var(--surface)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]" style="width:22px;height:16px;">
              <span class="material-symbols-outlined" style="font-size:12px;color:#a78bfa;">contacts</span>
            </a>
            <a href="/portal/activities/tasks" title="Tasks" class="flex items-center justify-center rounded hover:bg-[var(--surface)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]" style="width:22px;height:16px;">
              <span class="material-symbols-outlined" style="font-size:12px;color:#fb923c;">task_alt</span>
            </a>
            <a href="/portal/crm/deals" title="Deals" class="flex items-center justify-center rounded hover:bg-[var(--surface)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]" style="width:22px;height:16px;">
              <span class="material-symbols-outlined" style="font-size:12px;color:#a78bfa;">monetization_on</span>
            </a>
            <a href="/portal/activity" title="Activity" class="flex items-center justify-center rounded hover:bg-[var(--surface)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]" style="width:22px;height:16px;">
              <span class="material-symbols-outlined" style="font-size:12px;">history</span>
            </a>
          </div>

          {/* Center: status */}
          <div class="flex items-center" style="gap:3px;">
            <span class="material-symbols-outlined" style="font-size:8px;color:#34d399;">circle</span>
            <span style="font-size:10px;color:var(--text-muted);">Connected</span>
          </div>

          {/* Right: utility icons */}
          <div class="flex items-center" style="gap:2px;">
            <a href="/portal/settings" title="Settings" class="flex items-center justify-center rounded hover:bg-[var(--surface)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]" style="width:22px;height:16px;">
              <span class="material-symbols-outlined" style="font-size:12px;">settings</span>
            </a>
            <a href="/" title="Help" class="flex items-center justify-center rounded hover:bg-[var(--surface)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]" style="width:22px;height:16px;">
              <span class="material-symbols-outlined" style="font-size:12px;">help</span>
            </a>
          </div>
        </div>

        {/* ── Profile Slideout Backdrop ─────────────────────────────────────── */}
        <div
          x-show="profileOpen"
          x-cloak
          x-on:click="profileOpen = false"
          x-transition:enter="transition-opacity duration-200"
          x-transition:enter-start="opacity-0"
          x-transition:enter-end="opacity-100"
          x-transition:leave="transition-opacity duration-200"
          x-transition:leave-start="opacity-100"
          x-transition:leave-end="opacity-0"
          style="position:fixed; inset:0; z-index:40; background:rgba(0,0,0,0.4);"
        />

        {/* ── Profile Slideout Panel ────────────────────────────────────────── */}
        <div
          x-show="profileOpen"
          x-cloak
          x-transition:enter="transition-transform duration-250 ease-out"
          x-transition:enter-start="translate-x-full"
          x-transition:enter-end="translate-x-0"
          x-transition:leave="transition-transform duration-200 ease-in"
          x-transition:leave-start="translate-x-0"
          x-transition:leave-end="translate-x-full"
          class="flex flex-col shadow-2xl border-l border-[var(--border)] bg-[var(--bg)]"
          style="position:fixed; top:0; right:0; bottom:0; width:272px; z-index:50; overflow-y:auto;"
        >

          {/* ── Panel header (gradient) ───────────────────────────────────── */}
          <div class="relative flex-shrink-0 px-4 pt-4 pb-3" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
            {/* Close button — top right */}
            <button
              x-on:click="profileOpen = false"
              class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white transition-colors"
              style="z-index:1;"
            >
              <span class="material-symbols-outlined" style="font-size:14px;line-height:1;">close</span>
            </button>

            {/* Avatar + info — leave room for close button */}
            <div class="flex items-center gap-3 pr-8">
              {/* Circular avatar — overflow-hidden clips the bg to circle */}
              <div
                class="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-white text-sm font-bold"
                style="background:rgba(255,255,255,0.25); box-shadow:0 0 0 2px rgba(255,255,255,0.3);"
              >
                {initials}
              </div>
              <div class="min-w-0">
                <h2 class="text-white font-semibold text-sm leading-tight truncate">{user.name}</h2>
                {userId && (
                  <p class="text-[10px] mt-0.5 font-mono" style="color:rgba(255,255,255,0.6);">ID: {userId}</p>
                )}
              </div>
            </div>

            {/* Org badge */}
            <div class="mt-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5" style="background:rgba(255,255,255,0.12);">
              <span class="material-symbols-outlined" style="font-size:11px;color:rgba(255,255,255,0.7);">corporate_fare</span>
              <span class="text-[10px] font-medium uppercase tracking-wide" style="color:rgba(255,255,255,0.85);">{user.orgSlug}</span>
            </div>
          </div>

          {/* ── Mode ─────────────────────────────────────────────────────────── */}
          <div class="px-3 py-3 border-b border-[var(--border)]">
            <p class="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Mode</p>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                x-on:click="applyTheme('light')"
                x-bind:class="theme === 'light' ? 'bg-[var(--accent)] text-white border-transparent' : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)]/50'"
                class="flex flex-col items-center gap-1 py-1.5 rounded-md text-[11px] font-medium border transition-all"
              >
                <span class="material-symbols-outlined" style="font-size:16px;">light_mode</span>
                Day
              </button>
              <button
                x-on:click="applyTheme('dark')"
                x-bind:class="theme === 'dark' ? 'bg-[var(--accent)] text-white border-transparent' : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)]/50'"
                class="flex flex-col items-center gap-1 py-1.5 rounded-md text-[11px] font-medium border transition-all"
              >
                <span class="material-symbols-outlined" style="font-size:16px;">dark_mode</span>
                Night
              </button>
              <button
                x-on:click="applyTheme('auto')"
                x-bind:class="theme === 'auto' ? 'bg-[var(--accent)] text-white border-transparent' : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)]/50'"
                class="flex flex-col items-center gap-1 py-1.5 rounded-md text-[11px] font-medium border transition-all"
              >
                <span class="material-symbols-outlined" style="font-size:16px;">brightness_auto</span>
                Auto
              </button>
            </div>
          </div>

          {/* ── Accent colour ─────────────────────────────────────────────────── */}
          <div class="px-3 py-3 border-b border-[var(--border)]">
            <p class="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Accent Colour</p>
            <div class="flex flex-wrap gap-2">
              {ACCENT_COLORS.map(c => (
                <button
                  title={c.label}
                  x-on:click={`setAccent('${c.hex}')`}
                  x-bind:class={`accent === '${c.hex}' ? 'ring-2 ring-offset-1 ring-[var(--border)] scale-110' : 'hover:scale-110'`}
                  class="w-5 h-5 rounded-full transition-transform"
                  style={`background-color: ${c.hex};`}
                />
              ))}
            </div>
            <button
              x-on:click="setAccent(''); document.documentElement.style.removeProperty('--accent'); localStorage.removeItem('eqbis-accent');"
              class="mt-2 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] underline-offset-2 hover:underline transition-colors"
            >
              Reset to default
            </button>
          </div>

          {/* ── Plan card ─────────────────────────────────────────────────────── */}
          <div class="px-3 py-3 border-b border-[var(--border)]">
            <div class="rounded-lg border border-[var(--border)] overflow-hidden">
              <div class="flex items-center justify-between px-3 py-1.5 bg-[var(--surface)] border-b border-[var(--border)]">
                <span class="text-[10px] text-[var(--text-muted)]">Current plan</span>
                <a href="/portal/settings" class="text-[10px] font-medium hover:underline" style="color:var(--accent);">View plans</a>
              </div>
              <div class="flex items-center justify-between px-3 py-2 bg-[var(--bg)]">
                <div class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-blue-400" style="font-size:16px;">verified</span>
                  <span class="text-xs font-semibold text-[var(--text)]">Free Plan</span>
                </div>
                <a
                  href="/portal/settings"
                  class="text-[11px] font-semibold px-2.5 py-0.5 rounded transition-colors"
                  style="border:1px solid var(--accent); color:var(--accent);"
                  x-on:mouseenter="$el.style.background='var(--accent)'; $el.style.color='white';"
                  x-on:mouseleave="$el.style.background=''; $el.style.color='var(--accent)';"
                >
                  Upgrade
                </a>
              </div>
            </div>
          </div>

          {/* ── Need Help? ────────────────────────────────────────────────────── */}
          <div class="px-3 py-3 border-b border-[var(--border)]">
            <p class="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Need Help?</p>
            <div class="grid grid-cols-2 gap-1">
              <a href="/portal/comms/messages" class="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[var(--surface)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                <span class="material-symbols-outlined text-teal-400" style="font-size:13px;">chat</span>
                Chat with us
              </a>
              <a href="/" class="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[var(--surface)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                <span class="material-symbols-outlined text-blue-400" style="font-size:13px;">headset_mic</span>
                Talk with us
              </a>
              <a href="mailto:support@eqbis.com" class="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[var(--surface)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                <span class="material-symbols-outlined text-violet-400" style="font-size:13px;">mail</span>
                Write to us
              </a>
              <a href="/" class="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[var(--surface)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                <span class="material-symbols-outlined text-emerald-400" style="font-size:13px;">groups</span>
                Community
              </a>
              <a href="/" class="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[var(--surface)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                <span class="material-symbols-outlined text-orange-400" style="font-size:13px;">menu_book</span>
                Resources
              </a>
              <a href="/" class="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[var(--surface)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                <span class="material-symbols-outlined text-pink-400" style="font-size:13px;">rocket_launch</span>
                Take a tour
              </a>
            </div>
          </div>

          {/* ── News room ─────────────────────────────────────────────────────── */}
          <div class="px-3 py-3 border-b border-[var(--border)]">
            <p class="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">News Room</p>
            <div class="grid grid-cols-2 gap-1.5">
              <a href="/" class="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--border)] transition-colors">
                <span class="material-symbols-outlined text-amber-400" style="font-size:18px;">card_giftcard</span>
                <span class="text-xs text-[var(--text-muted)] hover:text-[var(--text)] leading-tight">What's New?</span>
              </a>
              <a href="/" class="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--border)] transition-colors">
                <span class="material-symbols-outlined text-emerald-400" style="font-size:18px;">group_add</span>
                <span class="text-xs text-[var(--text-muted)] hover:text-[var(--text)] leading-tight">Refer &amp; Earn</span>
              </a>
            </div>
          </div>

          {/* ── Mobile App ────────────────────────────────────────────────────── */}
          <div class="px-3 py-3 border-b border-[var(--border)]">
            <p class="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Mobile App</p>
            <div class="grid grid-cols-2 gap-1.5">
              <a href="/" class="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--border)] transition-colors">
                <span class="material-symbols-outlined text-blue-400" style="font-size:18px;">phone_iphone</span>
                <span class="text-xs text-[var(--text-muted)] hover:text-[var(--text)]">iOS / Android</span>
              </a>
              <a href="/" class="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--border)] transition-colors">
                <span class="material-symbols-outlined text-violet-400" style="font-size:18px;">analytics</span>
                <span class="text-xs text-[var(--text-muted)] hover:text-[var(--text)]">Analytics</span>
              </a>
            </div>
          </div>

          {/* ── Account actions (bottom row) ──────────────────────────────────── */}
          <div class="px-3 py-2.5 mt-auto flex items-center justify-between border-t border-[var(--border)]">
            <a
              href="/portal/organization"
              class="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-xs"
            >
              <span class="material-symbols-outlined" style="font-size:14px;">open_in_new</span>
              My Account
            </a>
            <form method="POST" action="/auth/logout">
              <button
                type="submit"
                class="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors text-xs"
              >
                <span class="material-symbols-outlined" style="font-size:14px;">power_settings_new</span>
                Sign Out
              </button>
            </form>
          </div>

        </div>{/* end profile panel */}

        {/* Alpine.js — CDN, pinned versions */}
        <script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.x.x/dist/cdn.min.js" />
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" />
      </body>
    </html>
  );
};
