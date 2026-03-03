/** @jsxImportSource hono/jsx */
/**
 * EQBIS Marketing — Home / Landing Page
 * Supports dark & light themes via CSS custom properties + Alpine.js toggle.
 */

import type { FC } from 'hono/jsx';
import { renderToString } from 'hono/jsx/dom/server';

/* ── Feature cards data ─────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon:  'groups',
    title: 'HR & People',
    desc:  'Manage your team from hire to retire. Employees, timesheets, leave requests, and career postings — all in one place.',
    color: '#3b82f6',   // blue
    bg:    'rgba(59,130,246,0.08)',
  },
  {
    icon:  'receipt_long',
    title: 'Finance & Invoicing',
    desc:  'Create professional invoices, track receipts, and get a real-time view of your business finances.',
    color: '#22c55e',   // green
    bg:    'rgba(34,197,94,0.08)',
  },
  {
    icon:  'handshake',
    title: 'CRM & Clients',
    desc:  'Build lasting relationships. Track leads, manage client data, and never miss a follow-up.',
    color: '#f59e0b',   // amber
    bg:    'rgba(245,158,11,0.08)',
  },
  {
    icon:  'folder_kanban',
    title: 'Projects & Milestones',
    desc:  'Plan, track, and deliver projects on time. Milestones, comments, and progress — all visible.',
    color: '#8b5cf6',   // violet
    bg:    'rgba(139,92,246,0.08)',
  },
  {
    icon:  'support_agent',
    title: 'Support Tickets',
    desc:  'Resolve customer issues before they escalate. Track tickets, assign agents, and log every update.',
    color: '#ef4444',   // red
    bg:    'rgba(239,68,68,0.08)',
  },
  {
    icon:  'mark_email_unread',
    title: 'Communications',
    desc:  'Manage contact form messages and newsletter subscribers. Keep your audience engaged and informed.',
    color: '#06b6d4',   // cyan
    bg:    'rgba(6,182,212,0.08)',
  },
];

const PRICING = [
  {
    name:     'Starter',
    price:    'Free',
    period:   'forever',
    desc:     'Perfect for small teams getting started.',
    features: ['1 organisation', 'Up to 5 users', 'HR & Projects', 'Support tickets', 'Community support'],
    cta:      'Get started free',
    href:     '/auth/register',
    featured: false,
  },
  {
    name:     'Pro',
    price:    '$49',
    period:   'per month',
    desc:     'Everything you need to run a growing business.',
    features: ['3 organisations', 'Up to 25 users', 'All 6 modules', 'Custom roles & permissions', 'Priority support', 'Activity logs'],
    cta:      'Start free trial',
    href:     '/auth/register',
    featured: true,
  },
  {
    name:     'Enterprise',
    price:    'Custom',
    period:   'contact us',
    desc:     'Tailored for large organisations with unique needs.',
    features: ['Unlimited organisations', 'Unlimited users', 'All modules + white-label', 'Custom domain', 'Dedicated SLA', 'On-boarding support'],
    cta:      'Contact sales',
    href:     '/contact',
    featured: false,
  },
];

/* ── Check icon (reusable) ──────────────────────────────────────────────── */
const Check: FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:inline-block;flex-shrink:0;margin-top:2px">
    <circle cx="8" cy="8" r="7" fill="rgba(34,197,94,0.15)" />
    <path d="M5 8l2 2 4-4" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
);

/* ── Render function (called from route handler) ─────────────────────────── */
export function renderHomePage(contactSuccess = false): string {
  return '<!DOCTYPE html>' + renderToString(<HomePageInner contactSuccess={contactSuccess} />);
}

/* ── Main page component ─────────────────────────────────────────────────── */
const HomePageInner: FC<{ contactSuccess?: boolean }> = ({ contactSuccess }) => (
  <html
    lang="en"
    data-theme="dark"
    x-data={`{ theme: localStorage.getItem('eqbis-theme') || 'dark', mobileMenu: false }`}
    x-init="$el.setAttribute('data-theme', theme)"
  >
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>EQBIS — The Business Platform for Modern Teams</title>
      <meta name="description" content="HR, Finance, CRM, Projects, and Support — all unified in one powerful business platform." />
      {/* Sync theme before paint */}
      <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('eqbis-theme');if(t)document.documentElement.setAttribute('data-theme',t)})();` }} />
      <link rel="stylesheet" href="/css/app.css" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: `
        [x-cloak]{display:none!important}

        /* ── Marketing-specific tokens ── */
        .mkt-hero-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        /* ── Nav glass effect ── */
        .mkt-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          background: color-mix(in srgb, var(--bg) 85%, transparent);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          height: 64px;
          display: flex;
          align-items: center;
        }

        /* ── Gradient text ── */
        .mkt-gradient-text {
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Pricing card ── */
        .mkt-pricing-featured {
          background: linear-gradient(135deg,
            color-mix(in srgb, var(--accent) 12%, var(--surface)),
            color-mix(in srgb, var(--accent-2) 8%, var(--surface))
          );
          border-color: color-mix(in srgb, var(--accent) 50%, transparent);
          transform: scale(1.03);
        }

        /* ── Feature card hover ── */
        .mkt-feature-card {
          transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
        }
        .mkt-feature-card:hover {
          transform: translateY(-3px);
        }

        /* ── Section separator gradient ── */
        .mkt-separator {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border), transparent);
        }

        /* Hero badge */
        .mkt-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: color-mix(in srgb, var(--accent) 10%, var(--surface));
          border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
          border-radius: 9999px;
          padding: 4px 14px;
          font-size: 13px;
          color: var(--accent);
          font-weight: 500;
          margin-bottom: 24px;
        }

        /* CTA section glow */
        .mkt-cta-section {
          background: linear-gradient(135deg,
            color-mix(in srgb, var(--accent) 8%, var(--surface)),
            color-mix(in srgb, var(--accent-2) 5%, var(--surface))
          );
        }
      `}} />
    </head>

    <body style="background:var(--bg);color:var(--text);min-height:100vh;font-family:Inter,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;">

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav class="mkt-nav">
        <div style="max-width:1200px;margin:0 auto;padding:0 24px;width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;">

          {/* Brand */}
          <a href="/" style="display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0;">
            <img src="/images/logo.png" alt="EQBIS" style="width:32px;height:32px;" />
            <span style="font-weight:700;font-size:18px;color:var(--text);letter-spacing:-0.3px;">EQBIS</span>
          </a>

          {/* Desktop nav links */}
          <div style="display:flex;align-items:center;gap:32px;" class="hidden md:flex">
            <a href="#features" style="font-size:14px;color:var(--text-muted);text-decoration:none;transition:color .15s;" class="hover:text-[var(--text)]">Features</a>
            <a href="#pricing"  style="font-size:14px;color:var(--text-muted);text-decoration:none;transition:color .15s;" class="hover:text-[var(--text)]">Pricing</a>
            <a href="#contact"  style="font-size:14px;color:var(--text-muted);text-decoration:none;transition:color .15s;" class="hover:text-[var(--text)]">Contact</a>
          </div>

          {/* Actions */}
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
            {/* Theme toggle */}
            <button
              x-on:click="theme = theme === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('eqbis-theme', theme)"
              title="Toggle theme"
              style="width:36px;height:36px;border-radius:8px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-muted);transition:background .15s,color .15s;"
              class="hover:bg-[var(--surface)] hover:text-[var(--text)]"
            >
              <span class="material-symbols-outlined" style="font-size:18px;" x-text="theme === 'dark' ? 'light_mode' : 'dark_mode'">light_mode</span>
            </button>

            <a
              href="/auth/login"
              style="font-size:14px;font-weight:500;color:var(--text-muted);text-decoration:none;padding:6px 14px;border-radius:8px;transition:background .15s,color .15s;"
              class="hover:bg-[var(--surface)] hover:text-[var(--text)]"
            >Sign In</a>

            <a
              href="/auth/register"
              style="font-size:14px;font-weight:600;color:#fff;text-decoration:none;padding:8px 18px;border-radius:8px;background:var(--accent);transition:opacity .15s;"
              class="hover:opacity-90"
            >Get Started</a>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style="position:relative;overflow:hidden;padding:140px 24px 100px;text-align:center;">
        {/* Background glow orbs */}
        <div class="mkt-hero-glow" style="width:700px;height:700px;top:-200px;left:50%;transform:translateX(-50%);background:radial-gradient(circle,rgba(59,130,246,0.18) 0%,transparent 65%);" />
        <div class="mkt-hero-glow" style="width:400px;height:400px;top:80px;right:-100px;background:radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%);" />
        <div class="mkt-hero-glow" style="width:300px;height:300px;top:200px;left:-80px;background:radial-gradient(circle,rgba(59,130,246,0.1) 0%,transparent 70%);" />

        <div style="position:relative;z-index:1;max-width:800px;margin:0 auto;">
          {/* Badge */}
          <div class="mkt-badge">
            <span class="material-symbols-outlined" style="font-size:15px;">rocket_launch</span>
            <span>All-in-one business platform for modern teams</span>
          </div>

          {/* Headline */}
          <h1 style="font-size:clamp(40px,6vw,72px);font-weight:800;line-height:1.05;letter-spacing:-1.5px;color:var(--text);margin:0 0 24px;">
            One platform for<br />
            <span class="mkt-gradient-text">every part of</span><br />
            your business
          </h1>

          {/* Sub-headline */}
          <p style="font-size:clamp(16px,2vw,20px);color:var(--text-muted);line-height:1.6;max-width:560px;margin:0 auto 40px;">
            HR, Finance, CRM, Projects, and Support — beautifully unified so your team can focus on what actually matters.
          </p>

          {/* CTAs */}
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <a
              href="/auth/register"
              style="display:inline-flex;align-items:center;gap:8px;height:48px;padding:0 28px;background:var(--accent);color:#fff;font-weight:600;font-size:15px;border-radius:10px;text-decoration:none;transition:opacity .15s;"
              class="hover:opacity-90"
            >
              <span class="material-symbols-outlined" style="font-size:18px;">rocket_launch</span>
              Get started free
            </a>
            <a
              href="/auth/login"
              style="display:inline-flex;align-items:center;gap:8px;height:48px;padding:0 28px;background:transparent;color:var(--text);font-weight:600;font-size:15px;border-radius:10px;text-decoration:none;border:1px solid var(--border);transition:background .15s,border-color .15s;"
              class="hover:bg-[var(--surface)]"
            >
              Sign in to dashboard
              <span class="material-symbols-outlined" style="font-size:18px;">arrow_forward</span>
            </a>
          </div>

          {/* Social proof hint */}
          <p style="margin-top:32px;font-size:13px;color:var(--text-muted);">
            Trusted by growing teams worldwide · No credit card required
          </p>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────── */}
      <div class="mkt-separator" />
      <section style="padding:40px 24px;background:color-mix(in srgb,var(--surface) 50%,transparent);">
        <div style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:32px;text-align:center;">
          {[
            { num: '10K+',  label: 'Businesses powered' },
            { num: '99.9%', label: 'Uptime SLA' },
            { num: '6',     label: 'Integrated modules' },
          ].map(s => (
            <div>
              <div style="font-size:clamp(28px,4vw,42px);font-weight:800;color:var(--text);letter-spacing:-1px;">{s.num}</div>
              <div style="font-size:14px;color:var(--text-muted);margin-top:4px;">{s.label}</div>
            </div>
          ))}
        </div>
      </section>
      <div class="mkt-separator" />

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" style="padding:96px 24px;">
        <div style="max-width:1200px;margin:0 auto;">
          {/* Section header */}
          <div style="text-align:center;margin-bottom:64px;">
            <p style="font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--accent);margin-bottom:12px;">
              Everything you need
            </p>
            <h2 style="font-size:clamp(28px,4vw,48px);font-weight:800;color:var(--text);letter-spacing:-1px;margin-bottom:16px;line-height:1.1;">
              Built for every corner<br />of your organisation
            </h2>
            <p style="font-size:16px;color:var(--text-muted);max-width:500px;margin:0 auto;line-height:1.6;">
              Six powerful modules that work together seamlessly — no integrations, no duct tape.
            </p>
          </div>

          {/* Feature grid */}
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px;">
            {FEATURES.map(f => (
              <div
                class="mkt-feature-card"
                style={`background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:28px;position:relative;overflow:hidden;`}
              >
                {/* Icon */}
                <div style={`width:48px;height:48px;border-radius:12px;background:${f.bg};border:1px solid color-mix(in srgb,${f.color} 25%,transparent);display:flex;align-items:center;justify-content:center;margin-bottom:20px;`}>
                  <span class="material-symbols-outlined" style={`font-size:22px;color:${f.color};`}>{f.icon}</span>
                </div>
                <h3 style="font-size:17px;font-weight:700;color:var(--text);margin-bottom:10px;">{f.title}</h3>
                <p style="font-size:14px;color:var(--text-muted);line-height:1.65;">{f.desc}</p>
                {/* Corner accent */}
                <div style={`position:absolute;top:0;right:0;width:80px;height:80px;border-radius:0 16px 0 100%;background:${f.bg};opacity:0.6;`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div class="mkt-separator" />

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section style="padding:96px 24px;text-align:center;">
        <div style="max-width:900px;margin:0 auto;">
          <p style="font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--accent-2);margin-bottom:12px;">
            Simple to adopt
          </p>
          <h2 style="font-size:clamp(28px,4vw,44px);font-weight:800;color:var(--text);letter-spacing:-1px;margin-bottom:48px;">
            Up and running in minutes
          </h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:32px;">
            {[
              { step:'01', icon:'person_add', title:'Create your account', desc:'Sign up free, set up your organisation profile and logo.' },
              { step:'02', icon:'group',      title:'Invite your team',    desc:'Add employees, assign roles, and set granular permissions.' },
              { step:'03', icon:'tune',       title:'Configure modules',   desc:'Enable the modules you need — HR, Finance, Projects and more.' },
              { step:'04', icon:'bolt',       title:'Start working',       desc:'Your team logs in and gets to work. Everything is ready.' },
            ].map(s => (
              <div style="display:flex;flex-direction:column;align-items:center;gap:14px;">
                <div style="position:relative;">
                  <div style="width:56px;height:56px;border-radius:50%;background:color-mix(in srgb,var(--accent) 10%,var(--surface));border:1px solid color-mix(in srgb,var(--accent) 25%,transparent);display:flex;align-items:center;justify-content:center;">
                    <span class="material-symbols-outlined" style="font-size:22px;color:var(--accent);">{s.icon}</span>
                  </div>
                  <div style="position:absolute;top:-4px;right:-4px;width:20px;height:20px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;">{s.step}</div>
                </div>
                <h3 style="font-size:15px;font-weight:700;color:var(--text);">{s.title}</h3>
                <p style="font-size:13px;color:var(--text-muted);line-height:1.6;">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div class="mkt-separator" />

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" style="padding:96px 24px;">
        <div style="max-width:1100px;margin:0 auto;">
          <div style="text-align:center;margin-bottom:64px;">
            <p style="font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--accent);margin-bottom:12px;">
              Simple pricing
            </p>
            <h2 style="font-size:clamp(28px,4vw,44px);font-weight:800;color:var(--text);letter-spacing:-1px;margin-bottom:12px;">
              Start free. Scale as you grow.
            </h2>
            <p style="font-size:15px;color:var(--text-muted);">No hidden fees. Cancel anytime.</p>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;align-items:start;">
            {PRICING.map(plan => (
              <div
                class={plan.featured ? 'mkt-pricing-featured' : ''}
                style={`border-radius:16px;border:1px solid var(--border);background:var(--surface);padding:32px;position:relative;${plan.featured ? 'box-shadow:0 0 40px rgba(59,130,246,0.15);' : ''}`}
              >
                {plan.featured && (
                  <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--accent);color:#fff;font-size:11px;font-weight:700;letter-spacing:1px;padding:4px 14px;border-radius:9999px;text-transform:uppercase;">
                    Most popular
                  </div>
                )}
                <div style="margin-bottom:8px;font-size:13px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;color:var(--text-muted);">{plan.name}</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:8px;">
                  <span style="font-size:40px;font-weight:800;color:var(--text);letter-spacing:-1px;">{plan.price}</span>
                  <span style="font-size:13px;color:var(--text-muted);">{plan.period}</span>
                </div>
                <p style="font-size:14px;color:var(--text-muted);margin-bottom:24px;line-height:1.5;">{plan.desc}</p>
                <a
                  href={plan.href}
                  style={`display:flex;align-items:center;justify-content:center;height:44px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;transition:opacity .15s,background .15s;margin-bottom:28px;${
                    plan.featured
                      ? 'background:var(--accent);color:#fff;'
                      : 'background:var(--bg);color:var(--text);border:1px solid var(--border);'
                  }`}
                  class="hover:opacity-90"
                >{plan.cta}</a>
                <div style="display:flex;flex-direction:column;gap:10px;">
                  {plan.features.map(f => (
                    <div style="display:flex;align-items:flex-start;gap:10px;">
                      <Check />
                      <span style="font-size:13px;color:var(--text-muted);">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div class="mkt-separator" />

      {/* ── CTA banner ──────────────────────────────────────────────────── */}
      <section class="mkt-cta-section" style="padding:80px 24px;text-align:center;">
        <div style="max-width:700px;margin:0 auto;">
          <h2 style="font-size:clamp(28px,4vw,44px);font-weight:800;color:var(--text);letter-spacing:-1px;margin-bottom:16px;">
            Ready to transform<br />your business?
          </h2>
          <p style="font-size:16px;color:var(--text-muted);margin-bottom:36px;line-height:1.6;">
            Join thousands of businesses already using EQBIS to manage their operations more efficiently.
          </p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <a
              href="/auth/register"
              style="display:inline-flex;align-items:center;gap:8px;height:48px;padding:0 28px;background:var(--accent);color:#fff;font-weight:600;font-size:15px;border-radius:10px;text-decoration:none;transition:opacity .15s;"
              class="hover:opacity-90"
            >
              <span class="material-symbols-outlined" style="font-size:18px;">rocket_launch</span>
              Start for free
            </a>
            <a
              href="#contact"
              style="display:inline-flex;align-items:center;height:48px;padding:0 28px;color:var(--text);font-weight:600;font-size:15px;border-radius:10px;text-decoration:none;border:1px solid var(--border);transition:background .15s;"
              class="hover:bg-[var(--surface)]"
            >Talk to sales</a>
          </div>
        </div>
      </section>

      {/* ── Contact section ─────────────────────────────────────────────── */}
      <section id="contact" style="padding:80px 24px;">
        <div style="max-width:560px;margin:0 auto;">
          <div style="text-align:center;margin-bottom:40px;">
            <p style="font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--accent);margin-bottom:12px;">Contact</p>
            <h2 style="font-size:clamp(24px,3vw,36px);font-weight:800;color:var(--text);letter-spacing:-0.5px;">Get in touch</h2>
          </div>

          {contactSuccess && (
            <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:10px;padding:14px 18px;display:flex;align-items:center;gap:10px;margin-bottom:24px;">
              <span class="material-symbols-outlined" style="font-size:18px;color:#22c55e;">check_circle</span>
              <span style="font-size:14px;color:#22c55e;">Message sent! We'll get back to you shortly.</span>
            </div>
          )}

          <form
            method="post"
            action="/contact"
            style="display:flex;flex-direction:column;gap:16px;"
          >
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="display:block;font-size:12px;font-weight:500;color:var(--text-muted);margin-bottom:6px;">Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Jane Smith"
                  style="width:100%;height:40px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:0 12px;font-size:14px;color:var(--text);outline:none;transition:border-color .15s;"
                  class="focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label style="display:block;font-size:12px;font-weight:500;color:var(--text-muted);margin-bottom:6px;">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="jane@company.com"
                  style="width:100%;height:40px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:0 12px;font-size:14px;color:var(--text);outline:none;transition:border-color .15s;"
                  class="focus:border-[var(--accent)]"
                />
              </div>
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:500;color:var(--text-muted);margin-bottom:6px;">Company</label>
              <input
                type="text"
                name="company"
                placeholder="Acme Corp"
                style="width:100%;height:40px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:0 12px;font-size:14px;color:var(--text);outline:none;transition:border-color .15s;"
                class="focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:500;color:var(--text-muted);margin-bottom:6px;">Message *</label>
              <textarea
                name="message"
                required
                rows={4}
                placeholder="How can we help?"
                style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:14px;color:var(--text);outline:none;resize:vertical;line-height:1.5;transition:border-color .15s;"
                class="focus:border-[var(--accent)]"
              />
            </div>
            <button
              type="submit"
              style="height:44px;background:var(--accent);color:#fff;font-size:14px;font-weight:600;border:none;border-radius:8px;cursor:pointer;transition:opacity .15s;"
              class="hover:opacity-90"
            >Send message</button>
          </form>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div class="mkt-separator" />
      <footer style="padding:40px 24px;background:var(--bg);">
        <div style="max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:24px;align-items:center;text-align:center;">
          {/* Brand */}
          <a href="/" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
            <img src="/images/logo.png" alt="EQBIS" style="width:28px;height:28px;" />
            <span style="font-weight:700;font-size:16px;color:var(--text);">EQBIS</span>
          </a>

          {/* Footer links */}
          <div style="display:flex;gap:24px;flex-wrap:wrap;justify-content:center;">
            {[
              { label:'Features', href:'#features' },
              { label:'Pricing',  href:'#pricing' },
              { label:'Contact',  href:'#contact' },
              { label:'Sign In',  href:'/auth/login' },
              { label:'Register', href:'/auth/register' },
            ].map(l => (
              <a href={l.href} style="font-size:13px;color:var(--text-muted);text-decoration:none;transition:color .15s;" class="hover:text-[var(--text)]">{l.label}</a>
            ))}
          </div>

          {/* Copyright */}
          <p style="font-size:12px;color:var(--text-muted);">
            © {new Date().getFullYear()} EQBIS. Built on Cloudflare Workers. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Alpine.js */}
      <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" />
    </body>
  </html>
);
