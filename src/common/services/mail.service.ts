import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const nodemailer = require('nodemailer');

@Injectable()
export class MailService {
  private transporter: any;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST') || 'smtp.example.com';
    const port = Number(this.configService.get<number>('SMTP_PORT') ?? 587);
    const secureEnv = this.configService.get<string>('SMTP_SECURE');
    const secure = secureEnv ? secureEnv === 'true' : false;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    // Log SMTP config (without password) to help diagnose auth issues
    const from = this.configService.get<string>('SMTP_FROM') || user || 'no-reply@gravixel.com';
    console.log('[MailService] SMTP host=%s port=%s user=%s from=%s secure=%s', host, port, user, from, secure);

    // Verify transporter connection/auth early and log result
    this.transporter.verify()
      .then(() => console.log('[MailService] SMTP connection verified'))
      .catch((err: any) => console.error('[MailService] SMTP verify failed:', err && err.message ? err.message : err));
  }

  async sendOtpEmail(email: string, otp: string): Promise<any> {
    const from = this.configService.get<string>('SMTP_FROM') || 'no-reply@gravixel.com';
    const info = await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Your One-Time Password (OTP) for Gravixel Attires',
      text: `Your OTP is: ${otp}\nUse this to log in and change your password.`,
    });
    console.log('OTP email sent:', info.messageId);
    return info;
  }

  async sendPlainEmail(to: string, subject: string, text: string): Promise<any> {
    const from = this.configService.get<string>('SMTP_FROM') || 'no-reply@gravixel.com';
    const info = await this.transporter.sendMail({
      from,
      to,
      subject,
      text,
    });
    console.log('Plain email sent:', info.messageId, 'to', to);
    return info;
  }

  async sendAdminOrderAlert(order: any, adminEmailsParam?: string[]): Promise<any> {
    const from = this.configService.get<string>('SMTP_FROM') || 'no-reply@gravixel.com';
    const adminEmailsRaw = this.configService.get<string>('ADMIN_EMAILS');
    const fallbackAdminEmails = adminEmailsRaw ? adminEmailsRaw.split(',').map(s => s.trim()) : [from];
    const adminEmails = Array.isArray(adminEmailsParam) && adminEmailsParam.length ? adminEmailsParam : fallbackAdminEmails;

    // Build readable plain text and simple HTML body
    const lines: string[] = [];
    lines.push(`New order received`);
    lines.push('');
    lines.push(`Order ID: ${order.id}`);
    lines.push(`Customer: ${order.name} <${order.email}>`);
    if (order.phoneNumber) lines.push(`Phone: ${order.phoneNumber}`);
    if (order.city) lines.push(`City: ${order.city}`);
    if (order.address) lines.push(`Address: ${order.address}`);
    lines.push('');
    lines.push('Products:');
    let total = 0;
    for (const p of order.products || []) {
      const priceNum = Number(p.price) || 0;
      const qty = Number(p.quantity) || 1;
      total += priceNum * qty;
      lines.push(`- ${p.name} (size: ${p.size || 'N/A'}) x ${qty} — $${(priceNum * qty).toFixed(2)}`);
    }
    lines.push('');
    lines.push(`Order total: $${total.toFixed(2)}`);
    lines.push('');
    lines.push(`Status: ${order.status}`);
    lines.push(`Placed at: ${order.createdAt}`);
    lines.push('');
    lines.push('Open the admin dashboard to process this order.');

    const text = lines.join('\n');

    // simple HTML
    const htmlLines: string[] = [];
    htmlLines.push(`<h2>New order received</h2>`);
    htmlLines.push(`<p><strong>Order ID:</strong> ${order.id}</p>`);
    htmlLines.push(`<p><strong>Customer:</strong> ${order.name} &lt;${order.email}&gt;</p>`);
    if (order.phoneNumber) htmlLines.push(`<p><strong>Phone:</strong> ${order.phoneNumber}</p>`);
    if (order.city) htmlLines.push(`<p><strong>City:</strong> ${order.city}</p>`);
    if (order.address) htmlLines.push(`<p><strong>Address:</strong> ${order.address}</p>`);
    htmlLines.push(`<h3>Products</h3>`);
    htmlLines.push('<ul>');
    for (const p of order.products || []) {
      const priceNum = Number(p.price) || 0;
      const qty = Number(p.quantity) || 1;
      htmlLines.push(`<li>${p.name} (size: ${p.size || 'N/A'}) x ${qty} — $${(priceNum * qty).toFixed(2)}</li>`);
    }
    htmlLines.push('</ul>');
    htmlLines.push(`<p><strong>Order total:</strong> $${total.toFixed(2)}</p>`);
    htmlLines.push(`<p><strong>Status:</strong> ${order.status}</p>`);
    htmlLines.push(`<p><em>Placed at: ${order.createdAt}</em></p>`);
    htmlLines.push(`<p>Open the admin dashboard to process this order.</p>`);
    const html = htmlLines.join('');

    const info = await this.transporter.sendMail({
      from,
      to: adminEmails.join(','),
      subject: `New Order Placed — ${order.id}`,
      text,
      html,
    });
    console.log('Admin alert email sent:', info.messageId, 'to', adminEmails.join(','));
    return info;
  }
}
