#  Automatic EmailJS Setup for Referral Notifications

This guide will help you set up automatic email notifications to psychiatrists when referrals are created.

## Overview

The system uses EmailJS to send automated emails to psychiatrists when referrals are created. This ensures immediate notification and faster response times.

## Prerequisites

1. **EmailJS Account**: Sign up at [https://www.emailjs.com/](https://www.emailjs.com/)
2. **Email Service**: Gmail, Outlook, or any SMTP-compatible email service

## Setup Steps

### 1. Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Add Email Service

1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail recommended)
4. Follow the authentication steps
5. Note down your **Service ID**

### 3. Create Email Template

1. Go to **Email Templates** in EmailJS dashboard
2. Click **Create New Template**
3. Use this template structure:

```
Subject: Psychiatric Referral - {{student_name}} ({{urgency_level}} Priority)

Dear Dr. {{to_name}},

We are referring {{student_name}} ({{student_email}}) for psychiatric evaluation and treatment.

REFERRAL DETAILS:
- Student: {{student_name}}
- Email: {{student_email}}
- Urgency Level: {{urgency_level}}
- Referral Date: {{referral_date}}

REASON FOR REFERRAL:
{{referral_reason}}

Please contact the student directly or reach out to our guidance team for additional information.

Best regards,
{{from_name}}
```

4. Save the template and note down your **Template ID**

### 4. Get Public Key

1. Go to **Account** > **General**
2. Find your **Public Key**
3. Copy this key

### 5. Update Application Configuration

Update the following files with your EmailJS credentials:

**src/admin/components/Referral.tsx** (lines 67-69):
```typescript
const EMAILJS_SERVICE_ID = 'your_service_id_here';
const EMAILJS_TEMPLATE_ID = 'your_template_id_here';
const EMAILJS_PUBLIC_KEY = 'your_public_key_here';
```

**src/guidance/components/Referral.tsx** (lines 67-69):
```typescript
const EMAILJS_SERVICE_ID = 'your_service_id_here';
const EMAILJS_TEMPLATE_ID = 'your_template_id_here';
const EMAILJS_PUBLIC_KEY = 'your_public_key_here';
```

### 6. Test Email Functionality

1. Create a test referral with a valid psychiatrist email
2. Check that the email is sent automatically
3. Verify the email content and formatting

## How It Works

1. **Referral Creation**: When a referral is created, the system automatically:
   - Saves referral data to database
   - Sends email notification to psychiatrist
   - Updates referral status with email sent confirmation
   - Shows success/failure message to user

2. **Email Content**: Includes all referral details:
   - Student information
   - Psychiatrist contact details
   - Referral reason and urgency level
   - Professional formatting

3. **Error Handling**: If email fails:
   - Referral is still saved successfully
   - User is notified that manual email is needed
   - Error is logged for troubleshooting

## Template Variables

The email template uses these variables:

- `{{to_email}}` - Psychiatrist's email address
- `{{to_name}}` - Psychiatrist's name
- `{{student_name}}` - Student's full name
- `{{student_email}}` - Student's email address
- `{{referral_reason}}` - Reason for referral
- `{{urgency_level}}` - Urgency level (CRITICAL, HIGH, MEDIUM, LOW)
- `{{psychiatrist_phone}}` - Psychiatrist's phone number
- `{{referral_date}}` - Date of referral
- `{{from_name}}` - System name (Anxiety Support System)

## Troubleshooting

### Email Not Sending

1. **Check Browser Console**: Look for error messages
2. **Verify Credentials**: Ensure Service ID, Template ID, and Public Key are correct
3. **Check Email Service**: Verify your email service is properly connected in EmailJS
4. **Rate Limits**: EmailJS free plan has monthly sending limits

### Email in Spam Folder

1. **Email Content**: Professional content reduces spam likelihood
2. **Sender Reputation**: Use established email services (Gmail, Outlook)
3. **Template Testing**: Test with different email providers

### Configuration Issues

1. **Variable Names**: Ensure all template variables match exactly
2. **Template Structure**: Verify template is saved correctly in EmailJS
3. **Service Connection**: Check that email service is active

## Security & Best Practices

1. **Public Key Safety**: The public key is safe to expose in frontend code
2. **Rate Limiting**: EmailJS automatically rate limits requests
3. **Email Validation**: System validates email addresses before sending
4. **Error Logging**: Failed emails are logged for troubleshooting
5. **User Feedback**: Clear success/failure messages for users

## Support Resources

- **EmailJS Documentation**: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
- **EmailJS Support**: Available through their dashboard
- **Browser Console**: Check for detailed error messages during testing.
