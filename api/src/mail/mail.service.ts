import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private smtpReady = false;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    if (!host || !user || !pass) {
      this.transporter = null;
      return;
    }
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: { user, pass },
      connectionTimeout: 15_000,
    });
  }

  async onModuleInit() {
    if (!this.transporter) {
      this.logger.warn(
        'SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in api/.env)',
      );
      return;
    }
    try {
      await this.transporter.verify();
      this.smtpReady = true;
      this.logger.log('SMTP connection verified');
    } catch (err) {
      this.logger.error(
        'SMTP verification failed — password reset emails will not send',
        err instanceof Error ? err.message : err,
      );
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null && this.smtpReady;
  }

  async sendPasswordReset(email: string, rawToken: string): Promise<void> {
    const frontendUrl = this.config
      .get<string>('FRONTEND_URL')
      ?.replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    if (!this.transporter) {
      const msg = `SMTP not configured — password reset link for ${email}: ${resetUrl}`;
      this.logger.error(msg);
      throw new Error('Email service is not configured');
    }

    if (!this.smtpReady) {
      await this.transporter.verify();
      this.smtpReady = true;
    }

    const from =
      this.config.get<string>('SMTP_FROM') ??
      this.config.get<string>('SMTP_USER');

    await this.transporter.sendMail({
      from: `"Prysym TV" <${from}>`,
      to: email,
      subject: 'Reset your Prysym TV password',
      text: `Reset your password using this link (valid for 15 minutes):\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
      html: `
        <p>Reset your Prysym TV password using the link below (valid for 15 minutes):</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    });

    this.logger.log(`Password reset email sent to ${email}`);
  }
}
