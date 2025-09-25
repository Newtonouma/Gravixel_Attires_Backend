export const mailConfig = {
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'your@email.com',
    pass: process.env.SMTP_PASS || 'password',
  },
  from: process.env.SMTP_FROM || 'no-reply@gravixel.com',
};
