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

export async function sendEmail(opts: EmailOptions, env: { RESEND_API_KEY?: string; EMAIL?: any; ENVIRONMENT?: string }): Promise<void> {
  const from = opts.from ?? FROM_DEFAULT;
  const toArr = Array.isArray(opts.to) ? opts.to : [opts.to];
  const isLocal = env.ENVIRONMENT === 'local';

  if (isLocal) {
    console.log('---------------------------------------------------------');
    console.log('[LOCAL EMAIL] To:', toArr.join(', '));
    console.log('[LOCAL EMAIL] Subject:', opts.subject);
    console.log('[LOCAL EMAIL] HTML preview (first 100 chars):', opts.html.substring(0, 100) + '...');
    console.log('---------------------------------------------------------');
  }

  // 1. Try Cloudflare Workers Email
  if (env.EMAIL) {
    try {
      await env.EMAIL.send({
        from: from,
        to: toArr[0],
        subject: opts.subject,
        html: opts.html,
      });
      return;
    } catch (err) {
      console.error('[Email] Cloudflare Email failed, falling back to Resend:', err);
    }
  }

  // 2. Fallback to Resend
  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to:       toArr,
          subject:  opts.subject,
          html:     opts.html,
          reply_to: opts.replyTo,
        }),
      });

      if (res.ok) return;

      const body = await res.text();
      const errorMsg = `Resend error ${res.status}: ${body}`;
      if (!isLocal) throw new Error(errorMsg);
      console.error('[Email]', errorMsg);
    } catch (err) {
      if (!isLocal) throw err;
      console.error('[Email] Resend failed:', err);
    }
  }

  // Final check for local
  if (isLocal) {
    console.log('[LOCAL EMAIL] Email delivery skipped/failed but allowing flow to continue.');
    return;
  }

  throw new Error('No email service configured or all services failed (missing RESEND_API_KEY and EMAIL binding)');
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

export function verificationEmailHtml(opts: { code: string }): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #4f46e5;">Verify your EQBIS account</h2>
      <p>Please enter the following verification code to complete your registration:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111;">${opts.code}</span>
      </div>
      <p>This code expires in 390 minutes.</p>
      <p>If you did not create an account on EQBIS, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">&copy; ${new Date().getFullYear()} EQBIS. All rights reserved.</p>
    </div>
  `;
}
