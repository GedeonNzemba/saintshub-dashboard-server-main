# 📧 SaintsHub Email System Documentation

## Overview
Modern, beautiful, and responsive email templates for all user interactions.

---

## 🎨 Email Templates

### 1. **Welcome Email** 🙏
**When to Send:** Immediately after user signs up
**Template:** `sendModernWelcomeEmail()`

```typescript
import { sendModernWelcomeEmail } from '../services/emailService';

// In your signup controller
await sendModernWelcomeEmail(user.email, user.name);
```

**Features:**
- Beautiful gradient header with emoji logo
- Lists all available features
- Call-to-action button to dashboard
- Responsive design

---

### 2. **Password Reset Email** 🔐
**When to Send:** User requests password reset
**Template:** `sendPasswordResetEmail()`

```typescript
import { sendPasswordResetEmail } from '../services/emailService';

// Generate reset token (implement your own token generation)
const resetToken = generateResetToken(user._id);

// Send email with 60-minute expiry (default)
await sendPasswordResetEmail(
  user.email, 
  user.name, 
  resetToken,
  60 // expiry in minutes
);
```

**Features:**
- Secure reset link
- Expiry time displayed
- Security tips included
- Warning if user didn't request

**Implementation Steps:**
1. Create reset token with crypto
2. Store token in database with expiry
3. Send email with token
4. Verify token on reset page
5. Invalidate token after use

---

### 3. **Admin Request Pending** 👨‍💼
**When to Send:** User signs up and selects Pastor or IT role
**Template:** `sendAdminRequestPendingEmail()`

```typescript
import { sendAdminRequestPendingEmail } from '../services/emailService';

// In signup controller, if user selects admin role
if (user.role === 'Pastor' || user.role === 'IT') {
  await sendAdminRequestPendingEmail(
    user.email, 
    user.name, 
    user.role
  );
}
```

**Features:**
- Explains what happens next
- Lists features they'll unlock
- Estimated review time (24-48 hours)
- Contact information

---

### 4. **Admin Approved Email** 🎉
**When to Send:** When admin manually approves user (changes admin: false → true)
**Template:** `sendAdminApprovedEmail()`

```typescript
import { sendAdminApprovedEmail } from '../services/emailService';

// Manual approval (you can create an admin endpoint)
// PUT /api/admin/approve-user/:userId
router.put('/approve-user/:userId', async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { admin: true },
    { new: true }
  );
  
  // Send approval email
  await sendAdminApprovedEmail(user.email, user.name, user.role);
  
  res.json({ message: 'User approved successfully' });
});
```

**Features:**
- Congratulatory message
- Lists all admin privileges
- Direct link to admin dashboard
- Getting started guide link

**Automation Option:**
You can automate this with a cron job or manual admin panel. Current implementation is manual via MongoDB, but you can build an admin approval system.

---

### 5. **Profile Update Confirmation** ✏️
**When to Send:** User updates their profile (username, email, etc.)
**Template:** `sendProfileUpdateEmail()`

```typescript
import { sendProfileUpdateEmail } from '../services/emailService';

// In your update profile controller
const oldUsername = user.name;
user.name = req.body.name; // New name
await user.save();

// Send confirmation
await sendProfileUpdateEmail(
  user.email,
  user.name,
  'Username',
  oldUsername,
  user.name
);
```

**Use Cases:**
- Username changed
- Email changed (send to OLD email)
- Password changed
- Phone number updated
- Any sensitive field update

**Features:**
- Shows what changed (old → new)
- Timestamp of change
- Security warning if unauthorized
- Quick access to settings

---

### 6. **Security Alert Email** 🚨
**When to Send:** Suspicious activity detected
**Template:** `sendSecurityAlertEmail()`

```typescript
import { sendSecurityAlertEmail } from '../services/emailService';

// Example: Login from new device/location
await sendSecurityAlertEmail(
  user.email,
  user.name,
  'New Login Detected',
  `We detected a login to your account from ${ipAddress} in ${location} on ${new Date().toLocaleString()}`,
  'https://saintshub.com/security/activity'
);
```

**Use Cases:**
- Login from new device/location
- Multiple failed login attempts
- Account locked due to suspicious activity
- API key compromised
- Unauthorized access attempt

**Features:**
- Red alert design
- Clear action steps
- Security tips
- Direct link to review activity

---

## 🔧 Implementation Guide

### Step 1: Update Signup Controller

```typescript
// src/controllers/userController.ts
import { 
  sendModernWelcomeEmail, 
  sendAdminRequestPendingEmail 
} from '../services/emailService';

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Create user
    const user = new User({ name, email, password, role });
    await user.save();
    
    // Send welcome email
    await sendModernWelcomeEmail(email, name);
    
    // If admin role requested, send pending email
    if (role === 'Pastor' || role === 'IT') {
      await sendAdminRequestPendingEmail(email, name, role);
    }
    
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Signup failed' });
  }
};
```

### Step 2: Create Password Reset Endpoint

```typescript
// src/controllers/authController.ts
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/emailService';

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If email exists, reset link sent' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Save to user document
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();
    
    // Send email
    await sendPasswordResetEmail(user.email, user.name, resetToken, 60);
    
    res.json({ message: 'Reset link sent to email' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reset email' });
  }
};
```

### Step 3: Create Admin Approval Endpoint

```typescript
// src/routes/adminRoutes.ts
import express from 'express';
import { sendAdminApprovedEmail } from '../services/emailService';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

// Approve user for admin access
router.put('/approve-user/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.admin) {
      return res.status(400).json({ error: 'User is already an admin' });
    }
    
    // Update admin status
    user.admin = true;
    await user.save();
    
    // Send approval email
    await sendAdminApprovedEmail(user.email, user.name, user.role || 'Admin');
    
    res.json({ 
      message: 'User approved successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        admin: user.admin
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// Get pending admin requests
router.get('/pending-requests', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pendingUsers = await User.find({
      admin: false,
      role: { $in: ['Pastor', 'IT'] }
    }).select('name email role createdAt');
    
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

export default router;
```

### Step 4: Update Profile Controller

```typescript
// src/controllers/userController.ts
import { sendProfileUpdateEmail } from '../services/emailService';

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Track changes
    if (name && name !== user.name) {
      const oldName = user.name;
      user.name = name;
      await user.save();
      await sendProfileUpdateEmail(user.email, user.name, 'Username', oldName, name);
    }
    
    if (email && email !== user.email) {
      const oldEmail = user.email;
      user.email = email;
      await user.save();
      // Send to OLD email for security
      await sendProfileUpdateEmail(oldEmail, user.name, 'Email Address', oldEmail, email);
    }
    
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
```

---

## 🎨 Template Customization

### Colors
Edit `src/templates/emailTemplates.ts`:

```typescript
const colors = {
  primary: '#6366f1', // Change to your brand color
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  // ... more colors
};
```

### Logo
Currently using emoji (🙏). To use your logo:

```typescript
// In emailTemplates.ts, replace:
<div class="logo">🙏</div>

// With:
<div class="logo">
  <img src="https://your-domain.com/logo.png" alt="SaintsHub" width="60" height="60">
</div>
```

---

## 📊 Email Tracking (Future Enhancement)

Add tracking to monitor email opens and clicks:

```typescript
// Add tracking pixel
const trackingPixel = `<img src="${baseUrl}/track/${userId}/${emailType}" width="1" height="1" style="display:none;">`;

// Track link clicks
const trackedLink = `${baseUrl}/track/click?url=${encodeURIComponent(originalUrl)}&user=${userId}`;
```

---

## 🔒 Security Best Practices

1. **Rate Limiting:** Limit password reset requests per IP/email
2. **Token Expiry:** Always set short expiry times (1 hour max)
3. **One-Time Use:** Invalidate tokens after use
4. **Secure Links:** Use HTTPS for all links
5. **Email Validation:** Verify email addresses before sending
6. **Avoid PII:** Don't include sensitive data in emails

---

## 🧪 Testing Emails

### Development Testing

```typescript
// In development, log emails instead of sending
if (process.env.NODE_ENV === 'development') {
  console.log('📧 Email Preview:', {
    to: userEmail,
    subject: 'Test Email',
    html: htmlContent
  });
}
```

### Email Preview Tools
- [Litmus](https://litmus.com)
- [Email on Acid](https://www.emailonacid.com)
- [Mailtrap](https://mailtrap.io) (for testing)

---

## 📝 Environment Variables

Add these to your `.env` file:

```env
# Frontend URL for links
FRONTEND_URL=https://saintshub.com

# Email addresses
EMAIL_FROM_NOREPLY="SaintsHub <noreply@saintshub.com>"
EMAIL_FROM_ADMIN="SaintsHub Admin <admin@saintshub.com>"
```

---

## 🚀 Next Steps

1. ✅ Templates created
2. ⚠️ Update User model to include reset token fields
3. ⚠️ Create admin approval endpoints
4. ⚠️ Update signup controller
5. ⚠️ Create password reset flow
6. ⚠️ Test all email scenarios
7. ⚠️ Add your logo
8. ⚠️ Customize colors

---

## 📞 Support

For questions or issues with the email system:
- Review this documentation
- Check email logs in console
- Verify SMTP configuration
- Test with a single email first

**Happy Emailing! 📧✨**
