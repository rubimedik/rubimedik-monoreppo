import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async sendEmail(to: string, subject: string, html: string) {
    const from = this.configService.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
    this.logger.log(`Attempting to send email to ${to} from ${from}`);
    
    try {
      const response = await this.resend.emails.send({
        from,
        to,
        subject,
        html,
      });

      if (response.error) {
        this.logger.error(`Resend API Error: ${JSON.stringify(response.error)}`);
        
        // If the specific domain verification error occurs, provide a helpful suggestion
        if (response.error.message.includes('not verified')) {
          this.logger.warn('TIP: If rubimedik.com is not verified, set RESEND_FROM_EMAIL=onboarding@resend.dev in your .env');
        }
        
        throw new InternalServerErrorException(response.error.message);
      }

      this.logger.log(`Email sent successfully. ID: ${response.data?.id}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}. Error: ${error.message}`);
      throw error;
    }
  }

  public extractName(email: string): string {
    const part = email.split('@')[0];
    return part.charAt(0).toUpperCase() + part.slice(1).replace(/[._-]/g, ' ');
  }

  async sendWelcomeEmail(to: string, name?: string) {
    const subject = 'Welcome to Rubimedik';
    const userName = name || this.extractName(to);
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #D32F2F; text-align: center;">Welcome to Rubimedik</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Thank you for joining Rubimedik Health. We are excited to have you on board!</p>
        <p>Rubimedik is your all-in-one platform for medical consultations, blood donations, and secure healthcare management.</p>
        <p>Log in to the app to complete your profile and start exploring our features.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">© 2026 Rubimedik Health. All rights reserved.</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendOTP(to: string, otp: string, name?: string) {
    const subject = 'Your Rubimedik Verification Code';
    const userName = name || this.extractName(to);
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #D32F2F; text-align: center;">Rubimedik Verification</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Your verification code is:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; border-radius: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">© 2026 Rubimedik Health. All rights reserved.</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendBookingConfirmation(to: string, specialistName: string, date: Date, userName?: string) {
    const subject = 'Consultation Booking Confirmed';
    const name = userName || this.extractName(to);
    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your booking with <strong>${specialistName}</strong> on ${date.toLocaleString()} is confirmed.</p>
        <p>Please log in to the Rubimedik app for details.</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendSpecialistBookingAlert(to: string, patientName: string, date: Date, specialistName?: string) {
    const subject = 'New Consultation Booking Received';
    const name = specialistName || this.extractName(to);
    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <p>Hello <strong>${name}</strong>,</p>
        <p>You have received a new consultation booking from <strong>${patientName}</strong> for ${date.toLocaleString()}.</p>
        <p>Please log in to your Rubimedik dashboard to view the details and confirm the appointment.</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendPaymentConfirmation(to: string, amount: number, reference: string, userName?: string) {
    const subject = 'Payment Received';
    const name = userName || this.extractName(to);
    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <p>Hello <strong>${name}</strong>,</p>
        <p>We have received your payment of <strong>NGN ${amount}</strong>. Transaction reference: ${reference}.</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendReferralPointEarned(to: string, points: number, userName?: string) {
    const subject = 'You earned referral points!';
    const name = userName || this.extractName(to);
    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <p>Hello <strong>${name}</strong>,</p>
        <p>Congratulations! You have earned <strong>${points}</strong> referral point(s).</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendFeedbackRequest(to: string, consultantName: string, consultationId: string, name?: string) {
    const subject = 'Your consultation feedback';
    const userName = name || this.extractName(to);
    const html = `
      <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Your consultation with <strong>${consultantName}</strong> is complete.</p>
        <p>We would love to hear your feedback! Please log in to your <strong>Rubimedik app</strong>, go to <strong>My Appointments</strong>, and select this session to rate your experience and help us release the payment to your specialist.</p>
        <p>Thank you for choosing Rubimedik.</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }
  async sendCancellationNotification(to: string, title: string, reason: string, name?: string) {
    const subject = `Consultation Cancelled: ${title}`;
    const userName = name || this.extractName(to);
    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <p>Hello <strong>${userName}</strong>,</p>
        <p>The consultation <strong>${title}</strong> has been cancelled.</p>
        <p>Reason: ${reason}</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

    async sendTransactionAlert(to: string, type: string, amount: number, reference: string, details?: any, userName?: string) {
    const subject = `Transaction Alert: ${type}`;
    const time = new Date().toLocaleString();
    const name = userName || this.extractName(to);
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Transaction Alert</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>A <strong>${type}</strong> transaction of <strong>NGN ${amount}</strong> has occurred on your account.</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Amount:</strong> ₦${amount}</p>
          <p><strong>Reference:</strong> ${reference}</p>
          <p><strong>Date & Time:</strong> ${time}</p>
          ${details?.recipient ? `<p><strong>Recipient:</strong> ${details.recipient}</p>` : ''}
          ${details?.bankName ? `<p><strong>Bank:</strong> ${details.bankName}</p>` : ''}
        </div>
        
        <p>If you did not authorize this transaction, please contact support immediately.</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendDonationBookingAlert(to: string, donorName: string, bloodType: string, date?: Date) {
    const subject = 'New Blood Donation Booking';
    const name = this.extractName(to);
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #D32F2F;">New Donation Booking</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>A donor has booked a new donation for your facility.</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Donor:</strong> ${donorName}</p>
          <p><strong>Blood Type:</strong> ${bloodType}</p>
          ${date ? `<p><strong>Scheduled Date:</strong> ${date.toLocaleString()}</p>` : ''}
        </div>
        <p>Please log in to your dashboard to review and approve this booking.</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendDonationBookingConfirmation(to: string, hospitalName: string, bloodType: string, date?: Date) {
    const subject = 'Blood Donation Booking Received';
    const name = this.extractName(to);
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #D32F2F;">Donation Booking Received</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your booking to donate <strong>${bloodType}</strong> at <strong>${hospitalName}</strong> has been received and is awaiting approval.</p>
        ${date ? `<p><strong>Scheduled Date:</strong> ${date.toLocaleString()}</p>` : ''}
        <p>Thank you for your life-saving contribution!</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendDonationRescheduleAlert(to: string, donorName: string, bloodType: string, newDate: Date) {
    const subject = 'Donation Booking Rescheduled';
    const name = this.extractName(to);
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #D32F2F;">Booking Rescheduled</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>The donation booking for <strong>${bloodType}</strong> from <strong>${donorName}</strong> has been rescheduled.</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>New Date:</strong> ${newDate.toLocaleString()}</p>
        </div>
        <p>Please log in to your dashboard for details.</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendDonationCancellationAlert(to: string, donorName: string, bloodType: string) {
    const subject = 'Donation Booking Cancelled';
    const name = this.extractName(to);
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #D32F2F;">Booking Cancelled</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>A donation booking for <strong>${bloodType}</strong> from <strong>${donorName}</strong> has been cancelled.</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendDonationStatusUpdate(to: string, hospitalName: string, bloodType: string, status: string, declineReason?: string) {
    const isAccepted = status.toLowerCase() === 'accepted';
    const subject = isAccepted ? 'Donation Booking Accepted' : 'Donation Booking Declined';
    const name = this.extractName(to);
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: ${isAccepted ? '#2E7D32' : '#D32F2F'};">${subject}</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your donation booking for <strong>${bloodType}</strong> at <strong>${hospitalName}</strong> has been <strong>${status.toLowerCase()}</strong>.</p>
        ${declineReason ? `<div style="background: #FFF8E1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFC107;">
          <p><strong>Reason for decline:</strong> ${declineReason}</p>
        </div>` : ''}
        ${isAccepted ? '<p>Please remember to bring a valid ID and stay hydrated!</p>' : '<p>We appreciate your interest in donating. Please check other requests or try again later.</p>'}
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendDonationCompletionEmail(to: string, hospitalName: string, bloodType: string, units: number) {
    const subject = 'Donation Successfully Recorded';
    const name = this.extractName(to);
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2E7D32;">Thank You for Your Donation!</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your donation at <strong>${hospitalName}</strong> has been successfully recorded.</p>
        <div style="background: #E8F5E9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <p><strong>Blood Type:</strong> ${bloodType}</p>
          <p><strong>Units:</strong> ${units}</p>
        </div>
        <p>Your contribution helps save lives. You can view your updated stats and certificates in the Rubimedik app.</p>
        <p>Best regards,<br/>The Rubimedik Team</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendSpecialistFeedbackNotification(to: string, message: string) {
    const subject = 'New Consultation Feedback';
    const name = this.extractName(to);
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Consultation Feedback</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>${message}</p>
        <p>Please log in to the Rubimedik app to view your updated profile and details.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">© 2026 Rubimedik Health. All rights reserved.</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendCheckInVerification(to: string, name: string, type: string, time: string, checkInUrl: string) {
    const subject = `Upcoming ${type} - Action Required`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #D32F2F; text-align: center;">Verification Required</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your scheduled <strong>${type}</strong> is starting in 30 minutes (at ${time}).</p>
        <p>Please click the button below to verify your availability and check in for the session.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${checkInUrl}" style="background-color: #D32F2F; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify & Check In</a>
        </div>
        <p style="color: #666; font-size: 13px;">If you cannot attend, please contact support or reschedule via the app immediately.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">© 2026 Rubimedik Health. All rights reserved.</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendStatement(to: string, startDate: Date, endDate: Date, csvData: string, name?: string) {
    const subject = `Your Rubimedik Account Statement`;
    const userName = name || this.extractName(to);
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Account Statement</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Attached is your requested account statement for the period of <strong>${startDate.toLocaleDateString()}</strong> to <strong>${endDate.toLocaleDateString()}</strong>.</p>
        <p>If you have any questions regarding your transactions, please contact our support team.</p>
        <p>Best regards,<br/>The Rubimedik Team</p>
      </div>
    `;

    const from = this.configService.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
    
    try {
      const response = await this.resend.emails.send({
        from,
        to,
        subject,
        html,
        attachments: [
          {
            filename: `Rubimedik_Statement_${startDate.getTime()}.csv`,
            content: Buffer.from(csvData),
          }
        ]
      });

      if (response.error) throw new InternalServerErrorException(response.error.message);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send statement to ${to}. Error: ${error.message}`);
      throw error;
    }
  }
}
