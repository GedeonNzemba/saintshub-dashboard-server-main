# 📧 Email System Quick Reference

## Import Statement
```typescript
import {
  sendModernWelcomeEmail,
  sendPasswordResetEmail,
  sendAdminRequestPendingEmail,
  sendAdminApprovedEmail,
  sendProfileUpdateEmail,
  sendSecurityAlertEmail
} from '../services/emailService';
```

---

## 1. Welcome Email 🙏
```typescript
await sendModernWelcomeEmail(
  'user@example.com',  // User email
  'John Doe'            // User name
);
```

---

## 2. Password Reset 🔐
```typescript
await sendPasswordResetEmail(
  'user@example.com',   // User email
  'John Doe',           // User name
  'abc123token',        // Reset token
  60                     // Expiry in minutes (optional, default: 60)
);
```

---

## 3. Admin Request Pending 👨‍💼
```typescript
await sendAdminRequestPendingEmail(
  'pastor@example.com', // User email
  'John Doe',           // User name
  'Pastor'              // Role: 'Pastor' | 'IT' | 'Admin'
);
```

---

## 4. Admin Approved 🎉
```typescript
await sendAdminApprovedEmail(
  'pastor@example.com', // User email
  'John Doe',           // User name
  'Pastor'              // Role
);
```

---

## 5. Profile Update ✏️
```typescript
await sendProfileUpdateEmail(
  'user@example.com',   // User email
  'John Doe',           // User name
  'Username',           // Field that changed
  'OldName',            // Old value
  'NewName'             // New value
);
```

---

## 6. Security Alert 🚨
```typescript
await sendSecurityAlertEmail(
  'user@example.com',   // User email
  'John Doe',           // User name
  'New Login Detected', // Alert type
  'Login from new IP: 192.168.1.1', // Details
  'https://saintshub.com/security'  // Action URL (optional)
);
```

---

## Example: Signup Controller
```typescript
export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Create user
    const user = new User({ name, email, password, role });
    await user.save();
    
    // 1. Send welcome email
    await sendModernWelcomeEmail(email, name);
    
    // 2. If admin role requested, send pending email
    if (role === 'Pastor' || role === 'IT') {
      await sendAdminRequestPendingEmail(email, name, role);
    }
    
    res.status(201).json({ 
      message: 'Account created successfully',
      user: { id: user._id, name, email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Signup failed' });
  }
};
```

---

## Example: Approve Admin
```typescript
// PUT /api/admin/approve/:userId
export const approveAdmin = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update admin status
    user.admin = true;
    await user.save();
    
    // Send approval email
    await sendAdminApprovedEmail(user.email, user.name, user.role || 'Admin');
    
    res.json({ message: 'User approved successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve user' });
  }
};
```

---

## Example: Update Profile
```typescript
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user.id);
    const { name } = req.body;
    
    if (name && name !== user.name) {
      const oldName = user.name;
      user.name = name;
      await user.save();
      
      // Send update confirmation
      await sendProfileUpdateEmail(
        user.email,
        name,
        'Username',
        oldName,
        name
      );
    }
    
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
};
```

---

## Files Created

1. **`src/templates/emailTemplates.ts`** - All email templates
2. **`EMAIL_SYSTEM_GUIDE.md`** - Complete documentation
3. **`EMAIL_SYSTEM_SUMMARY.md`** - Quick overview
4. **`EMAIL_QUICK_REFERENCE.md`** - This file (copy/paste examples)

---

## Template Features

✅ Mobile responsive  
✅ Modern gradient design  
✅ Professional typography  
✅ Clear call-to-action buttons  
✅ Security warnings where needed  
✅ Footer with links  
✅ Emoji logos (customizable)  
✅ Brand colors (customizable)

---

## Customize

**Add Logo:** Edit `src/templates/emailTemplates.ts` → Replace `<div class="logo">🙏</div>`

**Change Colors:** Edit `colors` object in `emailTemplates.ts`

**Update Links:** Change URLs in template functions

---

## Testing

```typescript
// Test in development
if (process.env.NODE_ENV === 'development') {
  console.log('📧 Email would be sent:', { to, subject });
}

// Test with your email
await sendModernWelcomeEmail('your@email.com', 'Test User');
```

---

**Ready to use! Copy any example above and integrate into your controllers. 🚀**
