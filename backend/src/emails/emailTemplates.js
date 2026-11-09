export function createWelcomeEmailTemplate(name, clientURL) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Samवाद</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background: linear-gradient(135deg, #059669 0%, #10b981 50%, #06b6d4 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome to Samवाद!</h1>
      <p style="color: #ecfdf5; margin: 5px 0 0 0; font-size: 14px;">End-to-End Encrypted & Ephemeral Messaging</p>
    </div>
    <div style="background-color: #ffffff; padding: 35px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <p style="font-size: 18px; color: #059669;"><strong>Hello ${name},</strong></p>
      <p>We're thrilled to have you join Samवाद! Connect with friends, family, and colleagues with uncompromising privacy, HD WebRTC calling, and real-time messaging.</p>
      
      <div style="background-color: #f8fafc; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #10b981;">
        <p style="font-size: 16px; margin: 0 0 15px 0; color: #0f172a;"><strong>Get started in just a few steps:</strong></p>
        <ul style="padding-left: 20px; margin: 0; color: #475569;">
          <li style="margin-bottom: 10px;">Set up your profile picture and custom status</li>
          <li style="margin-bottom: 10px;">Find and add your contacts from the sidebar</li>
          <li style="margin-bottom: 10px;">Start 1-on-1 chats and voice notes</li>
          <li style="margin-bottom: 0;">Enjoy crystal-clear WebRTC audio & video calling</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href=${clientURL} style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: 600; display: inline-block;">Open Samवाद</a>
      </div>
      
      <p style="margin-bottom: 5px;">If you have any questions or feedback, we are always here to assist you.</p>
      <p style="margin-top: 0;">Happy messaging!</p>
      
      <p style="margin-top: 25px; margin-bottom: 0;">Warm regards,<br><strong>The Samवाद Team</strong></p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
      <p>© 2026 Samवाद (Let's Connect). All rights reserved.</p>
    </div>
  </body>
  </html>
  `;
}

export function createOtpEmailTemplate(otp, name = "") {
  const greeting = name ? `Hello ${name},` : "Hello,";
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Verification Code - Samवाद</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a;">
    <div style="background: linear-gradient(135deg, #059669 0%, #10b981 50%, #06b6d4 100%); padding: 32px 24px; text-align: center; border-radius: 16px 16px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Samवाद (Let's Connect)</h1>
      <p style="color: #ecfdf5; margin: 6px 0 0 0; font-size: 14px;">Email Verification Code</p>
    </div>
    <div style="background-color: #ffffff; padding: 36px 28px; border-radius: 0 0 16px 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
      <p style="font-size: 16px; color: #0f172a; margin-top: 0;"><strong>${greeting}</strong></p>
      <p style="color: #475569; font-size: 15px; margin-bottom: 24px;">Thank you for registering with <strong>Samवाद</strong>. To verify your email address and activate your account, please use the 6-digit One-Time Password (OTP) below:</p>
      
      <div style="background: linear-gradient(145deg, #f0fdf4, #ecfdf5); border: 2px dashed #10b981; border-radius: 12px; padding: 22px; text-align: center; margin: 28px 0;">
        <span style="font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #047857; font-family: 'Courier New', monospace; display: inline-block;">${otp}</span>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #059669; font-weight: 600;">Valid for 10 minutes</p>
      </div>

      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.5;">
          <strong>Security Notice:</strong> Never share this code with anyone. Samवाद staff will never ask for your verification code.
        </p>
      </div>

      <p style="color: #64748b; font-size: 13px; margin-top: 24px;">If you did not request this verification code, please ignore this email or contact security support.</p>
      <p style="color: #334155; font-size: 14px; margin-bottom: 0;">Warm regards,<br><strong>The Samवाद Security Team</strong></p>
    </div>
    <div style="text-align: center; padding: 18px; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">© 2026 Samवाद (Let's Connect). End-to-End Ephemeral Communication.</p>
    </div>
  </body>
  </html>
  `;
}
