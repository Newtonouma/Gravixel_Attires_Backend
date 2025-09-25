const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = (process.env.SMTP_SECURE || 'false') === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  const to = process.env.TEST_EMAIL || user;

  console.log('SMTP config:', { host, port, secure, user: user ? 'set' : 'unset', pass: pass ? 'set' : 'unset', from, to });

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  try {
    console.log('Verifying transporter...');
    await transporter.verify();
    console.log('Transporter verified.');
  } catch (err) {
    console.error('Transporter verify failed:');
    console.error(err);
  }

  try {
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Gravixel test email',
      text: 'This is a test email from Gravixel backend',
    });
    console.log('Send succeeded:', info);
  } catch (err) {
    console.error('Send failed:');
    console.error(err);
  }
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
