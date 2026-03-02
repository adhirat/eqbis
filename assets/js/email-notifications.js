/**
 * Email Notification Service
 * 
 * This module handles sending email notifications via Google Apps Script
 * when contact forms are submitted or newsletter subscriptions are made.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com and create a new project
 * 2. Copy the Google Apps Script code from /docs/google-apps-script.gs
 * 3. Deploy as Web App: Deploy > New Deployment > Select "Web app"
 * 4. Set "Execute as" to your account
 * 5. Set "Who has access" to "Anyone"
 * 6. Copy the deployment URL and paste it below in GOOGLE_SCRIPT_URL
 */

// Replace with your deployed Google Apps Script URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxKZ7iYdLOykCrVgfkEULLDvca4n9YZ4lCDvR8K7cW1auCdo5-zi2MZPf5UXfGh9Qap/exec';

/**
 * Send contact form notification email
 * @param {Object} formData - The contact form data
 * @param {string} formData.name - Sender's full name
 * @param {string} formData.email - Sender's email address
 * @param {string} formData.service - Selected service interest
 * @param {string} formData.message - Project details/message
 * @param {string} [formData.attachmentUrl] - Optional attachment URL
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendContactNotification(formData) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'contact',
                ...formData,
                timestamp: new Date().toISOString()
            })
        });

        // Note: With 'no-cors' we can't read the response, but we assume success if no error thrown
        return { success: true };
    } catch (error) {
        console.error('Email notification error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send newsletter subscription notification email
 * @param {string} email - Subscriber's email address
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendNewsletterNotification(email) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'newsletter',
                email: email,
                timestamp: new Date().toISOString()
            })
        });

        return { success: true };
    } catch (error) {
        console.error('Email notification error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send client portal credentials email
 * @param {string} email - Client's email address
 * @param {string} password - Client's temporary password
 * @param {string} name - Client's name
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendClientCredentials(email, password, name) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'client_credentials',
                email: email,
                password: password,
                name: name,
                timestamp: new Date().toISOString()
            })
        });

        return { success: true };
    } catch (error) {
        console.error('Email notification error:', error);
        return { success: false, error: error.message };
    }
}
