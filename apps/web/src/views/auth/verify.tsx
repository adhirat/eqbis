/** @jsxImportSource hono/jsx */

import { html, raw } from 'hono/html';
import { csrfField } from '../../middleware/csrf.js';

interface VerifyPageProps {
  csrfToken: string;
  email:     string;
  error?:    string;
  success?:  string;
}

export async function VerifyPage({ csrfToken, email, error, success }: VerifyPageProps): Promise<string> {
  const res = html`<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verify Account — EQBIS</title>
  <link rel="icon" type="image/png" href="/images/logo.png">
  <link rel="stylesheet" href="/css/app.css">
  <style>
    /* Gradient backdrop for glassmorphism */
    body {
      background: radial-gradient(circle at top left, var(--accent) -30%, transparent 40%),
                  radial-gradient(circle at bottom right, var(--accent) -30%, transparent 40%),
                  var(--bg);
    }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">
  <div class="w-full max-w-md bg-[var(--surface)]/50 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl p-8 space-y-8">

    <div class="text-center space-y-2">
      <div class="w-16 h-16 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
        <img src="/images/logo.png" alt="EQBIS" class="w-10 h-10">
      </div>
      <h1 class="text-2xl font-bold text-[var(--text)] tracking-tight">Verify your account</h1>
      <p class="text-sm text-[var(--text-muted)] leading-relaxed">
        We've sent a verification link to<br/>
        <strong class="text-[var(--text)] font-semibold">${email}</strong>
      </p>
    </div>

    ${error ? html`
    <div class="px-4 py-3 rounded-xl border text-sm bg-red-500/10 border-red-500/20 text-red-400 flex items-center gap-2">
      <span class="material-symbols-outlined text-[18px]">error</span>
       ${error}
    </div>` : ''}

    ${success ? html`
    <div class="px-4 py-3 rounded-xl border text-sm bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex items-center gap-2">
      <span class="material-symbols-outlined text-[18px]">check_circle</span>
      ${success}
    </div>` : ''}

    <div class="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex gap-3">
      <span class="material-symbols-outlined text-amber-500 shrink-0" style="font-size:20px;">info</span>
      <div class="space-y-1">
        <p class="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">Action Required</p>
        <p class="text-xs text-[var(--text-muted)] leading-relaxed">
          Please check your inbox and click the verification link. The link is valid for <strong>30 minutes</strong>.
          Unverified accounts are subject to automatic deletion.
        </p>
      </div>
    </div>

    <div class="space-y-4 pt-2">
      <form method="POST" action="/auth/resend-link">
        ${raw(csrfField(csrfToken))}
        <button type="submit"
          class="w-full h-11 rounded-xl bg-[var(--accent)] text-white font-bold text-sm shadow-lg shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-[18px]">send</span>
          Resend Verification Link
        </button>
      </form>
      
      <div class="text-center">
        <a href="/auth/logout" class="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
          <span class="material-symbols-outlined text-[14px]">logout</span>
          Sign out and use a different email
        </a>
      </div>
    </div>

    <div class="pt-4 text-center">
       <p class="text-[10px] text-[var(--text-muted)] uppercase tracking-widest leading-loose">
         Secure authentication powered by<br/>
         <span class="font-bold text-[var(--text)]">EQBIS Shield</span>
       </p>
    </div>

  </div>

  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200">
</body>
</html>`;

  return res.toString();
}
