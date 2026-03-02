/**
 * Resend API wrapper — transactional email.
 * Docs: https://resend.com/docs
 */

export interface EmailOptions {
  to:      string | string[];
  subject: string;
  html:    string;
  from?:   string; // defaults to no-reply@eqbis.com
  replyTo?: string;
}

const FROM_DEFAULT = 'EQBIS <no-reply@eqbis.com>';

export async function sendEmail(opts: EmailOptions, apiKey: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:     opts.from ?? FROM_DEFAULT,
      to:       Array.isArray(opts.to) ? opts.to : [opts.to],
      subject:  opts.subject,
      html:     opts.html,
      reply_to: opts.replyTo,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

// ── Helpers for common email types ──────────────────────────────────────────

export function inviteEmailHtml(opts: { name: string; orgName: string; link: string }): string {
  return `
    <h2>You've been invited to ${opts.orgName} on EQBIS</h2>
    <p>Hi ${opts.name},</p>
    <p>Click the link below to set your password and access the portal:</p>
    <p><a href="${opts.link}" style="background:#3b82f6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Accept Invitation</a></p>
    <p>This link expires in 48 hours.</p>
    <p>— The EQBIS Team</p>
  `;
}

export function passwordResetEmailHtml(opts: { link: string }): string {
  return `
    <h2>Reset your EQBIS password</h2>
    <p>Click the link below to set a new password. This link expires in 1 hour.</p>
    <p><a href="${opts.link}" style="background:#3b82f6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Reset Password</a></p>
    <p>If you did not request this, please ignore this email.</p>
    <p>— The EQBIS Team</p>
  `;
}

export function contactNotificationHtml(opts: {
  name: string; email: string; message: string; orgName: string;
}): string {
  return `
    <h2>New contact form submission — ${opts.orgName}</h2>
    <p><strong>From:</strong> ${opts.name} (${opts.email})</p>
    <p><strong>Message:</strong></p>
    <blockquote>${opts.message}</blockquote>
    <p>Log in to EQBIS to respond.</p>
  `;
}
