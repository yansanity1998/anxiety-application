# Resend Email API Setup Guide

This guide will help you set up the Resend email API to send referral emails directly to psychiatrists' Gmail/email addresses.

## Why Resend?

- **Excellent Deliverability**: Resend has a 99%+ deliverability rate to Gmail, Outlook, and other major email providers
- **Developer-Friendly**: Simple API with great documentation
- **Reliable**: Built for transactional emails with enterprise-grade infrastructure
- **Direct Integration**: Sends emails directly to the recipient's inbox without intermediate services

## Setup Steps

### 1. Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key

1. In your Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name (e.g., "Anxiety App Referrals")
4. Copy the API key (starts with e_)

### 3. Set Up Your Domain (Optional but Recommended)

For production use, you should verify your own domain:

1. Go to **Domains** in your Resend dashboard
2. Click **Add Domain**
3. Follow the DNS setup instructions
4. Wait for verification (usually takes a few minutes)

### 4. Configure Environment Variables

Create a .env.local file in your project root:

`env
# Resend API Configuration
VITE_RESEND_API_KEY=re_your_api_key_here
VITE_FROM_EMAIL=noreply@yourdomain.com
`

**Important**: Replace yourdomain.com with your verified domain from step 3.

### 5. Test the Integration

1. Start your development server: 
pm run dev
2. Go to the Referral section
3. Create a test referral
4. Check the browser console for email sending logs
5. Verify the email arrives in the psychiatrist's inbox

## Email Features

### What the Email Contains

- **Professional HTML formatting** with your branding
- **Student information** (name, email, urgency level)
- **Detailed referral reason**
- **Contact information** for the psychiatrist
- **Reply-to address** set to the student's email for direct communication
- **Fallback to mailto** if the API fails

### Email Template

The email includes:
- Clean, professional design
- Urgency level badges with color coding
- All referral details in an organized format
- Contact information for follow-up
- Professional signature from your system

## Troubleshooting

### Common Issues

1. **"Invalid API Key" Error**
   - Check that your API key is correct
   - Ensure it starts with e_
   - Verify the key is active in your Resend dashboard

2. **"Domain not verified" Error**
   - Set up domain verification in Resend
   - Or use the default Resend domain for testing

3. **Emails not arriving**
   - Check spam/junk folders
   - Verify the recipient email address is correct
   - Check Resend dashboard for delivery logs

4. **CORS Errors**
   - Ensure you're using the correct API endpoint
   - Check that your API key is properly configured

### Fallback System

If Resend fails for any reason, the system automatically falls back to opening the user's default email client with a pre-filled email. This ensures referrals can always be sent.

## Production Considerations

### Security
- Never commit your API key to version control
- Use environment variables for all sensitive data
- Consider using different API keys for development and production

### Monitoring
- Monitor your Resend dashboard for delivery rates
- Set up webhooks for delivery notifications (optional)
- Track bounce rates and spam complaints

### Scaling
- Resend's free tier includes 3,000 emails/month
- Paid plans start at /month for 50,000 emails
- No rate limits on the free tier

## Support

- **Resend Documentation**: [https://resend.com/docs](https://resend.com/docs)
- **Resend Support**: Available through their dashboard
- **API Reference**: [https://resend.com/docs/api-reference](https://resend.com/docs/api-reference)

## Migration from EmailJS

The new system is a drop-in replacement for EmailJS. No changes are needed to your existing referral forms or database structure. The new email service provides:

- Better deliverability
- More reliable delivery
- Professional email templates
- Direct Gmail integration
- Better error handling
