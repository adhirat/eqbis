# Email Notification Setup Guide

This guide explains how to set up email notifications for contact form submissions and newsletter subscriptions on the Adhirat Technologies website.

## Overview

When users submit the contact form or subscribe to the newsletter, an email notification is automatically sent to `admin@adhirat.com` with a beautiful, glassmorphism-styled layout that matches the website's design.

## Architecture

```
User Action (Contact/Newsletter)
       ↓
Firebase Storage (Data Persistence)
       ↓
Google Apps Script API (Email Trigger)
       ↓
Gmail API (Send Email)
       ↓
admin@adhirat.com Inbox
```

## Setup Instructions

### Step 1: Create Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Sign in with the Google account that has access to send emails from `admin@adhirat.com` (or the account you want to send from)
3. Click **"New Project"**
4. Name the project: `Adhirat Email Notifications`

### Step 2: Add the Script Code

1. Delete any existing code in `Code.gs`
2. Open `/docs/google-apps-script.gs` from this repository
3. Copy the entire content
4. Paste it into the Google Apps Script editor

### Step 3: Test the Script (Optional but Recommended)

1. In the Apps Script editor, select the function `testContactEmail` from the dropdown
2. Click the **Run** button (▶)
3. If prompted, authorize the application:
   - Click "Review Permissions"
   - Select your Google account
   - Click "Advanced" → "Go to Adhirat Email Notifications (unsafe)"
   - Click "Allow"
4. Check your inbox for the test email
5. Repeat with `testNewsletterEmail` to test newsletter formatting

### Step 4: Deploy as Web App

1. Click **Deploy** → **New Deployment**
2. Click the gear icon next to "Select type" and choose **"Web app"**
3. Configure the deployment:
   - **Description**: `Email Notification Service v1`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Click **Deploy**
5. If prompted, authorize the application again
6. **Copy the Web app URL** that appears (it looks like: `https://script.google.com/macros/s/xxx.../exec`)

### Step 5: Update the Website Code

1. Open `/assets/js/email-notifications.js`
2. Replace the placeholder URL:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
   with your actual deployment URL:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/xxx.../exec';
   ```
3. Save and deploy the website changes

## Updating the Script

When you make changes to the Google Apps Script:

1. Edit the code in the Apps Script editor
2. Click **Deploy** → **Manage Deployments**
3. Click the pencil icon to edit
4. Under "Version", select **"New version"**
5. Click **Deploy**

**Important**: The Web app URL remains the same, so you don't need to update the website.

## Email Templates

### Contact Form Email
- **Subject**: `🚀 New Inquiry: [Service] - [Name]`
- **Features**:
  - Dark glassmorphism background
  - Gradient accents (violet/cyan)
  - Sender info card
  - Service interest badge
  - Message content box
  - Attachment link (if provided)
  - "Reply Now" button
  - Timestamp with Sydney timezone

### Newsletter Subscription Email
- **Subject**: `📬 New Newsletter Subscriber: [Email]`
- **Features**:
  - Compact dark glass card
  - Subscriber email highlight
  - Timestamp with Sydney timezone

## Customization

### Changing the Admin Email
Edit the `ADMIN_EMAIL` constant in `google-apps-script.gs`:
```javascript
const ADMIN_EMAIL = 'your-email@domain.com';
```

### Modifying Email Colors
The email templates use inline CSS. Key color variables:
- **Neon Violet**: `#8b5cf6`
- **Neon Cyan**: `#06b6d4`
- **Dark Background**: `#0f172a`
- **Glass Border**: `rgba(139, 92, 246, 0.3)`

### Changing Timezone
Find and replace `'Australia/Sydney'` with your preferred timezone:
```javascript
timeZone: 'Australia/Sydney'
```

## Troubleshooting

### Emails Not Being Sent

1. **Check Apps Script Logs**:
   - Go to your Apps Script project
   - Click **Executions** in the left sidebar
   - Look for errors in recent executions

2. **Verify Deployment Settings**:
   - Ensure "Who has access" is set to "Anyone"
   - Make sure you're using the latest deployment version

3. **Check Browser Console**:
   - Look for CORS or network errors when submitting forms

### Authorization Issues

If you see authorization errors:
1. Go to Deploy → Manage Deployments
2. Delete the current deployment
3. Create a new deployment
4. Re-authorize when prompted

### Gmail Sending Limits

Google Apps Script has daily sending limits:
- Free accounts: ~100 emails/day
- Google Workspace: ~1,500 emails/day

For higher volumes, consider using a dedicated email service like SendGrid or Mailgun.

## Security Notes

1. **No-CORS Mode**: The website uses `mode: 'no-cors'` for requests, which means:
   - Responses cannot be read by JavaScript
   - The script must accept requests from any origin

2. **Data Validation**: The Google Apps Script should validate incoming data to prevent abuse

3. **Rate Limiting**: Consider adding rate limiting if spam becomes an issue

## Files Reference

| File | Purpose |
|------|---------|
| `/assets/js/email-notifications.js` | Client-side module for calling the API |
| `/assets/js/firebase-modules.js` | Firebase operations + email triggers |
| `/docs/google-apps-script.gs` | Google Apps Script code (copy to Apps Script) |
| `/docs/email-notification-setup.md` | This setup guide |

## Support

For issues or questions, contact the development team or check the Google Apps Script documentation at https://developers.google.com/apps-script
