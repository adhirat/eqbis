/** @jsxImportSource hono/jsx */

import { csrfField } from '../../middleware/csrf.js';

interface SignupPageProps {
  csrfToken: string;
  error?:    string;
}

const ERROR_MESSAGES: Record<string, string> = {
  email_taken: 'This email address is already registered.',
  slug_taken:  'That organisation URL is already in use. Please choose another.',
};

export async function SignupPage({ csrfToken, error }: SignupPageProps): Promise<string> {
  const errorMsg = error ? (ERROR_MESSAGES[error] ?? 'An error occurred. Please try again.') : null;

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Create Account — EQBIS</title>
  <link rel="stylesheet" href="/css/app.css">
</head>
<body class="min-h-screen flex items-center justify-center bg-[var(--bg)]">
  <div class="w-full max-w-sm px-8 py-10 space-y-6">

    <div class="text-center space-y-1">
      <a href="/"><img src="/images/logo.png" alt="EQBIS" class="w-12 h-12 mx-auto mb-4 hover:opacity-80 transition-opacity"></a>
      <h1 class="text-2xl font-bold text-[var(--text)]">Create your account</h1>
      <p class="text-sm text-[var(--text-muted)]">Set up your organisation on EQBIS</p>
    </div>

    ${errorMsg ? `
    <div class="flex items-center gap-2 px-3 py-2 rounded border text-sm bg-red-500/10 border-red-500/30 text-red-400">
      <span>&#9888;</span> ${errorMsg}
    </div>` : ''}

    <form method="POST" action="/auth/register" class="space-y-4">
      ${csrfField(csrfToken)}

      <div>
        <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Full Name</label>
        <input name="fullName" type="text" required autocomplete="name"
          placeholder="Jane Smith"
          class="w-full h-10 px-3 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)]">
      </div>

      <div>
        <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Work Email</label>
        <input name="email" type="email" required autocomplete="email"
          placeholder="you@company.com"
          class="w-full h-10 px-3 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)]">
      </div>

      <div>
        <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Organisation Name</label>
        <input name="orgName" type="text" required
          placeholder="Acme Corp"
          class="w-full h-10 px-3 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)]">
      </div>

      <div>
        <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Portal URL</label>
        <div class="flex items-center rounded border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <input name="orgSlug" type="text" required
            placeholder="acme"
            pattern="[a-z0-9-]+"
            class="flex-1 h-10 px-3 text-[var(--text)] text-sm focus:outline-none bg-transparent">
          <span class="px-3 text-xs text-[var(--text-muted)] bg-[var(--bg)] border-l border-[var(--border)] h-full flex items-center">
            .eqbis.com
          </span>
        </div>
        <p class="text-[10px] text-[var(--text-muted)] mt-1">Lowercase letters, numbers, and hyphens only</p>
      </div>

      <div>
        <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Password</label>
        <input name="password" type="password" required autocomplete="new-password"
          placeholder="Minimum 8 characters"
          class="w-full h-10 px-3 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)]">
      </div>

      <button type="submit"
        class="w-full h-10 rounded bg-[var(--accent)] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
        Create Account
      </button>
    </form>

    <p class="text-center text-sm text-[var(--text-muted)]">
      Already have an account?
      <a href="/auth/login" class="text-[var(--accent)] hover:underline">Sign in</a>
    </p>
  </div>
</body>
</html>`;
}
