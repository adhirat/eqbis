/**
 * Eqbis Portal — minimal client-side JS.
 * Alpine.js handles most interactivity; this file handles:
 *   1. Theme persistence (dark/light toggle)
 *   2. Sidebar collapsed state persistence
 *   3. Org switcher fetch (AJAX org switch without full page load)
 *   4. Toast / flash message auto-dismiss
 */

'use strict';

// ── Theme ─────────────────────────────────────────────────────────────────────

const THEME_KEY   = 'eqbis-theme';
const DEFAULT_THEME = 'dark';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') ?? DEFAULT_THEME;
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// Apply saved theme before first paint (injected via <script> in layout head)
(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) ?? DEFAULT_THEME;
  applyTheme(saved);
})();

// Expose for Alpine x-on:click
window.toggleTheme = toggleTheme;

// ── Sidebar collapse ──────────────────────────────────────────────────────────

const SIDEBAR_KEY = 'eqbis-sidebar';

function getSidebarCollapsed() {
  return localStorage.getItem(SIDEBAR_KEY) === 'true';
}

function toggleSidebar() {
  const next = !getSidebarCollapsed();
  localStorage.setItem(SIDEBAR_KEY, String(next));
  applySidebar(next);
}

function applySidebar(collapsed) {
  const sidebar = document.getElementById('portal-sidebar');
  const main    = document.getElementById('portal-main');
  if (!sidebar || !main) return;

  if (collapsed) {
    sidebar.classList.add('collapsed');
    main.classList.add('sidebar-collapsed');
  } else {
    sidebar.classList.remove('collapsed');
    main.classList.remove('sidebar-collapsed');
  }
}

window.toggleSidebar = toggleSidebar;

// ── Org switcher ──────────────────────────────────────────────────────────────

/**
 * Switch active org via AJAX POST to /auth/switch-org.
 * On success, the server issues a new JWT cookie and returns JSON.
 * We then reload the page so the new org context loads.
 */
async function switchOrg(orgId) {
  try {
    const res = await fetch('/auth/switch-org', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify({ orgId }),
      credentials: 'same-origin',
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error('Org switch failed:', data.error ?? res.statusText);
      return;
    }

    // Reload to apply new org context from fresh JWT cookie
    window.location.href = '/portal';
  } catch (err) {
    console.error('Org switch error:', err);
  }
}

window.switchOrg = switchOrg;

// ── Toast / flash messages ────────────────────────────────────────────────────

function dismissToast(el) {
  el.style.opacity = '0';
  el.style.transform = 'translateY(-8px)';
  setTimeout(() => el.remove(), 200);
}

function initToasts() {
  const toasts = document.querySelectorAll('[data-toast]');
  toasts.forEach((toast) => {
    toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    // Auto-dismiss after 4 seconds
    setTimeout(() => dismissToast(toast), 4000);
    // Manual dismiss on click
    toast.addEventListener('click', () => dismissToast(toast));
  });
}

// ── Invoice line items (dynamic add/remove) ───────────────────────────────────

let itemCount = 0;

function addInvoiceItem() {
  const container = document.getElementById('invoice-items');
  if (!container) return;

  const idx = itemCount++;
  const row = document.createElement('div');
  row.className = 'grid grid-cols-12 gap-2 items-start';
  row.innerHTML = `
    <div class="col-span-5">
      <input name="items[${idx}][description]" required placeholder="Description"
        class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
    </div>
    <div class="col-span-2">
      <input name="items[${idx}][quantity]" type="number" step="0.01" min="0.01" value="1" placeholder="Qty"
        class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] text-right"
        oninput="calcItemTotal(this)">
    </div>
    <div class="col-span-3">
      <input name="items[${idx}][unitPrice]" type="number" step="0.01" min="0" value="0" placeholder="Unit price"
        class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] text-right"
        oninput="calcItemTotal(this)">
    </div>
    <div class="col-span-1 flex items-center h-8 px-2 text-sm text-[var(--text-muted)] justify-end item-total">$0.00</div>
    <div class="col-span-1 flex items-center h-8 justify-center">
      <button type="button" onclick="removeInvoiceItem(this)"
        class="w-6 h-6 rounded text-[var(--text-muted)] hover:text-[var(--destructive)] hover:bg-red-500/10 flex items-center justify-center text-lg leading-none">×</button>
    </div>`;
  container.appendChild(row);
  calcInvoiceTotals();
}

function removeInvoiceItem(btn) {
  const row = btn.closest('.grid');
  if (row) {
    row.remove();
    calcInvoiceTotals();
  }
}

function calcItemTotal(input) {
  const row = input.closest('.grid');
  if (!row) return;

  const qty   = parseFloat(row.querySelector('[name*="[quantity]"]')?.value ?? '0');
  const price = parseFloat(row.querySelector('[name*="[unitPrice]"]')?.value ?? '0');
  const total = isNaN(qty) || isNaN(price) ? 0 : qty * price;

  const totalEl = row.querySelector('.item-total');
  if (totalEl) totalEl.textContent = formatCurrency(total);

  calcInvoiceTotals();
}

function calcInvoiceTotals() {
  const rows = document.querySelectorAll('#invoice-items .grid');
  let subtotal = 0;

  rows.forEach((row) => {
    const qty   = parseFloat(row.querySelector('[name*="[quantity]"]')?.value ?? '0') || 0;
    const price = parseFloat(row.querySelector('[name*="[unitPrice]"]')?.value ?? '0') || 0;
    subtotal += qty * price;
  });

  const taxRateEl = document.getElementById('tax-rate');
  const taxRate   = taxRateEl ? parseFloat(taxRateEl.value) || 0 : 0;
  const taxAmount = subtotal * taxRate / 100;
  const total     = subtotal + taxAmount;

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = formatCurrency(val);
  };

  setEl('invoice-subtotal', subtotal);
  setEl('invoice-tax',      taxAmount);
  setEl('invoice-total',    total);
}

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

window.addInvoiceItem     = addInvoiceItem;
window.removeInvoiceItem  = removeInvoiceItem;
window.calcItemTotal      = calcItemTotal;
window.calcInvoiceTotals  = calcInvoiceTotals;

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  applySidebar(getSidebarCollapsed());
  initToasts();
});
