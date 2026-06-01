import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL || gmailUser;

    if (gmailUser && gmailAppPassword && adminEmail) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      });

      // Send to admin
      await transporter.sendMail({
        from: `"AuraPerfume Contact" <${gmailUser}>`,
        to: adminEmail,
        replyTo: email,
        subject: `[AuraPerfume Contact] ${subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="background:#f8f6f3;padding:15px;border-left:4px solid #d4af37;margin:10px 0">${message}</blockquote>
        `,
      });

      console.log(`[Contact] Message from ${name} (${email}) sent to admin`);
    } else {
      console.log(`[Contact Mock] From: ${name} (${email}) | Subject: ${subject} | Message: ${message}`);
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json({ success: false, message: 'Failed to send message' }, { status: 500 });
  }
}
