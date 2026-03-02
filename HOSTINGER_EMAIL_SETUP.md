# 🔧 Hostinger Email Setup - Troubleshooting

## ❌ Current Error
```
Error: Invalid login: 535 5.7.8 Error: authentication failed
```

This means Hostinger is rejecting the credentials.

---

## ✅ Steps to Fix

### Step 1: Verify Email Address
**Check your Hostinger email address spelling carefully!**

You mentioned: `saintshub@gedeonchirst.com` (with "I")  
But .env has: `saintshub@gedeonchrist.com` (with "H")

**Which one is correct?**
- [ ] saintshub@gedeonchir**s**t.com (with S)
- [ ] saintshub@gedeonchri**s**t.com (with H)

---

### Step 2: Check Password
**Common issues:**
- Password has special characters that need escaping
- Copy/paste added extra spaces
- Caps Lock was on when you set it

**Your password:** `ThisIsMyPass1232`

**Try logging into Hostinger webmail:**
1. Go to: https://webmail.hostinger.com
2. Email: saintshub@gedeonchrist.com (or gedeonchirst.com)
3. Password: ThisIsMyPass1232

✅ **If login works:** Credentials are correct, see Step 3  
❌ **If login fails:** Password is wrong, reset it

---

### Step 3: Enable SMTP Access (If Needed)

Some Hostinger accounts require enabling SMTP:

1. **Login to hPanel** (Hostinger control panel)
2. Go to **Emails** → **Email Accounts**
3. Find: `saintshub@gedeonchrist.com`
4. Click **Manage**
5. Look for **SMTP Settings** or **External Email Client**
6. Make sure it's **Enabled**

---

### Step 4: Try Alternative Port

If port 465 doesn't work, try port 587:

**Update `.env` to:**
```env
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_SECURE=false # Use STARTTLS instead of SSL
EMAIL_USER=saintshub@gedeonchrist.com
EMAIL_PASS=ThisIsMyPass1232
```

---

### Step 5: Check for Two-Factor Authentication

If you have 2FA enabled on your Hostinger account:

1. You may need an **App-Specific Password**
2. Go to Hostinger hPanel
3. Security Settings
4. Generate App Password for "SMTP"
5. Use that password instead

---

### Step 6: Verify Domain Spelling

**Check these match:**
- Your actual domain name
- The email address in Hostinger
- The email in `.env` file

**Common typos:**
- gedeonchri**s**t.com ✅
- gedeonchri**st**.com ✅  
- gedeonchi**r**st.com ❌

---

## 🧪 Quick Test

After fixing the credentials, test with this command:

```bash
npm run dev
```

**Look for:**
```
Mail transporter configured successfully. Ready to send emails.
```

**Not this:**
```
Error configuring mail transporter: Error: Invalid login
```

---

## 📧 Alternative Quick Test

Use this PowerShell script to test SMTP directly:

```powershell
# Save as test-smtp.ps1
$EmailFrom = "saintshub@gedeonchrist.com"
$EmailTo = "your-test-email@gmail.com"
$Subject = "Test Email from Hostinger"
$Body = "This is a test"
$SMTPServer = "smtp.hostinger.com"
$SMTPPort = 465
$Username = "saintshub@gedeonchrist.com"
$Password = "ThisIsMyPass1232"

try {
    $SMTPClient = New-Object Net.Mail.SmtpClient($SMTPServer, $SMTPPort)
    $SMTPClient.EnableSsl = $true
    $SMTPClient.Credentials = New-Object System.Net.NetworkCredential($Username, $Password)
    $SMTPClient.Send($EmailFrom, $EmailTo, $Subject, $Body)
    Write-Host "✅ Email sent successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 📋 Checklist

Before continuing, verify:

- [ ] Email address is spelled correctly
- [ ] Password is correct (test in webmail)
- [ ] SMTP is enabled in Hostinger hPanel
- [ ] No 2FA blocking (or use app password)
- [ ] Port 465 or 587 is not blocked by firewall
- [ ] Domain name matches exactly

---

## 🆘 Still Not Working?

### Option 1: Contact Hostinger Support
They can verify:
- If SMTP is enabled for your account
- If there are any restrictions
- Correct SMTP settings

### Option 2: Use Brevo Free Tier
While you troubleshoot Hostinger:
- Sign up: https://www.brevo.com
- Get 300 emails/day FREE
- Takes 5 minutes to set up
- No credit card needed

### Option 3: Verify Email Settings in hPanel
1. Login to hPanel
2. Emails → Email Accounts
3. Click on your email
4. Check "Configuration" tab
5. Verify SMTP settings match

---

## 🔄 Once Fixed

After you fix the credentials:

1. Update `.env` with correct email/password
2. Restart server: `npm run dev`
3. Test signup to send welcome email
4. Check if email arrives

---

## 💬 Tell Me

**What did you find?**
1. Is the email address spelled correctly?
2. Did webmail login work?
3. Is SMTP enabled in hPanel?
4. Any 2FA or app password needed?

Let me know and I'll help you fix it! 🚀
