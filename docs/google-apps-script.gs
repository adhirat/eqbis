/**
 * Adhirat Technologies - Email Notification Google Apps Script
 * 
 * This script sends beautiful, glassmorphism-styled email notifications
 * to admin@adhirat.com when contact forms are submitted or users subscribe
 * to the newsletter.
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * ========================
 * 1. Go to https://script.google.com
 * 2. Create a new project (File > New Project)
 * 3. Replace the default Code.gs content with this entire file
 * 4. Click Deploy > New Deployment
 * 5. Select "Web app" as the deployment type
 * 6. Set "Execute as" to "Me"
 * 7. Set "Who has access" to "Anyone"
 * 8. Click "Deploy"
 * 9. Authorize the app when prompted
 * 10. Copy the Web app URL
 * 11. Paste the URL in /assets/js/email-notifications.js (GOOGLE_SCRIPT_URL)
 * 
 * IMPORTANT: After making changes, create a new deployment version
 * to apply updates.
 */

const ADMIN_EMAIL = 'admin@adhirat.com';
const COMPANY_NAME = 'Adhirat Technologies';

/**
 * Handle incoming POST requests
 */
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        
        if (data.type === 'contact') {
            sendContactEmail(data);
        } else if (data.type === 'newsletter') {
            sendNewsletterEmail(data);
        } else if (data.type === 'bulk_newsletter') {
            const result = sendBulkNewsletter(data);
            return ContentService.createTextOutput(JSON.stringify(result))
                .setMimeType(ContentService.MimeType.JSON);
        } else if (data.type === 'contract_sent') {
            sendContractSentEmail(data);
        } else if (data.type === 'contract_signed') {
            sendContractSignedEmail(data);
        } else if (data.type === 'contract_approved') {
            sendContractApprovedEmail(data);
        }
        
        return ContentService.createTextOutput(JSON.stringify({ success: true }))
            .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        Logger.log('Error: ' + error.message);
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
    return ContentService.createTextOutput(JSON.stringify({ 
        status: 'OK',
        message: 'Adhirat Email Notification Service is running'
    })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Send contact form notification email
 */
function sendContactEmail(data) {
    const subject = `🚀 New Inquiry: ${data.service} - ${data.name}`;
    
    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%); min-height: 100vh; font-family: 'Space Grotesk', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        
        <!-- Main Container -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="min-height: 100vh;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    
                    <!-- Glass Card -->
                    <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px;">
                        <tr>
                            <td style="background: linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%); backdrop-filter: blur(20px); border-radius: 24px; border: 1px solid rgba(139, 92, 246, 0.3); box-shadow: 0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);">
                                
                                <!-- Header with Gradient -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 40px 40px 0 40px;">
                                            <!-- Logo & Badge Row -->
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tr>
                                                    <td style="vertical-align: middle;">
                                                        <div style="font-size: 28px; font-weight: 700; color: white; letter-spacing: -0.5px;">
                                                            Adhirat<span style="background: linear-gradient(90deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">.Tech</span>
                                                        </div>
                                                    </td>
                                                    <td align="right" style="vertical-align: middle;">
                                                        <span style="background: linear-gradient(90deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2)); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 999px; padding: 8px 16px; font-size: 12px; font-weight: 600; color: #a78bfa; text-transform: uppercase; letter-spacing: 1px;">
                                                            ✦ New Inquiry
                                                        </span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Hero Section -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 40px;">
                                            <h1 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 700; color: white; line-height: 1.2;">
                                                Contact Form <span style="background: linear-gradient(90deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Submission</span>
                                            </h1>
                                            <p style="margin: 0; color: rgba(148, 163, 184, 1); font-size: 16px; line-height: 1.6;">
                                                A potential client has reached out through your website.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Divider -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 0 40px;">
                                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), rgba(6, 182, 212, 0.5), transparent);"></div>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Info Cards -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 32px 40px;">
                                            
                                            <!-- From Section -->
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                                <tr>
                                                    <td style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 16px; padding: 20px;">
                                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                            <tr>
                                                                <td width="50" style="vertical-align: top;">
                                                                    <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #8b5cf6, #06b6d4); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                                                                        <span style="font-size: 20px;">👤</span>
                                                                    </div>
                                                                </td>
                                                                <td style="padding-left: 16px; vertical-align: top;">
                                                                    <div style="font-size: 11px; font-weight: 600; color: #a78bfa; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">FROM</div>
                                                                    <div style="font-size: 18px; font-weight: 600; color: white; margin-bottom: 2px;">${data.name}</div>
                                                                    <a href="mailto:${data.email}" style="font-size: 14px; color: #06b6d4; text-decoration: none;">${data.email}</a>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <!-- Service Interest -->
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                                <tr>
                                                    <td style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 16px; padding: 20px;">
                                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                            <tr>
                                                                <td width="50" style="vertical-align: top;">
                                                                    <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #06b6d4, #8b5cf6); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                                                                        <span style="font-size: 20px;">🚀</span>
                                                                    </div>
                                                                </td>
                                                                <td style="padding-left: 16px; vertical-align: top;">
                                                                    <div style="font-size: 11px; font-weight: 600; color: #22d3ee; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">SERVICE INTEREST</div>
                                                                    <div style="font-size: 18px; font-weight: 600; color: white;">${data.service}</div>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <!-- Message -->
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tr>
                                                    <td style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px;">
                                                        <div style="font-size: 11px; font-weight: 600; color: #a78bfa; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">💬 PROJECT DETAILS</div>
                                                        <div style="font-size: 15px; color: rgba(226, 232, 240, 0.9); line-height: 1.8; white-space: pre-wrap;">${data.message}</div>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            ${data.attachmentUrl ? `
                                            <!-- Attachment -->
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 20px;">
                                                <tr>
                                                    <td style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 16px; padding: 16px 20px;">
                                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                            <tr>
                                                                <td width="30">
                                                                    <span style="font-size: 18px;">📎</span>
                                                                </td>
                                                                <td>
                                                                    <span style="font-size: 13px; font-weight: 500; color: #4ade80;">Attachment included</span>
                                                                </td>
                                                                <td align="right">
                                                                    <a href="${data.attachmentUrl}" style="font-size: 13px; font-weight: 600; color: #4ade80; text-decoration: none;">View File →</a>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            ` : ''}
                                            
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Divider -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 0 40px;">
                                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), rgba(6, 182, 212, 0.5), transparent);"></div>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Footer -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 32px 40px;">
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tr>
                                                    <td>
                                                        <div style="font-size: 12px; color: rgba(148, 163, 184, 0.7);">
                                                            📍 Submitted at ${new Date(data.timestamp).toLocaleString('en-AU', { 
                                                                dateStyle: 'full', 
                                                                timeStyle: 'short',
                                                                timeZone: 'Australia/Sydney'
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td align="right">
                                                        <a href="mailto:${data.email}" style="display: inline-block; background: linear-gradient(90deg, #8b5cf6, #06b6d4); color: white; padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none;">
                                                            Reply Now →
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Bottom Text -->
                    <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px;">
                        <tr>
                            <td align="center" style="padding: 32px 20px;">
                                <p style="margin: 0; font-size: 12px; color: rgba(148, 163, 184, 0.5);">
                                    This notification was sent by <strong style="color: rgba(148, 163, 184, 0.7);">${COMPANY_NAME}</strong><br>
                                    © ${new Date().getFullYear()} All rights reserved • <a href="https://adhirat.com" style="color: #8b5cf6; text-decoration: none;">adhirat.com</a>
                                </p>
                            </td>
                        </tr>
                    </table>
                    
                </td>
            </tr>
        </table>
        
    </body>
    </html>
    `;
    
    GmailApp.sendEmail(ADMIN_EMAIL, subject, 
        `New Contact Form Submission\n\nFrom: ${data.name}\nEmail: ${data.email}\nService: ${data.service}\n\nMessage:\n${data.message}`,
        { htmlBody: htmlBody }
    );
}

/**
 * Send newsletter subscription notification email
 */
function sendNewsletterEmail(data) {
    const subject = `📬 New Newsletter Subscriber: ${data.email}`;
    
    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Newsletter Subscription</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%); min-height: 100vh; font-family: 'Space Grotesk', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        
        <!-- Main Container -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="min-height: 100vh;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    
                    <!-- Glass Card -->
                    <table cellpadding="0" cellspacing="0" border="0" width="500" style="max-width: 500px;">
                        <tr>
                            <td style="background: linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%); backdrop-filter: blur(20px); border-radius: 24px; border: 1px solid rgba(6, 182, 212, 0.3); box-shadow: 0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);">
                                
                                <!-- Header -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 40px 40px 0 40px;">
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tr>
                                                    <td>
                                                        <div style="font-size: 24px; font-weight: 700; color: white; letter-spacing: -0.5px;">
                                                            Adhirat<span style="background: linear-gradient(90deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">.Tech</span>
                                                        </div>
                                                    </td>
                                                    <td align="right">
                                                        <span style="background: linear-gradient(90deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2)); border: 1px solid rgba(6, 182, 212, 0.4); border-radius: 999px; padding: 8px 16px; font-size: 11px; font-weight: 600; color: #22d3ee; text-transform: uppercase; letter-spacing: 1px;">
                                                            📬 New Subscriber
                                                        </span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Content -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td align="center" style="padding: 48px 40px;">
                                            
                                            <!-- Icon -->
                                            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2)); border: 2px solid rgba(6, 182, 212, 0.3); border-radius: 20px; margin: 0 auto 24px auto; display: flex; align-items: center; justify-content: center;">
                                                <span style="font-size: 40px;">✨</span>
                                            </div>
                                            
                                            <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: white;">
                                                New <span style="background: linear-gradient(90deg, #06b6d4, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Subscriber</span>
                                            </h1>
                                            
                                            <p style="margin: 0 0 32px 0; font-size: 15px; color: rgba(148, 163, 184, 0.9);">
                                                Someone just subscribed to your newsletter!
                                            </p>
                                            
                                            <!-- Email Badge -->
                                            <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 12px; padding: 20px 28px; display: inline-block;">
                                                <div style="font-size: 10px; font-weight: 600; color: #22d3ee; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">SUBSCRIBER EMAIL</div>
                                                <a href="mailto:${data.email}" style="font-size: 18px; font-weight: 600; color: white; text-decoration: none;">${data.email}</a>
                                            </div>
                                            
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Divider -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 0 40px;">
                                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.5), rgba(139, 92, 246, 0.5), transparent);"></div>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Footer -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td align="center" style="padding: 24px 40px;">
                                            <p style="margin: 0; font-size: 12px; color: rgba(148, 163, 184, 0.6);">
                                                📍 ${new Date(data.timestamp).toLocaleString('en-AU', { 
                                                    dateStyle: 'medium', 
                                                    timeStyle: 'short',
                                                    timeZone: 'Australia/Sydney'
                                                })}
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                                
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Bottom Text -->
                    <table cellpadding="0" cellspacing="0" border="0" width="500" style="max-width: 500px;">
                        <tr>
                            <td align="center" style="padding: 24px 20px;">
                                <p style="margin: 0; font-size: 11px; color: rgba(148, 163, 184, 0.4);">
                                    © ${new Date().getFullYear()} ${COMPANY_NAME} • <a href="https://adhirat.com" style="color: #8b5cf6; text-decoration: none;">adhirat.com</a>
                                </p>
                            </td>
                        </tr>
                    </table>
                    
                </td>
            </tr>
        </table>
        
    </body>
    </html>
    `;
    
    GmailApp.sendEmail(ADMIN_EMAIL, subject, 
        `New Newsletter Subscription\n\nEmail: ${data.email}\nTime: ${data.timestamp}`,
        { htmlBody: htmlBody }
    );
}

/**
 * Test function - Run this to verify the script works
 */
function testContactEmail() {
    sendContactEmail({
        name: 'Test User',
        email: 'test@example.com',
        service: 'Web Development',
        message: 'This is a test message to verify the email template looks correct.',
        timestamp: new Date().toISOString()
    });
}

function testNewsletterEmail() {
    sendNewsletterEmail({
        email: 'test@example.com',
        timestamp: new Date().toISOString()
    });
}

/**
 * Send bulk newsletter emails to multiple recipients
 * @param {Object} data - Contains recipients array, subject, and content
 * @param {Array} data.recipients - Array of {email, name} objects
 * @param {string} data.subject - Email subject line
 * @param {string} data.content - Newsletter HTML content
 * @param {string} data.previewText - Optional preview text
 */
function sendBulkNewsletter(data) {
    const results = { 
        success: true, 
        sent: 0, 
        failed: 0, 
        errors: [],
        timestamp: new Date().toISOString()
    };
    
    if (!data.recipients || !Array.isArray(data.recipients) || data.recipients.length === 0) {
        return { success: false, error: 'No recipients provided' };
    }
    
    const subject = data.subject || '📬 Newsletter from Adhirat Technologies';
    const content = data.content || 'Thank you for subscribing to our newsletter!';
    const previewText = data.previewText || 'Latest updates from Adhirat Technologies';
    
    for (const recipient of data.recipients) {
        try {
            const email = recipient.email;
            const name = recipient.name || email.split('@')[0];
            
            if (!email || !isValidEmail(email)) {
                results.failed++;
                results.errors.push({ email: email, error: 'Invalid email address' });
                continue;
            }
            
            const htmlBody = generateNewsletterTemplate(name, email, subject, content, previewText);
            const plainText = `${subject}\n\nHi ${name},\n\n${stripHtml(content)}\n\n---\nAdhirat Technologies\nhttps://adhirat.com`;
            
            GmailApp.sendEmail(email, subject, plainText, { 
                htmlBody: htmlBody,
                name: COMPANY_NAME
            });
            
            results.sent++;
            Logger.log(`Email sent to: ${email}`);
            
            // Small delay to avoid rate limiting
            Utilities.sleep(100);
            
        } catch (error) {
            results.failed++;
            results.errors.push({ email: recipient.email, error: error.message });
            Logger.log(`Failed to send to ${recipient.email}: ${error.message}`);
        }
    }
    
    results.success = results.failed === 0;
    return results;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Generate newsletter HTML template
 */
function generateNewsletterTemplate(name, email, subject, content, previewText) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
        <!--[if !mso]><!-->
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        </style>
        <!--<![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%); min-height: 100vh; font-family: 'Space Grotesk', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <!-- Preview Text -->
        <div style="display: none; max-height: 0; overflow: hidden;">${previewText}</div>
        
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="min-height: 100vh;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <!-- Glass Card -->
                    <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px;">
                        <tr>
                            <td style="background: linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%); backdrop-filter: blur(20px); border-radius: 24px; border: 1px solid rgba(139, 92, 246, 0.3); box-shadow: 0 25px 50px rgba(0,0,0,0.5);">
                                
                                <!-- Header -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 40px 40px 0 40px;">
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tr>
                                                    <td>
                                                        <div style="font-size: 28px; font-weight: 700; color: white;">
                                                            Adhirat<span style="background: linear-gradient(90deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">.Tech</span>
                                                        </div>
                                                    </td>
                                                    <td align="right">
                                                        <span style="background: linear-gradient(90deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2)); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 999px; padding: 8px 16px; font-size: 11px; font-weight: 600; color: #a78bfa; text-transform: uppercase;">
                                                            📬 Newsletter
                                                        </span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Greeting -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 40px;">
                                            <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: white;">
                                                Hi <span style="background: linear-gradient(90deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${name}</span>! 👋
                                            </h1>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Content -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 0 40px 40px 40px;">
                                            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px;">
                                                <div style="font-size: 15px; color: rgba(226, 232, 240, 0.9); line-height: 1.8;">
                                                    ${content}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Divider -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 0 40px;">
                                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), rgba(6, 182, 212, 0.5), transparent);"></div>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Footer -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td align="center" style="padding: 28px 40px;">
                                            <a href="https://adhirat.com" style="display: inline-block; background: linear-gradient(90deg, #8b5cf6, #06b6d4); color: white; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none;">
                                                Visit Our Website →
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Unsubscribe -->
                    <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px;">
                        <tr>
                            <td align="center" style="padding: 24px 20px;">
                                <p style="margin: 0; font-size: 11px; color: rgba(148, 163, 184, 0.5);">
                                    © ${new Date().getFullYear()} ${COMPANY_NAME} • <a href="https://adhirat.com" style="color: #8b5cf6; text-decoration: none;">adhirat.com</a><br>
                                    <a href="https://adhirat.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: rgba(148, 163, 184, 0.5); text-decoration: underline;">Unsubscribe</a>
                                </p>
                            </td>
                        </tr>
                    </table>
                    
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}

// ============================================
// CONTRACT EMAIL NOTIFICATIONS
// ============================================

/**
 * Send email when a contract is sent to client for signature
 * @param {Object} data - Contract data
 */
function sendContractSentEmail(data) {
    const subject = `📝 Contract Ready for Signature: ${data.contractTitle}`;
    
    const htmlBody = generateContractEmailTemplate({
        type: 'sent',
        badge: '📝 Action Required',
        badgeColor: 'rgba(245, 158, 11, 0.2)',
        badgeBorderColor: 'rgba(245, 158, 11, 0.4)',
        badgeTextColor: '#fbbf24',
        title: 'Contract Ready for Signature',
        subtitle: 'Please review and sign your contract',
        contractTitle: data.contractTitle,
        clientName: data.clientName,
        projectName: data.projectName,
        value: data.value,
        expiryDate: data.expiryDate,
        portalUrl: data.portalUrl || 'https://adhirat.com/portal/contracts.html',
        buttonText: 'Review & Sign Contract',
        buttonColor: 'linear-gradient(90deg, #f59e0b, #d97706)',
        message: `A new contract has been prepared for you by ${COMPANY_NAME}. Please review the terms and conditions, then sign the contract at your earliest convenience.`
    });
    
    GmailApp.sendEmail(data.clientEmail, subject, 
        `Contract Ready for Signature\n\nHi ${data.clientName},\n\nA new contract "${data.contractTitle}" is ready for your signature.\n\nPlease visit ${data.portalUrl || 'https://adhirat.com/portal'} to review and sign.\n\n${COMPANY_NAME}`,
        { htmlBody: htmlBody, name: COMPANY_NAME }
    );
    
    // Also notify admin
    GmailApp.sendEmail(ADMIN_EMAIL, `📤 Contract Sent: ${data.contractTitle}`,
        `Contract sent to client\n\nContract: ${data.contractTitle}\nClient: ${data.clientName}\nEmail: ${data.clientEmail}`,
        { name: COMPANY_NAME }
    );
}

/**
 * Send email when a contract is signed by client
 * @param {Object} data - Contract data with signature info
 */
function sendContractSignedEmail(data) {
    const subject = `✍️ Contract Signed: ${data.contractTitle}`;
    
    // Notify admin
    const adminHtmlBody = generateContractEmailTemplate({
        type: 'signed',
        badge: '✍️ Signed',
        badgeColor: 'rgba(59, 130, 246, 0.2)',
        badgeBorderColor: 'rgba(59, 130, 246, 0.4)',
        badgeTextColor: '#60a5fa',
        title: 'Contract Has Been Signed',
        subtitle: 'Awaiting your approval',
        contractTitle: data.contractTitle,
        clientName: data.clientName,
        projectName: data.projectName,
        value: data.value,
        signedBy: data.signerName,
        signedAt: data.signedAt,
        portalUrl: data.portalUrl || 'https://adhirat.com/portal/contracts.html',
        buttonText: 'Review & Approve',
        buttonColor: 'linear-gradient(90deg, #3b82f6, #2563eb)',
        message: `The contract has been signed by ${data.clientName}. Please review and approve or reject the contract.`
    });
    
    GmailApp.sendEmail(ADMIN_EMAIL, subject, 
        `Contract Signed\n\nContract: ${data.contractTitle}\nSigned by: ${data.signerName}\nClient: ${data.clientName}\n\nPlease review and approve in the portal.`,
        { htmlBody: adminHtmlBody, name: COMPANY_NAME }
    );
    
    // Confirm to client
    const clientHtmlBody = generateContractEmailTemplate({
        type: 'signed_confirmation',
        badge: '✅ Signature Received',
        badgeColor: 'rgba(16, 185, 129, 0.2)',
        badgeBorderColor: 'rgba(16, 185, 129, 0.4)',
        badgeTextColor: '#34d399',
        title: 'Thank You for Signing',
        subtitle: 'Your signature has been recorded',
        contractTitle: data.contractTitle,
        clientName: data.clientName,
        projectName: data.projectName,
        value: data.value,
        signedBy: data.signerName,
        signedAt: data.signedAt,
        buttonText: 'View Contract',
        buttonColor: 'linear-gradient(90deg, #10b981, #059669)',
        message: `Thank you for signing the contract. Your signature has been recorded and the contract is now pending approval by ${COMPANY_NAME}. You will receive a confirmation email once approved.`
    });
    
    GmailApp.sendEmail(data.clientEmail, `✅ Signature Confirmed: ${data.contractTitle}`,
        `Signature Confirmed\n\nThank you for signing "${data.contractTitle}".\n\nYour signature has been recorded and is pending approval.\n\n${COMPANY_NAME}`,
        { htmlBody: clientHtmlBody, name: COMPANY_NAME }
    );
}

/**
 * Send email when a contract is approved by admin
 * @param {Object} data - Contract data with approval info
 */
function sendContractApprovedEmail(data) {
    const subject = `🎉 Contract Approved: ${data.contractTitle}`;
    
    const htmlBody = generateContractEmailTemplate({
        type: 'approved',
        badge: '🎉 Approved',
        badgeColor: 'rgba(16, 185, 129, 0.2)',
        badgeBorderColor: 'rgba(16, 185, 129, 0.4)',
        badgeTextColor: '#34d399',
        title: 'Contract Approved!',
        subtitle: 'Your contract is now active',
        contractTitle: data.contractTitle,
        clientName: data.clientName,
        projectName: data.projectName,
        value: data.value,
        approvedAt: data.approvedAt,
        buttonText: 'View Contract',
        buttonColor: 'linear-gradient(90deg, #10b981, #059669)',
        message: `Great news! Your contract has been approved by ${COMPANY_NAME}. The contract is now active and work can begin. Thank you for your trust in us!`
    });
    
    // Notify client
    GmailApp.sendEmail(data.clientEmail, subject, 
        `Contract Approved!\n\nHi ${data.clientName},\n\nYour contract "${data.contractTitle}" has been approved!\n\nThank you for your trust in ${COMPANY_NAME}.`,
        { htmlBody: htmlBody, name: COMPANY_NAME }
    );
    
    // Notify admin
    GmailApp.sendEmail(ADMIN_EMAIL, `✅ Contract Approved: ${data.contractTitle}`,
        `Contract approved and notifications sent\n\nContract: ${data.contractTitle}\nClient: ${data.clientName}\nValue: $${data.value || 0}`,
        { name: COMPANY_NAME }
    );
}

/**
 * Generate beautiful glassmorphism contract email template
 */
function generateContractEmailTemplate(options) {
    const {
        type, badge, badgeColor, badgeBorderColor, badgeTextColor,
        title, subtitle, contractTitle, clientName, projectName,
        value, expiryDate, signedBy, signedAt, approvedAt,
        portalUrl, buttonText, buttonColor, message
    } = options;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%); min-height: 100vh; font-family: 'Space Grotesk', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="min-height: 100vh;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    
                    <!-- Glass Card -->
                    <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px;">
                        <tr>
                            <td style="background: linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%); backdrop-filter: blur(20px); border-radius: 24px; border: 1px solid rgba(139, 92, 246, 0.3); box-shadow: 0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);">
                                
                                <!-- Header -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 40px 40px 0 40px;">
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tr>
                                                    <td style="vertical-align: middle;">
                                                        <div style="font-size: 28px; font-weight: 700; color: white; letter-spacing: -0.5px;">
                                                            Adhirat<span style="background: linear-gradient(90deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">.Tech</span>
                                                        </div>
                                                    </td>
                                                    <td align="right" style="vertical-align: middle;">
                                                        <span style="background: ${badgeColor}; border: 1px solid ${badgeBorderColor}; border-radius: 999px; padding: 8px 16px; font-size: 12px; font-weight: 600; color: ${badgeTextColor}; text-transform: uppercase; letter-spacing: 1px;">
                                                            ${badge}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Title Section -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 40px;">
                                            <h1 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 700; color: white; line-height: 1.2;">
                                                ${title.split(' ')[0]} <span style="background: linear-gradient(90deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${title.split(' ').slice(1).join(' ')}</span>
                                            </h1>
                                            <p style="margin: 0; color: rgba(148, 163, 184, 1); font-size: 16px; line-height: 1.6;">
                                                ${subtitle}
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Divider -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 0 40px;">
                                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), rgba(6, 182, 212, 0.5), transparent);"></div>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Contract Details -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 32px 40px;">
                                            
                                            <!-- Contract Title Card -->
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                                <tr>
                                                    <td style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 16px; padding: 20px;">
                                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                            <tr>
                                                                <td width="50" style="vertical-align: top;">
                                                                    <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #8b5cf6, #06b6d4); border-radius: 12px; text-align: center; line-height: 44px;">
                                                                        <span style="font-size: 20px;">📄</span>
                                                                    </div>
                                                                </td>
                                                                <td style="padding-left: 16px; vertical-align: top;">
                                                                    <div style="font-size: 11px; font-weight: 600; color: #a78bfa; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">CONTRACT</div>
                                                                    <div style="font-size: 18px; font-weight: 600; color: white;">${contractTitle}</div>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <!-- Info Grid -->
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                                <tr>
                                                    <td width="50%" style="padding-right: 10px; vertical-align: top;">
                                                        <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 12px; padding: 16px;">
                                                            <div style="font-size: 10px; font-weight: 600; color: #22d3ee; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">CLIENT</div>
                                                            <div style="font-size: 15px; font-weight: 600; color: white;">${clientName}</div>
                                                        </div>
                                                    </td>
                                                    <td width="50%" style="padding-left: 10px; vertical-align: top;">
                                                        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 16px;">
                                                            <div style="font-size: 10px; font-weight: 600; color: #34d399; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">VALUE</div>
                                                            <div style="font-size: 15px; font-weight: 600; color: white;">$${value ? value.toLocaleString() : '0'}</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            ${projectName ? `
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                                <tr>
                                                    <td style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px;">
                                                        <div style="font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">PROJECT</div>
                                                        <div style="font-size: 15px; font-weight: 500; color: white;">${projectName}</div>
                                                    </td>
                                                </tr>
                                            </table>
                                            ` : ''}
                                            
                                            ${signedBy ? `
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                                <tr>
                                                    <td style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 16px;">
                                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                            <tr>
                                                                <td>
                                                                    <div style="font-size: 10px; font-weight: 600; color: #60a5fa; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">SIGNED BY</div>
                                                                    <div style="font-size: 15px; font-weight: 600; color: white;">${signedBy}</div>
                                                                </td>
                                                                <td align="right">
                                                                    <div style="font-size: 12px; color: #94a3b8;">${signedAt ? new Date(signedAt).toLocaleDateString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</div>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            ` : ''}
                                            
                                            <!-- Message -->
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tr>
                                                    <td style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px;">
                                                        <div style="font-size: 15px; color: rgba(226, 232, 240, 0.9); line-height: 1.8;">${message}</div>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Divider -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 0 40px;">
                                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), rgba(6, 182, 212, 0.5), transparent);"></div>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- CTA Button -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td align="center" style="padding: 32px 40px;">
                                            <a href="${portalUrl || 'https://adhirat.com/portal/contracts.html'}" style="display: inline-block; background: ${buttonColor}; color: white; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 600; text-decoration: none; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
                                                ${buttonText} →
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Footer -->
                    <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px;">
                        <tr>
                            <td align="center" style="padding: 32px 20px;">
                                <p style="margin: 0; font-size: 12px; color: rgba(148, 163, 184, 0.5);">
                                    This notification was sent by <strong style="color: rgba(148, 163, 184, 0.7);">${COMPANY_NAME}</strong><br>
                                    © ${new Date().getFullYear()} All rights reserved • <a href="https://adhirat.com" style="color: #8b5cf6; text-decoration: none;">adhirat.com</a>
                                </p>
                            </td>
                        </tr>
                    </table>
                    
                </td>
            </tr>
        </table>
        
    </body>
    </html>
    `;
}

/**
 * Test contract sent email
 */
function testContractSentEmail() {
    sendContractSentEmail({
        contractTitle: 'Service Agreement - Test Project',
        clientName: 'John Doe',
        clientEmail: 'admin@adhirat.com',
        projectName: 'Website Redesign',
        value: 15000,
        expiryDate: '2026-03-01',
        portalUrl: 'https://adhirat.com/portal/contracts.html'
    });
    Logger.log('Contract sent email test completed');
}

/**
 * Test contract signed email
 */
function testContractSignedEmail() {
    sendContractSignedEmail({
        contractTitle: 'Service Agreement - Test Project',
        clientName: 'John Doe',
        clientEmail: 'admin@adhirat.com',
        signerName: 'John Doe',
        signedAt: new Date().toISOString(),
        projectName: 'Website Redesign',
        value: 15000,
        portalUrl: 'https://adhirat.com/portal/contracts.html'
    });
    Logger.log('Contract signed email test completed');
}

/**
 * Test contract approved email
 */
function testContractApprovedEmail() {
    sendContractApprovedEmail({
        contractTitle: 'Service Agreement - Test Project',
        clientName: 'John Doe',
        clientEmail: 'admin@adhirat.com',
        projectName: 'Website Redesign',
        value: 15000,
        approvedAt: new Date().toISOString()
    });
    Logger.log('Contract approved email test completed');
}

// ============================================
// TEST FUNCTIONS
// ============================================

/**
 * Test bulk newsletter with multiple recipients
 */
function testBulkNewsletter() {
    const result = sendBulkNewsletter({
        recipients: [
            { email: 'admin@adhirat.com', name: 'Admin' },
            { email: 'test@adhirat.com', name: 'Test User' }
        ],
        subject: '🚀 Test Newsletter - Adhirat Technologies',
        content: '<p>This is a <strong>test newsletter</strong> to verify the bulk email functionality is working correctly.</p><p>Features tested:</p><ul><li>Personalized greeting</li><li>HTML content rendering</li><li>Multiple recipients</li></ul>',
        previewText: 'Testing the bulk newsletter feature'
    });
    
    Logger.log('Bulk Newsletter Test Results:');
    Logger.log(JSON.stringify(result, null, 2));
    return result;
}

/**
 * Test with single recipient
 */
function testSingleRecipient() {
    const result = sendBulkNewsletter({
        recipients: [
            { email: 'admin@adhirat.com', name: 'Adhirat Admin' }
        ],
        subject: '✨ Single Recipient Test',
        content: '<p>This email was sent to a single recipient to test the newsletter functionality.</p>',
        previewText: 'Single recipient test'
    });
    
    Logger.log('Single Recipient Test Results:');
    Logger.log(JSON.stringify(result, null, 2));
    return result;
}

/**
 * Test email validation
 */
function testEmailValidation() {
    const testCases = [
        { email: 'valid@example.com', expected: true },
        { email: 'invalid-email', expected: false },
        { email: 'test@domain', expected: false },
        { email: 'user@sub.domain.com', expected: true },
        { email: '', expected: false },
        { email: 'spaces @email.com', expected: false }
    ];
    
    Logger.log('Email Validation Test Results:');
    testCases.forEach(tc => {
        const result = isValidEmail(tc.email);
        const status = result === tc.expected ? '✅ PASS' : '❌ FAIL';
        Logger.log(`${status}: "${tc.email}" - Expected: ${tc.expected}, Got: ${result}`);
    });
}

/**
 * Test with invalid recipients (should handle gracefully)
 */
function testInvalidRecipients() {
    const result = sendBulkNewsletter({
        recipients: [
            { email: 'invalid-email', name: 'Invalid' },
            { email: '', name: 'Empty' },
            { email: 'admin@adhirat.com', name: 'Valid Admin' }
        ],
        subject: '🧪 Invalid Recipients Test',
        content: '<p>Testing how the system handles invalid email addresses.</p>',
        previewText: 'Invalid recipients test'
    });
    
    Logger.log('Invalid Recipients Test Results:');
    Logger.log(JSON.stringify(result, null, 2));
    Logger.log(`Expected: 1 sent, 2 failed`);
    return result;
}

/**
 * Test empty recipients array
 */
function testEmptyRecipients() {
    const result = sendBulkNewsletter({
        recipients: [],
        subject: 'Empty Test',
        content: 'This should not send'
    });
    
    Logger.log('Empty Recipients Test Results:');
    Logger.log(JSON.stringify(result, null, 2));
    Logger.log(`Expected: success: false, error about no recipients`);
    return result;
}
