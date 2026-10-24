import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html }) => {
  // SMTP set na ho to console mein link dikha dein (testing ke liye)
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`\n[EMAIL - SMTP set nahi] To: ${to}\nSubject: ${subject}\n${html}\n`);
    return;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({ from: process.env.EMAIL_FROM || process.env.SMTP_USER, to, subject, html });
};

export default sendEmail;
