import { Resend } from 'resend';
import { prisma } from '@/lib/db';
import { createLogger } from '@/lib/logger';

const logger = createLogger('EMAIL'); // [EMAIL] tag for log messages
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    logger.warn('Service not configured - RESEND_API_KEY missing');
    // DO NOT log PII (email address) - GDPR violation
    return { success: false, message: 'Email service not configured' };
  }

  // In development, log email details without sending
  // Use VERCEL_ENV to ensure we're truly in production
  const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

  if (!isProduction) {
    logger.info('Development mode - simulating email send');
    // DO NOT log recipient email - GDPR violation
    return {
      success: true,
      data: {
        id: 'dev-simulated-email',
        message: 'Email simulated in development'
      }
    };
  }

  try {
    // DO NOT log email addresses - GDPR violation
    logger.info('Sending email');

    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to,
      subject,
      html,
    });

    logger.info('Email sent successfully');
    return { success: true, data };
  } catch (error) {
    logger.error('Failed to send email:', error);
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

// License verification email templates
export function getLicenseApprovedEmailHtml(firstName: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Professional License Verified</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #16a34a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">✓ Your Professional License Has Been Verified!</h1>
        </div>

        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 18px; margin-bottom: 20px;">Hi ${firstName},</p>

          <p><strong>Great news!</strong> Your professional barber license has been verified and approved by our admin team.</p>

          <p>Your profile now displays a <strong>"✓ Verified"</strong> badge, which helps build trust with potential clients.</p>

          <p><strong>Next steps to maximize your profile:</strong></p>
          <ul style="padding-left: 20px;">
            <li>Add portfolio images showcasing your best work</li>
            <li>List your services and pricing</li>
            <li>Complete your bio and specialty information</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/dashboard/profile" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Your Profile</a>
          </div>

          <p>Your verified profile is now visible to clients searching for professional barbers in your area!</p>

          <p style="margin-top: 30px;">Best regards,<br><strong>The Concierge Barber Registry Team</strong></p>
        </div>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Concierge Barber Registry. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

export function getLicenseRejectedEmailHtml(firstName: string, reason: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Action Required: License Verification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">⚠️ Action Required: License Verification</h1>
        </div>

        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 18px; margin-bottom: 20px;">Hi ${firstName},</p>

          <p>Thank you for submitting your professional license for verification. Unfortunately, we were unable to verify your license at this time.</p>

          <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Reason:</p>
            <p style="margin: 10px 0 0 0;">${reason || 'License information could not be verified'}</p>
          </div>

          <p><strong>What you need to do:</strong></p>
          <ol style="padding-left: 20px;">
            <li>Review your license information for accuracy</li>
            <li>Ensure your license document is clear and legible</li>
            <li>Verify that your license number and state match the document</li>
            <li>Re-submit your license information</li>
          </ol>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/dashboard/profile" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Update License Information</a>
          </div>

          <p>If you believe this was an error or have questions about the verification process, please contact our support team.</p>

          <p style="margin-top: 30px;">Best regards,<br><strong>The Concierge Barber Registry Team</strong></p>
        </div>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Concierge Barber Registry. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

export function getLicenseSubmittedAdminEmailHtml(barberName: string, barberEmail: string, licenseNumber: string, licenseState: string, verificationUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New License Verification Required</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #7c2d12; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🔔 New License Verification Required</h1>
        </div>

        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 18px; margin-bottom: 20px;">Admin Notification</p>

          <p>A barber has submitted their professional license for verification and is awaiting approval.</p>

          <div style="background-color: white; border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0 0 10px 0;"><strong>Barber Name:</strong> ${barberName}</p>
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${barberEmail}</p>
            <p style="margin: 0 0 10px 0;"><strong>License Number:</strong> ${licenseNumber}</p>
            <p style="margin: 0;"><strong>License State:</strong> ${licenseState}</p>
          </div>

          <p><strong>Action required:</strong></p>
          <ol style="padding-left: 20px;">
            <li>Review the barber's profile and license document</li>
            <li>Verify the license number matches the document</li>
            <li>Check that the license is current and not expired</li>
            <li>Approve or reject the license submission</li>
          </ol>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background-color: #7c2d12; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review License</a>
          </div>

          <p style="color: #6b7280; font-size: 13px; margin-top: 30px;">This is an automated notification from the Concierge Barber Registry admin system.</p>
        </div>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Concierge Barber Registry. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

export async function sendLicenseApprovedEmail(email: string, firstName: string) {
  const subject = '🎉 Your Professional License Has Been Verified!';
  const html = getLicenseApprovedEmailHtml(firstName);

  return sendEmail({ to: email, subject, html });
}

export async function sendLicenseRejectedEmail(email: string, firstName: string, reason: string) {
  const subject = '⚠️ Action Required: License Verification';
  const html = getLicenseRejectedEmailHtml(firstName, reason);

  return sendEmail({ to: email, subject, html });
}

export function getLicenseSuspendedEmailHtml(firstName: string, reasonLabel: string, reasonDescription: string, appealable: boolean) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const appealSection = appealable
    ? `
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #1e40af;">You may appeal this suspension</p>
            <p style="margin: 10px 0 0 0;">You can submit an appeal through your dashboard. Our team will review your case and respond within 5 business days.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/dashboard/appeal" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Submit an Appeal</a>
          </div>`
    : `
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #991b1b;">This suspension is not eligible for appeal.</p>
            <p style="margin: 10px 0 0 0;">If you have questions, please contact our support team.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/contact" style="display: inline-block; background-color: #ea580c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Contact Support</a>
          </div>`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Suspended</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ea580c; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">&#9888;&#65039; Your Account Has Been Suspended</h1>
        </div>

        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 18px; margin-bottom: 20px;">Hi ${firstName},</p>

          <p>We regret to inform you that your barber profile on Concierge Barber Registry has been suspended.</p>

          <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Reason: ${reasonLabel}</p>
            <p style="margin: 10px 0 0 0;">${reasonDescription}</p>
          </div>

          <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0; font-weight: bold;">What this means:</p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>Your profile is hidden from search results</li>
              <li>Clients cannot view your profile or contact you through the platform</li>
              <li>Any active subscription has been canceled with a prorated refund</li>
              <li>Your account data remains intact</li>
            </ul>
          </div>

          ${appealSection}

          <p style="margin-top: 30px;">Best regards,<br><strong>The Concierge Barber Registry Team</strong></p>
        </div>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Concierge Barber Registry. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

export async function sendLicenseSuspendedEmail(email: string, firstName: string, reason: string, appealable: boolean) {
  // Import dynamically to avoid circular deps — reason metadata lives in suspension.ts
  const { SUSPENSION_REASONS } = await import('@/lib/suspension');
  const meta = SUSPENSION_REASONS[reason as keyof typeof SUSPENSION_REASONS];
  const reasonLabel = meta?.label || reason;
  const reasonDescription = meta?.description || '';

  const subject = 'Your Concierge Barber Registry Account Has Been Suspended';
  const html = getLicenseSuspendedEmailHtml(firstName, reasonLabel, reasonDescription, appealable);

  return sendEmail({ to: email, subject, html });
}

export function getReinstatedEmailHtml(firstName: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Reinstated</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #16a34a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Your Account Has Been Reinstated!</h1>
        </div>

        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 18px; margin-bottom: 20px;">Hi ${firstName},</p>

          <p><strong>Good news!</strong> Your barber profile on Concierge Barber Registry has been reinstated. Your suspension has been lifted and your profile is now visible to clients again.</p>

          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">What to do next:</p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>Review and update your profile information</li>
              <li>Re-subscribe to a plan if your previous subscription was canceled</li>
              <li>Ensure your license information is current</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/dashboard/profile" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
          </div>

          <p style="margin-top: 30px;">Best regards,<br><strong>The Concierge Barber Registry Team</strong></p>
        </div>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Concierge Barber Registry. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

export async function sendReinstatedEmail(email: string, firstName: string) {
  const subject = 'Your Concierge Barber Registry Account Has Been Reinstated';
  const html = getReinstatedEmailHtml(firstName);

  return sendEmail({ to: email, subject, html });
}

export async function sendLicenseSubmittedAdminEmail(adminEmail: string, barberName: string, barberEmail: string, licenseNumber: string, licenseState: string, _barberProfileId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verificationUrl = `${appUrl}/admin/barbers`;

  const subject = `🔔 New License Verification Required: ${barberName}`;
  const html = getLicenseSubmittedAdminEmailHtml(barberName, barberEmail, licenseNumber, licenseState, verificationUrl);

  return sendEmail({ to: adminEmail, subject, html });
}

/**
 * Notify all admins that a barber has submitted a license for verification.
 * Used by both the profile update and license-upload routes.
 */
export async function notifyAdminsLicenseSubmitted(barber: {
  name: string;
  email: string;
  licenseNumber: string;
  licenseState: string;
  profileId: string;
}) {
  const adminUsers = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { email: true },
  });

  for (const admin of adminUsers) {
    sendLicenseSubmittedAdminEmail(
      admin.email,
      barber.name,
      barber.email,
      barber.licenseNumber,
      barber.licenseState,
      barber.profileId
    ).catch((err) => logger.error('Failed to send admin notification:', err));
  }
}

// Password reset email templates
export function getPasswordResetEmailHtml(firstName: string, resetUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #7c2d12; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Reset Your Password</h1>
        </div>

        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 18px; margin-bottom: 20px;">Hi ${firstName},</p>

          <p>You requested to reset your password for your Concierge Barber Registry account. Click the button below to create a new password:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #7c2d12; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">This password reset link will expire in 1 hour for security reasons.</p>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;">
            If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
          </p>

          <p style="margin-top: 20px; color: #6b7280; font-size: 13px;">
            If the button above doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #7c2d12; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Concierge Barber Registry. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

export async function sendPasswordResetEmail(email: string, firstName: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  const subject = 'Reset Your Password - Concierge Barber Registry';
  const html = getPasswordResetEmailHtml(firstName, resetUrl);

  return sendEmail({ to: email, subject, html });
}

// Contact request email template
export function getContactRequestEmailHtml(
  barberName: string,
  clientName: string,
  clientEmail: string,
  clientPhone: string | null,
  message: string,
  serviceInterested: string | null,
  preferredDate: string | null,
  preferredTime: string | null
) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Request</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #7c2d12; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">📬 New Contact Request</h1>
        </div>

        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 18px; margin-bottom: 20px;">Hi ${barberName},</p>

          <p>You have received a new contact request through Concierge Barber Registry!</p>

          <div style="background-color: white; border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 6px;">
            <h3 style="margin-top: 0; color: #7c2d12;">Client Information</h3>
            <p style="margin: 8px 0;"><strong>Name:</strong> ${clientName}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${clientEmail}" style="color: #7c2d12;">${clientEmail}</a></p>
            ${clientPhone ? `<p style="margin: 8px 0;"><strong>Phone:</strong> ${clientPhone}</p>` : ''}
            ${serviceInterested ? `<p style="margin: 8px 0;"><strong>Service Interested:</strong> ${serviceInterested}</p>` : ''}
            ${preferredDate ? `<p style="margin: 8px 0;"><strong>Preferred Date:</strong> ${preferredDate}</p>` : ''}
            ${preferredTime ? `<p style="margin: 8px 0;"><strong>Preferred Time:</strong> ${preferredTime}</p>` : ''}
          </div>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #92400e;">Message:</h3>
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>

          <p><strong>Next steps:</strong></p>
          <ul style="padding-left: 20px;">
            <li>Reply to ${clientEmail} directly to schedule an appointment</li>
            ${clientPhone ? `<li>Call ${clientPhone} to discuss their needs</li>` : ''}
            <li>Respond within 24 hours for the best client experience</li>
          </ul>

          <p style="color: #6b7280; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            This contact request was submitted through your Concierge Barber Registry profile. To manage your profile settings or view your dashboard, log in to your account.
          </p>
        </div>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Concierge Barber Registry. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

export async function sendContactRequestEmail(
  barberEmail: string,
  barberName: string,
  contactRequest: {
    clientName: string;
    clientEmail: string;
    clientPhone: string | null;
    message: string;
    serviceInterested: string | null;
    preferredDate: Date | null;
    preferredTime: string | null;
  }
) {
  const subject = `New Contact Request from ${contactRequest.clientName}`;
  const preferredDate = contactRequest.preferredDate
    ? new Date(contactRequest.preferredDate).toLocaleDateString()
    : null;

  const html = getContactRequestEmailHtml(
    barberName,
    contactRequest.clientName,
    contactRequest.clientEmail,
    contactRequest.clientPhone,
    contactRequest.message,
    contactRequest.serviceInterested,
    preferredDate,
    contactRequest.preferredTime
  );

  return sendEmail({ to: barberEmail, subject, html });
}

export function getClaimInvitationEmailHtml(
  firstName: string,
  displayName: string,
  city: string,
  state: string,
  claimUrl: string,
  publicUrl: string
) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Concierge Barber Registry profile is ready to claim</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1A1A2E; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 26px;">Your profile is ready to claim</h1>
          <p style="margin: 10px 0 0; opacity: 0.9; font-size: 14px;">Concierge Barber Registry</p>
        </div>

        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 18px; margin-bottom: 20px;">Hi ${firstName},</p>

          <p>We listed <strong>${displayName}</strong> on Concierge Barber Registry — a license-verified directory of independent barbers in ${city}, ${state} and beyond.</p>

          <p style="background-color: #fef3c7; border-left: 4px solid #C9A96E; padding: 12px 16px; margin: 20px 0; font-size: 14px;">
            Your profile is currently <strong>unclaimed</strong>. Anyone visiting it sees a clear &ldquo;Claim this profile&rdquo; link. Take ownership now to control how you appear, add your portfolio, and get the verified-pro badge.
          </p>

          <p><strong>What you get when you claim:</strong></p>
          <ul style="padding-left: 20px;">
            <li>Keep 100% of your cut — zero booking fees, ever</li>
            <li>License-verified badge once you submit your credentials</li>
            <li>Free Starter tier (no credit card required)</li>
            <li>Curated portfolio gallery + client reviews on your profile</li>
            <li>14-day free trial on Professional and Elite tiers</li>
          </ul>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${claimUrl}" style="display: inline-block; background-color: #C9A96E; color: #1A1A2E; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Claim Your Profile</a>
          </div>

          <p style="font-size: 13px; color: #6b7280;">
            View your current public listing: <a href="${publicUrl}" style="color: #1A1A2E;">${publicUrl}</a>
          </p>

          <p style="font-size: 13px; color: #6b7280; margin-top: 25px;">
            Not the right person? Don&apos;t want a profile listed? Reply to this email and we&apos;ll remove the listing right away.
          </p>

          <p style="margin-top: 30px;">— The Concierge Barber Registry Team</p>
        </div>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Concierge Barber Registry. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

export async function sendClaimInvitationEmail(params: {
  to: string;
  firstName: string;
  displayName: string;
  city: string;
  state: string;
  claimUrl: string;
  publicUrl: string;
}) {
  const html = getClaimInvitationEmailHtml(
    params.firstName,
    params.displayName,
    params.city,
    params.state,
    params.claimUrl,
    params.publicUrl
  );

  return sendEmail({
    to: params.to,
    subject: `${params.firstName}, your Concierge Barber Registry profile is ready to claim`,
    html,
  });
}
