/**
 * Modern Email Templates for SaintsHub
 * Beautiful, responsive HTML email templates with dark/light theme support
 */

// Brand colors
const colors = {
  primary: '#6366f1', // Indigo
  success: '#10b981', // Green
  warning: '#f59e0b', // Amber
  danger: '#ef4444', // Red
  dark: '#1f2937', // Dark gray
  light: '#f9fafb', // Light gray
  white: '#ffffff',
  text: {
    dark: '#111827',
    light: '#f9fafb',
    muted: '#6b7280'
  }
};

// Base email template wrapper
const emailWrapper = (content: string, preheader: string = '') => {
  const logoUrl = process.env.BRAND_LOGO_URL || 'https://via.placeholder.com/60';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>SaintsHub</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: ${colors.light};
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: ${colors.white};
        }
        
        .header {
            background: linear-gradient(135deg, ${colors.primary} 0%, #4f46e5 100%);
            padding: 40px 20px;
            text-align: center;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            margin: 0 auto 16px;
            background-color: ${colors.white};
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .header-title {
            color: ${colors.white};
            font-size: 28px;
            font-weight: 700;
            margin: 0;
        }
        
        .content {
            padding: 40px 32px;
        }
        
        .greeting {
            font-size: 18px;
            color: ${colors.text.dark};
            margin-bottom: 16px;
            font-weight: 600;
        }
        
        .message {
            font-size: 16px;
            line-height: 1.6;
            color: ${colors.text.muted};
            margin-bottom: 24px;
        }
        
        .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, ${colors.primary} 0%, #4f46e5 100%);
            color: ${colors.white} !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: transform 0.2s;
        }
        
        .button:hover {
            transform: translateY(-2px);
        }
        
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        
        .info-box {
            background-color: ${colors.light};
            border-left: 4px solid ${colors.primary};
            padding: 16px 20px;
            margin: 24px 0;
            border-radius: 4px;
        }
        
        .warning-box {
            background-color: #fef3c7;
            border-left: 4px solid ${colors.warning};
            padding: 16px 20px;
            margin: 24px 0;
            border-radius: 4px;
        }
        
        .success-box {
            background-color: #d1fae5;
            border-left: 4px solid ${colors.success};
            padding: 16px 20px;
            margin: 24px 0;
            border-radius: 4px;
        }
        
        .footer {
            background-color: ${colors.dark};
            color: ${colors.text.light};
            padding: 32px 20px;
            text-align: center;
            font-size: 14px;
        }
        
        .footer-links {
            margin: 16px 0;
        }
        
        .footer-links a {
            color: ${colors.primary};
            text-decoration: none;
            margin: 0 12px;
        }
        
        .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 24px 0;
        }
        
        .small-text {
            font-size: 14px;
            color: ${colors.text.muted};
            line-height: 1.5;
        }
        
        @media only screen and (max-width: 600px) {
            .content {
                padding: 24px 20px;
            }
            
            .header {
                padding: 32px 20px;
            }
            
            .header-title {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}
    <div class="email-container">
        ${content}
    </div>
</body>
</html>
`;
};

// 1. Welcome Email Template
export const welcomeEmailTemplate = (userName: string, userEmail: string) => {
  const logoUrl = process.env.BRAND_LOGO_URL || 'https://via.placeholder.com/60';
  
  const content = `
    <div class="header">
        <div class="logo">
            <img src="${logoUrl}" alt="SaintsHub Logo">
        </div>
        <h1 class="header-title">Welcome to SaintsHub!</h1>
    </div>
    
    <div class="content">
        <p class="greeting">Hello ${userName}! 👋</p>
        
        <p class="message">
            We're thrilled to have you join the SaintsHub community! Your account has been successfully created.
        </p>
        
        <div class="success-box">
            <strong>✅ Account Created Successfully</strong><br>
            <span class="small-text">Email: ${userEmail}</span>
        </div>
        
        <p class="message">
            SaintsHub is your digital companion for church management, Bible study, and spiritual growth. 
            Here's what you can do now:
        </p>
        
        <ul style="color: ${colors.text.muted}; line-height: 1.8;">
            <li>📖 Read and study the Bible in multiple languages</li>
            <li>⛪ Manage church information and activities</li>
            <li>📱 Access your spiritual resources anytime, anywhere</li>
            <li>🤝 Connect with your church community</li>
        </ul>
        
        <div class="button-container">
            <a href="https://saintshub.com/dashboard" class="button">Go to Dashboard</a>
        </div>
        
        <div class="divider"></div>
        
        <p class="small-text">
            <strong>Need help getting started?</strong><br>
            Check out our <a href="https://saintshub.com/help" style="color: ${colors.primary};">Help Center</a> 
            or contact our support team.
        </p>
    </div>
    
    <div class="footer">
        <p style="margin: 0 0 16px 0; font-weight: 600;">SaintsHub</p>
        <p style="margin: 0 0 16px 0; opacity: 0.8;">Your Digital Church Companion</p>
        <div class="footer-links">
            <a href="https://saintshub.com">Website</a>
            <a href="https://saintshub.com/help">Help Center</a>
            <a href="https://saintshub.com/contact">Contact Us</a>
        </div>
        <p class="small-text" style="margin-top: 24px; opacity: 0.6;">
            © ${new Date().getFullYear()} SaintsHub. All rights reserved.
        </p>
    </div>
  `;
  
  return emailWrapper(content, 'Welcome to SaintsHub - Start your spiritual journey today!');
};

// 2. Password Reset Email Template
export const passwordResetTemplate = (userName: string, resetLink: string, expiryTime: string = '1 hour') => {
  const logoUrl = process.env.BRAND_LOGO_URL || 'https://via.placeholder.com/60';
  
  const content = `
    <div class="header">
        <div class="logo">
            <img src="${logoUrl}" alt="SaintsHub Logo">
        </div>
        <h1 class="header-title">Password Reset Request</h1>
    </div>
    
    <div class="content">
        <p class="greeting">Hello ${userName},</p>
        
        <p class="message">
            We received a request to reset your password for your SaintsHub account. 
            If you didn't make this request, you can safely ignore this email.
        </p>
        
        <div class="warning-box">
            <strong>⚠️ Security Notice</strong><br>
            <span class="small-text">This reset link will expire in ${expiryTime}. For security reasons, 
            please do not share this link with anyone.</span>
        </div>
        
        <div class="button-container">
            <a href="${resetLink}" class="button">Reset Your Password</a>
        </div>
        
        <p class="small-text" style="text-align: center; margin-top: 24px;">
            Or copy and paste this link into your browser:<br>
            <a href="${resetLink}" style="color: ${colors.primary}; word-break: break-all;">${resetLink}</a>
        </p>
        
        <div class="divider"></div>
        
        <div class="info-box">
            <strong>🛡️ Security Tips:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                <li>Never share your password with anyone</li>
                <li>Use a strong, unique password</li>
                <li>Enable two-factor authentication when available</li>
            </ul>
        </div>
        
        <p class="small-text">
            If you didn't request this password reset, please contact our support team immediately 
            at <a href="mailto:support@saintshub.com" style="color: ${colors.primary};">support@saintshub.com</a>
        </p>
    </div>
    
    <div class="footer">
        <p style="margin: 0 0 16px 0; font-weight: 600;">SaintsHub Security Team</p>
        <p class="small-text" style="opacity: 0.8;">
            This is an automated security email. Please do not reply to this message.
        </p>
        <div class="footer-links">
            <a href="https://saintshub.com/security">Security Center</a>
            <a href="https://saintshub.com/contact">Contact Support</a>
        </div>
    </div>
  `;
  
  return emailWrapper(content, 'Reset your SaintsHub password');
};

// 3. Admin Request Pending Email (for Pastor/IT roles)
export const adminRequestPendingTemplate = (userName: string, requestedRole: string) => {
  const logoUrl = process.env.BRAND_LOGO_URL || 'https://via.placeholder.com/60';
  
  const content = `
    <div class="header">
        <div class="logo">
            <img src="${logoUrl}" alt="SaintsHub Logo">
        </div>
        <h1 class="header-title">Admin Access Request</h1>
    </div>
    
    <div class="content">
        <p class="greeting">Hello ${userName},</p>
        
        <p class="message">
            Thank you for requesting <strong>${requestedRole}</strong> access on SaintsHub! 
            We've received your request and it's currently under review.
        </p>
        
        <div class="info-box">
            <strong>📋 What happens next?</strong>
            <ol style="margin: 8px 0 0 0; padding-left: 20px; line-height: 1.8;">
                <li>Our team will review your request within 24-48 hours</li>
                <li>We may contact you for additional verification</li>
                <li>Once approved, you'll receive full admin privileges</li>
                <li>You'll get a confirmation email when the review is complete</li>
            </ol>
        </div>
        
        <p class="message">
            While we process your request, you can continue using SaintsHub with your current access level. 
            Once approved, you'll unlock additional features:
        </p>
        
        <ul style="color: ${colors.text.muted}; line-height: 1.8;">
            <li>✨ Full church management capabilities</li>
            <li>👥 User management and permissions</li>
            <li>📊 Advanced analytics and reporting</li>
            <li>⚙️ System configuration and settings</li>
            <li>🔧 IT administration tools (for IT role)</li>
        </ul>
        
        <div class="warning-box">
            <strong>⏱️ Verification in Progress</strong><br>
            <span class="small-text">Estimated review time: 24-48 hours. 
            We'll notify you as soon as your request is processed.</span>
        </div>
        
        <div class="divider"></div>
        
        <p class="small-text">
            <strong>Questions about your request?</strong><br>
            Contact our admin team at 
            <a href="mailto:admin@saintshub.com" style="color: ${colors.primary};">admin@saintshub.com</a>
        </p>
    </div>
    
    <div class="footer">
        <p style="margin: 0 0 16px 0; font-weight: 600;">SaintsHub Admin Team</p>
        <p class="small-text" style="opacity: 0.8;">
            We're committed to keeping SaintsHub secure while providing you the access you need.
        </p>
        <div class="footer-links">
            <a href="https://saintshub.com/dashboard">Dashboard</a>
            <a href="https://saintshub.com/help/admin">Admin Guide</a>
            <a href="https://saintshub.com/contact">Contact Us</a>
        </div>
    </div>
  `;
  
  return emailWrapper(content, 'Your admin access request is being reviewed');
};

// 4. Admin Approved Email
export const adminApprovedTemplate = (userName: string, role: string) => {
  const logoUrl = process.env.BRAND_LOGO_URL || 'https://via.placeholder.com/60';
  
  const content = `
    <div class="header">
        <div class="logo">
            <img src="${logoUrl}" alt="SaintsHub Logo">
        </div>
        <h1 class="header-title">Admin Access Granted!</h1>
    </div>
    
    <div class="content">
        <p class="greeting">Congratulations, ${userName}! 🎊</p>
        
        <p class="message">
            Great news! Your request for <strong>${role}</strong> access has been approved. 
            You now have full admin privileges on SaintsHub!
        </p>
        
        <div class="success-box">
            <strong>✅ Admin Status: ACTIVE</strong><br>
            <span class="small-text">Role: ${role} | Access Level: Full Admin</span>
        </div>
        
        <p class="message">
            You can now access all admin features and manage your church community with ease. 
            Here's what you can do now:
        </p>
        
        <ul style="color: ${colors.text.muted}; line-height: 1.8;">
            <li>⛪ <strong>Church Management:</strong> Create, update, and manage church information</li>
            <li>👥 <strong>User Management:</strong> Approve and manage user accounts</li>
            <li>📊 <strong>Analytics:</strong> View detailed reports and insights</li>
            <li>🔔 <strong>Notifications:</strong> Send announcements to your community</li>
            <li>⚙️ <strong>Settings:</strong> Configure system preferences</li>
            ${role.toLowerCase().includes('it') ? '<li>🔧 <strong>IT Tools:</strong> Access technical configuration</li>' : ''}
        </ul>
        
        <div class="button-container">
            <a href="https://saintshub.com/admin/dashboard" class="button">Access Admin Dashboard</a>
        </div>
        
        <div class="divider"></div>
        
        <div class="info-box">
            <strong>📚 Getting Started as an Admin:</strong><br>
            <span class="small-text">
                Check out our <a href="https://saintshub.com/help/admin" style="color: ${colors.primary};">Admin Guide</a> 
                to learn about all available features and best practices.
            </span>
        </div>
        
        <p class="small-text">
            <strong>Need help?</strong> Our admin support team is here to assist you at 
            <a href="mailto:admin@saintshub.com" style="color: ${colors.primary};">admin@saintshub.com</a>
        </p>
    </div>
    
    <div class="footer">
        <p style="margin: 0 0 16px 0; font-weight: 600;">Welcome to the SaintsHub Admin Team! 🙌</p>
        <p class="small-text" style="opacity: 0.8;">
            With great power comes great responsibility. Let's build an amazing community together!
        </p>
        <div class="footer-links">
            <a href="https://saintshub.com/admin">Admin Panel</a>
            <a href="https://saintshub.com/help/admin">Admin Guide</a>
            <a href="https://saintshub.com/community">Community</a>
        </div>
    </div>
  `;
  
  return emailWrapper(content, 'You are now a SaintsHub admin!');
};

// 5. Profile Update Confirmation
export const profileUpdateTemplate = (userName: string, updatedField: string, oldValue: string, newValue: string) => {
  const logoUrl = process.env.BRAND_LOGO_URL || 'https://via.placeholder.com/60';
  
  const content = `
    <div class="header">
        <div class="logo">
            <img src="${logoUrl}" alt="SaintsHub Logo">
        </div>
        <h1 class="header-title">Profile Updated</h1>
    </div>
    
    <div class="content">
        <p class="greeting">Hello ${userName},</p>
        
        <p class="message">
            This is a confirmation that your profile has been successfully updated.
        </p>
        
        <div class="info-box">
            <strong>🔄 What Changed:</strong><br><br>
            <strong>${updatedField}:</strong><br>
            <span class="small-text">
                From: <s>${oldValue}</s><br>
                To: <strong>${newValue}</strong>
            </span>
        </div>
        
        <p class="message">
            This change was made on ${new Date().toLocaleString('en-US', { 
              dateStyle: 'full', 
              timeStyle: 'short' 
            })}.
        </p>
        
        <div class="warning-box">
            <strong>⚠️ Didn't make this change?</strong><br>
            <span class="small-text">
                If you didn't authorize this update, please secure your account immediately and 
                contact our support team.
            </span>
        </div>
        
        <div class="button-container">
            <a href="https://saintshub.com/profile/settings" class="button">View Profile Settings</a>
        </div>
        
        <div class="divider"></div>
        
        <p class="small-text">
            <strong>Security reminder:</strong> Always keep your account information up to date and 
            notify us immediately if you notice any unauthorized changes.
        </p>
    </div>
    
    <div class="footer">
        <p style="margin: 0 0 16px 0; font-weight: 600;">SaintsHub Account Security</p>
        <div class="footer-links">
            <a href="https://saintshub.com/profile">Profile</a>
            <a href="https://saintshub.com/security">Security Settings</a>
            <a href="https://saintshub.com/contact">Report Issue</a>
        </div>
    </div>
  `;
  
  return emailWrapper(content, `Your ${updatedField} has been updated`);
};

// 6. Security Alert Email
export const securityAlertTemplate = (userName: string, alertType: string, details: string, actionUrl?: string) => {
  const logoUrl = process.env.BRAND_LOGO_URL || 'https://via.placeholder.com/60';
  
  const content = `
    <div class="header" style="background: linear-gradient(135deg, ${colors.danger} 0%, #dc2626 100%);">
        <div class="logo">
            <img src="${logoUrl}" alt="SaintsHub Logo">
        </div>
        <h1 class="header-title">Security Alert</h1>
    </div>
    
    <div class="content">
        <p class="greeting">Hello ${userName},</p>
        
        <p class="message">
            We detected unusual activity on your SaintsHub account that requires your attention.
        </p>
        
        <div class="warning-box" style="background-color: #fee2e2; border-color: ${colors.danger};">
            <strong>🚨 ${alertType}</strong><br>
            <span class="small-text">${details}</span>
        </div>
        
        <p class="message">
            <strong>What should you do?</strong>
        </p>
        
        <ul style="color: ${colors.text.muted}; line-height: 1.8;">
            <li>Review your recent account activity</li>
            <li>Change your password if you don't recognize this activity</li>
            <li>Enable two-factor authentication for extra security</li>
            <li>Contact support if you need assistance</li>
        </ul>
        
        ${actionUrl ? `
        <div class="button-container">
            <a href="${actionUrl}" class="button" style="background: linear-gradient(135deg, ${colors.danger} 0%, #dc2626 100%);">
                Review Activity
            </a>
        </div>
        ` : ''}
        
        <div class="divider"></div>
        
        <div class="info-box">
            <strong>🛡️ Account Security Tips:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                <li>Use a strong, unique password</li>
                <li>Never share your login credentials</li>
                <li>Be cautious of phishing attempts</li>
                <li>Log out from shared devices</li>
            </ul>
        </div>
        
        <p class="small-text">
            <strong>Need immediate help?</strong><br>
            Contact our security team: 
            <a href="mailto:security@saintshub.com" style="color: ${colors.danger};">security@saintshub.com</a>
        </p>
    </div>
    
    <div class="footer">
        <p style="margin: 0 0 16px 0; font-weight: 600;">SaintsHub Security Team</p>
        <p class="small-text" style="opacity: 0.8;">
            This is an important security notification. We take your account safety seriously.
        </p>
        <div class="footer-links">
            <a href="https://saintshub.com/security">Security Center</a>
            <a href="https://saintshub.com/help/security">Security FAQ</a>
            <a href="https://saintshub.com/contact">Contact Security</a>
        </div>
    </div>
  `;
  
  return emailWrapper(content, 'Important: Security alert for your account');
};
