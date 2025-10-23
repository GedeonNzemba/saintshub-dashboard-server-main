import nodemailer from 'nodemailer';
import axios from 'axios';
import i18next, { Resource } from 'i18next';
import path from 'path';
import fs from 'fs';
import { UserDocument } from '../models/User'; // Adjust path if needed
import * as EmailTemplates from '../templates/emailTemplates';

// --- i18next Configuration ---
const localesPath = path.resolve(__dirname, '../locales');
const resources: Resource = {};

// Check if locales directory exists
if (fs.existsSync(localesPath)) {
    fs.readdirSync(localesPath)
      .filter((file) => file.endsWith('.json'))
      .forEach((file) => {
        try {
            const lang = file.split('.')[0];
            const filePath = path.join(localesPath, file);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            resources[lang] = {
              translation: JSON.parse(fileContent), // Use JSON.parse
            };
        } catch (error) {
            console.error(`Error loading or parsing locale file ${file}:`, error);
        }
      });
} else {
    console.warn(`Locales directory not found at ${localesPath}. Email translations might not work.`);
}


i18next.init({
  resources,
  fallbackLng: 'en', // Default language if user's choice is not found
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});
// --- End i18next Configuration ---

// --- Nodemailer Configuration ---
// Helper function to get environment variables or throw an error
const getEnvVariable = (name: string, isOptional = false, defaultValue: string | undefined = undefined): string | undefined => {
    const value = process.env[name];
    if (!value && !isOptional && !defaultValue) {
        console.error(`Missing required environment variable: ${name}`);
    }
    return value || defaultValue; // Return value or default
}

// --- Email Configuration ---
// Hostinger Business Email SMTP Configuration
const emailUser = getEnvVariable('EMAIL_USER');
const emailPass = getEnvVariable('EMAIL_PASS');

console.log('🔍 Email Debug Info:');
console.log('   User:', emailUser);
console.log('   Pass length:', emailPass?.length);
console.log('   Pass first char:', emailPass?.charAt(0));
console.log('   Pass last char:', emailPass?.charAt(emailPass.length - 1));

const emailConfig = {
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // true for port 465
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  authMethod: 'LOGIN' // Try LOGIN instead of PLAIN
} as any; // Type assertion to avoid TypeScript strict checking

let transporter: nodemailer.Transporter | null = null;

// Only create transporter if config is valid
if (emailConfig.auth.user && emailConfig.auth.pass) {
    transporter = nodemailer.createTransport(emailConfig);

    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email transporter error:', error.message);
        console.error('Error details:', error);
        transporter = null; // Invalidate transporter on error
      } else {
        console.log('✅ Mail transporter configured successfully. Ready to send emails.');
      }
    });
} else {
    console.error("❌ Email environment variables are not fully configured! EMAIL_USER or EMAIL_PASS missing.");
}
// --- End Email Configuration ---


// --- Helper Functions ---

const getBibleVerse = async (lng: 'en' | 'fr'): Promise<string> => {
  try {
    // Determine utils file and language
    const utilsFile = lng === 'fr'
      ? path.resolve(__dirname, '../utils/bible/fr-utils.json')
      : path.resolve(__dirname, '../utils/bible/en-utils.json');
    console.log(`[getBibleVerse] Using utils file: ${utilsFile}`);
    // Read and parse the utils file
    const utilsContent = fs.readFileSync(utilsFile, 'utf-8');
    const utilsObj = JSON.parse(utilsContent);
    // Extract short names from the books array
    const shortNames: string[] = Array.isArray(utilsObj.books)
      ? utilsObj.books.map((b: any) => b.short_name)
      : [];
    console.log(`[getBibleVerse] Loaded short names:`, shortNames);
    if (!Array.isArray(shortNames) || shortNames.length === 0) {
      console.error('[getBibleVerse] No short names found in utils file');
      throw new Error('No short names found in utils file');
    }
    // Pick a random short name
    const randomShortName = shortNames[Math.floor(Math.random() * shortNames.length)];
    console.log(`[getBibleVerse] Selected random short name: ${randomShortName}`);
    // Call the production API
    const apiUrl = `https://email-bible-api.vercel.app/random?language=${lng}&book=${randomShortName}`;
    console.log(`[getBibleVerse] Fetching Bible verse from: ${apiUrl}`);
    const response = await axios.get(apiUrl);
    console.log(`[getBibleVerse] API response:`, JSON.stringify(response.data, null, 2));
    // Parse the result
    if (response.data && response.data.books && response.data.books.length > 0) {
      const book = response.data.books[0];
      const chapter = book.chapters && book.chapters[0];
      const verse = chapter && chapter.verses && chapter.verses[0];
      if (verse && verse.text) {
        // Format: verse text - Book Chapter:Verse (Translation)
        const reference = `${book.long_name} ${chapter.chapter}:${verse.verse}`;
        const translation = response.data.name || (lng === 'fr' ? 'LSG' : 'KJV');
        console.log(`[getBibleVerse] Returning verse: ${verse.text.trim()} - ${reference} (${translation})`);
        return `${verse.text.trim()} - ${reference} (${translation})`;
      } else {
        console.error('[getBibleVerse] Verse or verse.text missing in API response.');
      }
    } else {
      console.error('[getBibleVerse] No books found in API response.');
    }
    // Fallback message
    const fallbackText = i18next.t('bible_verse_fallback', { lng, defaultValue: 'May God bless your day.' });
    console.log(`[getBibleVerse] Fallback: ${fallbackText}`);
    return fallbackText;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[getBibleVerse] Axios error fetching Bible verse:', error.message, error.response?.status);
    } else {
      console.error('[getBibleVerse] Error fetching Bible verse:', error);
    }
    const fallbackText = i18next.t('bible_verse_fallback', { lng, defaultValue: 'May God bless your day.' });
    console.log(`[getBibleVerse] Fallback (error): ${fallbackText}`);
    return fallbackText;
  }
};

const sendEmail = async (to: string, subject: string, html: string, from: string) => {
  if (!transporter) {
      console.error("Email transporter is not configured. Cannot send email.");
      // Optionally throw an error or return a specific status
      throw new Error("Email service not available.");
  }

  const mailOptions = {
    from: from, // e.g., '"Saintshub" <no-reply@example.com>'
    to: to,
    subject: subject,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    // Depending on severity, you might want to re-throw or handle differently
    throw error;
  }
};

// Get Brand Assets (with defaults)
const brandAssets = {
    logoUrl: getEnvVariable('BRAND_LOGO_URL', true, 'DEFAULT_LOGO_URL_PLACEHOLDER'), // Provide a default placeholder or make mandatory
    colorPrimary: getEnvVariable('BRAND_COLOR_PRIMARY', true, '#3498DB'),
    colorSecondary: getEnvVariable('BRAND_COLOR_SECONDARY', true, '#2980B9'),
    websiteUrl: getEnvVariable('BRAND_WEBSITE_URL', true, '#'),
    appUrl: getEnvVariable('BRAND_APP_URL', true, '#'),
    dashboardUrl: getEnvVariable('BRAND_DASHBOARD_URL', true, '#'),
    currentYear: new Date().getFullYear().toString(),
};
// --- End Helper Functions ---


// --- Exported Email Functions ---
export const sendWelcomeEmail = async (user: UserDocument) => {
  if (!user || !user.email) {
      console.error("Cannot send welcome email: Invalid user object provided.");
      return;
  }
  if (!transporter) { // Check if transporter is valid before proceeding
      console.error("Welcome email not sent: Transporter not available.");
      return;
  }
  const lng = user.language || 'en'; // Use user's language, fallback to 'en'
  const fromAddress = getEnvVariable('EMAIL_FROM_NOREPLY', true) || '"Saintshub" <no-reply@example.com>'; // Fallback 'from'

  try {
    const bibleVerse = await getBibleVerse(lng);
    const subject = i18next.t('welcome_subject', { lng });
    const body = i18next.t('welcome_body_html', {
      lng,
      name: user.name,
      bibleVerse: bibleVerse,
      // Pass brand assets
      logoUrl: brandAssets.logoUrl,
      brandColorPrimary: brandAssets.colorPrimary,
      brandColorSecondary: brandAssets.colorSecondary,
      appUrl: brandAssets.appUrl,
      websiteUrl: brandAssets.websiteUrl,
      year: brandAssets.currentYear,
    });

    await sendEmail(user.email, subject, body, fromAddress);
  } catch (error) {
    // Log the error, but don't necessarily crash the calling process
    console.error(`Failed to send welcome email to ${user.email}:`, error);
  }
};

export const sendAdminNotificationEmail = async (user: UserDocument, role: string, churchSelection: string) => {
   if (!user || !user.email) {
      console.error("Cannot send admin notification: Invalid user object provided.");
      return;
   }
   if (!transporter) { // Check if transporter is valid
       console.error("Admin notification not sent: Transporter not available.");
       return;
   }
   const adminEmail = getEnvVariable('ADMIN_NOTIFICATION_EMAIL');
   if (!adminEmail) {
     console.error("ADMIN_NOTIFICATION_EMAIL environment variable is not set. Cannot send notification.");
     return;
   }
   const fromAddress = getEnvVariable('EMAIL_FROM_NOREPLY', true) || '"Saintshub" <no-reply@example.com>';

  try {
    // Admin notifications are usually in a fixed language, e.g., English
    const subject = i18next.t('admin_notification_subject', { lng: 'en' });
    const body = i18next.t('admin_notification_body_html', {
      lng: 'en',
      name: `${user.name} ${user.surname}`,
      email: user.email,
      language: user.language,
      role: role, // 'pastor' or 'it'
      churchSelection: churchSelection || 'Not specified',
      // Pass brand assets
      logoUrl: brandAssets.logoUrl,
      brandColorPrimary: brandAssets.colorPrimary,
      year: brandAssets.currentYear,
    });

    await sendEmail(adminEmail, subject, body, fromAddress);
  } catch (error) {
    console.error(`Failed to send admin notification email for ${user.email}:`, error);
  }
};

// Optional: Placeholder for future automated verification email
export const sendVerificationEmail = async (user: UserDocument, role: string, churchName: string) => {
  if (!user || !user.email) {
      console.error("Cannot send verification email: Invalid user object provided.");
      return;
  }
  if (!transporter) { // Check if transporter is valid
       console.error("Verification email not sent: Transporter not available.");
       return;
   }
  const lng = user.language || 'en';
  const fromAddress = getEnvVariable('EMAIL_FROM_ADMIN', true) || '"Saintshub Admin" <admin@example.com>';

  try {
      const subject = i18next.t('verification_subject', { lng });
      const body = i18next.t('verification_body_html', {
          lng,
          name: user.name,
          role: role,
          churchName: churchName,
          // Pass brand assets
          logoUrl: brandAssets.logoUrl,
          brandColorPrimary: brandAssets.colorPrimary,
          brandColorSecondary: brandAssets.colorSecondary,
          dashboardUrl: brandAssets.dashboardUrl,
          websiteUrl: brandAssets.websiteUrl,
          year: brandAssets.currentYear,
      });
      await sendEmail(user.email, subject, body, fromAddress);
  } catch (error) {
      console.error(`Failed to send verification email to ${user.email}:`, error);
  }
};

// --- New Modern Email Functions ---

/**
 * Send modern welcome email with beautiful template
 */
export const sendModernWelcomeEmail = async (userEmail: string, userName: string) => {
  if (!transporter) {
    console.error('Welcome email not sent: Transporter not available.');
    return;
  }

  const fromAddress = getEnvVariable('EMAIL_FROM_NOREPLY', true) || '"SaintsHub" <noreply@saintshub.com>';
  
  try {
    const htmlContent = EmailTemplates.welcomeEmailTemplate(userName, userEmail);
    await sendEmail(userEmail, 'Welcome to SaintsHub! 🙏', htmlContent, fromAddress);
    console.log(`✅ Welcome email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error(`Failed to send welcome email to ${userEmail}:`, error);
  }
};

/**
 * Send password reset email with secure reset link
 */
export const sendPasswordResetEmail = async (
  userEmail: string, 
  userName: string, 
  resetToken: string,
  expiryMinutes: number = 60
) => {
  if (!transporter) {
    console.error('Password reset email not sent: Transporter not available.');
    return;
  }

  const fromAddress = getEnvVariable('EMAIL_FROM_NOREPLY', true) || '"SaintsHub Security" <noreply@saintshub.com>';
  const baseUrl = getEnvVariable('FRONTEND_URL', false, 'https://saintshub.com');
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  const expiryTime = expiryMinutes >= 60 ? `${Math.floor(expiryMinutes / 60)} hour${Math.floor(expiryMinutes / 60) > 1 ? 's' : ''}` : `${expiryMinutes} minutes`;
  
  try {
    const htmlContent = EmailTemplates.passwordResetTemplate(userName, resetLink, expiryTime);
    await sendEmail(userEmail, 'Reset Your SaintsHub Password 🔐', htmlContent, fromAddress);
    console.log(`✅ Password reset email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error(`Failed to send password reset email to ${userEmail}:`, error);
  }
};

/**
 * Send admin request pending email (for Pastor/IT roles)
 */
export const sendAdminRequestPendingEmail = async (
  userEmail: string,
  userName: string,
  requestedRole: 'Pastor' | 'IT' | 'Admin'
) => {
  if (!transporter) {
    console.error('Admin request email not sent: Transporter not available.');
    return;
  }

  const fromAddress = getEnvVariable('EMAIL_FROM_ADMIN', true) || '"SaintsHub Admin" <admin@saintshub.com>';
  
  try {
    const htmlContent = EmailTemplates.adminRequestPendingTemplate(userName, requestedRole);
    await sendEmail(userEmail, 'Admin Access Request Received 👨‍💼', htmlContent, fromAddress);
    console.log(`✅ Admin request pending email sent to ${userEmail}`);
  } catch (error) {
    console.error(`Failed to send admin request email to ${userEmail}:`, error);
  }
};

/**
 * Send admin approved email
 */
export const sendAdminApprovedEmail = async (
  userEmail: string,
  userName: string,
  role: string
) => {
  if (!transporter) {
    console.error('Admin approved email not sent: Transporter not available.');
    return;
  }

  const fromAddress = getEnvVariable('EMAIL_FROM_ADMIN', true) || '"SaintsHub Admin" <admin@saintshub.com>';
  
  try {
    const htmlContent = EmailTemplates.adminApprovedTemplate(userName, role);
    await sendEmail(userEmail, 'Congratulations! Admin Access Granted 🎉', htmlContent, fromAddress);
    console.log(`✅ Admin approved email sent to ${userEmail}`);
  } catch (error) {
    console.error(`Failed to send admin approved email to ${userEmail}:`, error);
  }
};

/**
 * Send profile update confirmation email
 */
export const sendProfileUpdateEmail = async (
  userEmail: string,
  userName: string,
  updatedField: string,
  oldValue: string,
  newValue: string
) => {
  if (!transporter) {
    console.error('Profile update email not sent: Transporter not available.');
    return;
  }

  const fromAddress = getEnvVariable('EMAIL_FROM_NOREPLY', true) || '"SaintsHub" <noreply@saintshub.com>';
  
  try {
    const htmlContent = EmailTemplates.profileUpdateTemplate(userName, updatedField, oldValue, newValue);
    await sendEmail(userEmail, `Your ${updatedField} Has Been Updated ✏️`, htmlContent, fromAddress);
    console.log(`✅ Profile update email sent to ${userEmail}`);
  } catch (error) {
    console.error(`Failed to send profile update email to ${userEmail}:`, error);
  }
};

/**
 * Send security alert email
 */
export const sendSecurityAlertEmail = async (
  userEmail: string,
  userName: string,
  alertType: string,
  details: string,
  actionUrl?: string
) => {
  if (!transporter) {
    console.error('Security alert email not sent: Transporter not available.');
    return;
  }

  const fromAddress = getEnvVariable('EMAIL_FROM_ADMIN', true) || '"SaintsHub Security" <security@saintshub.com>';
  
  try {
    const htmlContent = EmailTemplates.securityAlertTemplate(userName, alertType, details, actionUrl);
    await sendEmail(userEmail, '🚨 Security Alert for Your SaintsHub Account', htmlContent, fromAddress);
    console.log(`✅ Security alert email sent to ${userEmail}`);
  } catch (error) {
    console.error(`Failed to send security alert email to ${userEmail}:`, error);
  }
};

// --- End Exported Email Functions ---