/** @jsxImportSource hono/jsx */

import { renderToString } from 'hono/jsx/dom/server';
import { csrfField } from '../../middleware/csrf.js';

interface LoginPageProps {
  csrfToken: string;
  error?:    string;
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid:  'Invalid email or password.',
  inactive: 'Your account has been deactivated. Contact your administrator.',
  no_org:   'Your account is not linked to any organisation.',
};

export async function LoginPage({ csrfToken, error }: LoginPageProps): Promise<string> {
  const errorMsg = error ? (ERROR_MESSAGES[error] ?? error) : null;

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sign In — EQBIS</title>
  <link rel="icon" type="image/png" href="/images/logo.png">
  <link rel="apple-touch-icon" href="/images/logo.png">
  <link rel="stylesheet" href="/css/app.css">
</head>
<body class="min-h-screen flex items-center justify-center bg-[var(--bg)]">
  <div class="w-full max-w-sm px-8 py-10 space-y-6">

    <div class="text-center space-y-1">
      <a href="/"><img src="/images/logo.png" alt="EQBIS" class="w-12 h-12 mx-auto mb-4 hover:opacity-80 transition-opacity"></a>
      <h1 class="text-2xl font-bold text-[var(--text)]">Welcome back</h1>
      <p class="text-sm text-[var(--text-muted)]">Sign in to your portal</p>
    </div>

    ${errorMsg ? `
    <div class="flex items-center gap-2 px-3 py-2 rounded border text-sm bg-red-500/10 border-red-500/30 text-red-400">
      <span>&#9888;</span> ${errorMsg}
    </div>` : ''}

    <form method="POST" action="/auth/login" class="space-y-4">
      ${csrfField(csrfToken)}

      <div>
        <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Email</label>
        <input
          name="email" type="email" required autocomplete="email"
          placeholder="you@company.com"
          class="w-full h-10 px-3 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)]">
      </div>

      <div>
        <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Password</label>
        <input
          name="password" type="password" required autocomplete="current-password"
          minlength="8"
          placeholder="••••••••"
          class="w-full h-10 px-3 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)]">
      </div>

      <div class="flex items-center justify-end">
        <a href="/auth/forgot-password" class="text-xs text-[var(--accent)] hover:underline">
          Forgot password?
        </a>
      </div>

      <button type="submit"
        class="w-full h-10 rounded bg-[var(--accent)] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
        Sign In
      </button>
    </form>

    <p class="text-center text-sm text-[var(--text-muted)]">
      New to EQBIS?
      <a href="/auth/register" class="text-[var(--accent)] hover:underline">Create an account</a>
    </p>
  </div>
</body>
</html>`;
}
