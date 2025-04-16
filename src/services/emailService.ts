import nodemailer from 'nodemailer';
import axios from 'axios';
import i18next, { Resource } from 'i18next';
import path from 'path';
import fs from 'fs';
import { UserDocument } from '../models/User'; // Adjust path if needed

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

const mailtrapConfig = {
  host: process.env.NODE_ENV === 'production'
    ? getEnvVariable('MAILTRAP_PROD_HOST')
    : getEnvVariable('MAILTRAP_HOST'),
  port: parseInt(
    (process.env.NODE_ENV === 'production'
      ? getEnvVariable('MAILTRAP_PROD_PORT')
      : getEnvVariable('MAILTRAP_PORT')) || '2525', // Default port if not set
    10
  ),
  auth: {
    user: process.env.NODE_ENV === 'production'
      ? getEnvVariable('MAILTRAP_PROD_USER')
      : getEnvVariable('MAILTRAP_USER'),
    pass: process.env.NODE_ENV === 'production'
      ? getEnvVariable('MAILTRAP_PROD_PASS')
      : getEnvVariable('MAILTRAP_PASS'),
  },
  // Optional: Add secure connection for production if needed (e.g., for port 465)
  secure: process.env.NODE_ENV === 'production' && process.env.MAILTRAP_PROD_PORT === '465',
};

let transporter: nodemailer.Transporter | null = null;

// Only create transporter if config is valid
if (mailtrapConfig.host && mailtrapConfig.port && mailtrapConfig.auth.user && mailtrapConfig.auth.pass) {
    transporter = nodemailer.createTransport(mailtrapConfig);

    transporter.verify((error, success) => {
      if (error) {
        console.error('Error configuring mail transporter:', error);
        transporter = null; // Invalidate transporter on error
      } else {
        console.log('Mail transporter configured successfully. Ready to send emails.');
      }
    });
} else {
    console.error("Mailtrap environment variables are not fully configured! Email functionality will be disabled.");
}
// --- End Nodemailer Configuration ---


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
// --- End Exported Email Functions --- 