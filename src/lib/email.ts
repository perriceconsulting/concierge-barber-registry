import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    console.log('⚠️  Email service not configured. RESEND_API_KEY is missing.');
    console.log('📧 Email would have been sent to:', to);
    console.log('📝 Subject:', subject);
    return { success: false, message: 'Email service not configured' };
  }

  // In development without domain verification, Resend only allows sending to verified email
  const isDevelopment = process.env.NODE_ENV === 'development';
  const verifiedEmail = 'perriceconsulting@gmail.com';

  if (isDevelopment && to !== verifiedEmail) {
    console.log('🔧 Development mode: Redirecting email to verified address');
    console.log(`📧 Original recipient: ${to}`);
    console.log(`📧 Sending to verified email instead: ${verifiedEmail}`);
    console.log('📝 Subject:', subject);
    // Override recipient to verified email in development
    to = verifiedEmail;
  }

  try {
    console.log('📧 Sending email to:', to);
    console.log('📝 Subject:', subject);
    console.log('📤 From:', process.env.EMAIL_FROM || 'onboarding@resend.dev');

    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to,
      subject,
      html,
    });

    console.log('✅ Email sent successfully!', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return { success: false, error };
  }
}

export function getWelcomeEmailHtml(firstName: string, role: 'client' | 'barber') {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (role === 'barber') {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Concierge Barber Registry</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #7c2d12; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to Concierge Barber Registry!</h1>
          </div>

          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${firstName},</p>

            <p>Thank you for joining Concierge Barber Registry as a barber! We're excited to have you on board.</p>

            <p><strong>Next steps:</strong></p>
            <ol style="padding-left: 20px;">
              <li>Complete your barber profile with your bio, specialties, and services</li>
              <li>Upload portfolio images showcasing your best work</li>
              <li>Set your operating hours so clients know when you're available</li>
              <li>Wait for admin approval (typically within 24-48 hours)</li>
            </ol>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}/dashboard/profile" style="display: inline-block; background-color: #7c2d12; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Complete Your Profile</a>
            </div>

            <p>Once your profile is approved, clients will be able to find you and reach out for appointments.</p>

            <p>If you have any questions, feel free to reach out to our support team.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>The Concierge Barber Registry Team</strong></p>
          </div>

          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Concierge Barber Registry. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  } else {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Concierge Barber Registry</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #7c2d12; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to Concierge Barber Registry!</h1>
          </div>

          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${firstName},</p>

            <p>Thank you for joining Concierge Barber Registry! We're here to help you find the perfect barber for your needs.</p>

            <p><strong>What you can do now:</strong></p>
            <ul style="padding-left: 20px;">
              <li>Browse verified barbers in your area</li>
              <li>View barber portfolios, services, and pricing</li>
              <li>Read reviews from other clients</li>
              <li>Contact barbers directly to book appointments</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}/barbers" style="display: inline-block; background-color: #7c2d12; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Find Your Barber</a>
            </div>

            <p>We're constantly adding new barbers to our platform, so check back regularly to discover new talent in your area.</p>

            <p>If you have any questions or need assistance, our support team is here to help.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>The Concierge Barber Registry Team</strong></p>
          </div>

          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Concierge Barber Registry. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }
}

export async function sendWelcomeEmail(email: string, firstName: string, role: 'client' | 'barber') {
  const subject = role === 'barber'
    ? 'Welcome to Concierge Barber Registry - Complete Your Profile'
    : 'Welcome to Concierge Barber Registry';

  const html = getWelcomeEmailHtml(firstName, role);

  return sendEmail({ to: email, subject, html });
}

export function getVerificationEmailHtml(firstName: string, verificationUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email Address</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #7c2d12; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Verify Your Email Address</h1>
        </div>

        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 18px; margin-bottom: 20px;">Hi ${firstName},</p>

          <p>Thank you for signing up for Concierge Barber Registry! To complete your registration, please verify your email address by clicking the button below.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background-color: #7c2d12; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Verify Email Address</a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">This verification link will expire in 24 hours.</p>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;">
            If you didn't create an account with Concierge Barber Registry, you can safely ignore this email.
          </p>

          <p style="margin-top: 20px; color: #6b7280; font-size: 13px;">
            If the button above doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #7c2d12; word-break: break-all;">${verificationUrl}</a>
          </p>
        </div>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Concierge Barber Registry. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

export async function sendVerificationEmail(email: string, firstName: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verificationUrl = `${appUrl}/verify-email?token=${token}`;

  const subject = 'Verify Your Email Address - Concierge Barber Registry';
  const html = getVerificationEmailHtml(firstName, verificationUrl);

  return sendEmail({ to: email, subject, html });
}
