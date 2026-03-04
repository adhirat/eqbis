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
</head>
<body class="min-h-screen flex items-center justify-center bg-[var(--bg)]">
  <div class="w-full max-w-sm px-8 py-10 space-y-6">

    <div class="text-center space-y-1">
      <img src="/images/logo.png" alt="EQBIS" class="w-12 h-12 mx-auto mb-4">
      <h1 class="text-2xl font-bold text-[var(--text)]">Verify your email</h1>
      <p class="text-sm text-[var(--text-muted)]">We sent a 6-digit code to <strong>${email}</strong></p>
    </div>

    ${error ? html`
    <div class="px-3 py-2 rounded border text-sm bg-red-500/10 border-red-500/30 text-red-400">
      ${error}
    </div>` : ''}

    ${success ? html`
    <div class="px-3 py-2 rounded border text-sm bg-green-500/10 border-green-500/30 text-green-400">
      ${success}
    </div>` : ''}

    <form method="POST" action="/auth/verify" class="space-y-4">
      ${raw(csrfField(csrfToken))}

      <div>
        <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Verification Code</label>
        <input name="code" type="text" required maxlength="6" pattern="[0-9]{6}"
          placeholder="123456"
          class="w-full h-12 text-center text-2xl tracking-[10px] font-mono rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]">
      </div>

      <button type="submit"
        class="w-full h-10 rounded bg-[var(--accent)] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
        Verify Account
      </button>
    </form>

    <div class="text-center space-y-4">
      <p class="text-xs text-[var(--text-muted)]">
        Didn't receive the code? 
        <form method="POST" action="/auth/resend-code" class="inline">
          ${raw(csrfField(csrfToken))}
          <button type="submit" class="text-[var(--accent)] hover:underline bg-transparent border-0 p-0 cursor-pointer text-xs">Resend Code</button>
        </form>
      </p>
      <a href="/auth/logout" class="block text-xs text-[var(--accent)] hover:underline">Sign out</a>
    </div>
  </div>
</body>
</html>`;

  return res.toString();
}
