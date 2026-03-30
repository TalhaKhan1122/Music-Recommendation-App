import nodemailer from 'nodemailer';

// Email configuration - using a simple SMTP setup
// For yopmail, we'll use a generic SMTP service
const createTransporter = async () => {
  // If SMTP credentials are configured, use them
  if (process.env.SMTP_USER || process.env.EMAIL_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
      },
    });
  }

  // For development/testing, use Ethereal Email (fake SMTP service)
  // This creates a temporary account and actually sends emails
  console.log('📧 No SMTP credentials found. Using Ethereal Email for testing...');
  const testAccount = await nodemailer.createTestAccount();
  console.log('✅ Ethereal Email account created:', testAccount.user);
  
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  try {
    const transporter = await createTransporter();
    const isEthereal = !process.env.SMTP_USER && !process.env.EMAIL_USER;

    const mailOptions = {
      from: isEthereal 
        ? '"MR App" <noreply@ethereal.email>'
        : `"MR App" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (isEthereal) {
      // For Ethereal Email, get the preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('✅ Email sent successfully via Ethereal Email!');
      console.log('📧 Preview URL:', previewUrl);
      console.log('📬 Email sent to:', options.to);
      console.log('💡 Note: For production, configure SMTP credentials in .env file');
      console.log('   For yopmail, you can check the email at:', options.to);
    } else {
      console.log('✅ Email sent successfully:', info.messageId);
    }
  } catch (error: any) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send email. Please try again later.');
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Password Reset Request</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            You requested to reset your password for your MR App account. Click the button below to reset your password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Or copy and paste this link into your browser:
          </p>
          <p style="font-size: 12px; color: #999; word-break: break-all; background: #fff; padding: 10px; border-radius: 5px; border: 1px solid #e0e0e0;">
            ${resetUrl}
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            This link will expire in 10 minutes.
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Password Reset Request - MR App',
    html,
  });
};

