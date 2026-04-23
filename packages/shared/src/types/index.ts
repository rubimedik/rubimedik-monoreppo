export enum DonationType {
  WHOLE_BLOOD = "whole_blood",
  PLATELET = "platelet",
  DOUBLE_RED_CELL = "double_red_cell"
}

export enum UserRole {
  PATIENT = 'PATIENT',
  SPECIALIST = 'SPECIALIST',
  DONOR = 'DONOR',
  HOSPITAL = 'HOSPITAL',
  ADMIN = 'ADMIN',
}

export enum ConsultationStatus {
  UPCOMING = 'UPCOMING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum AppointmentType {
  INITIAL = 'INITIAL',
  FOLLOWUP = 'FOLLOWUP',
}

export enum UrgencyLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  NORMAL = 'NORMAL',
}

export enum DonationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  CONFIRMED = 'CONFIRMED',
  DONATED = 'DONATED',
  VERIFIED = 'VERIFIED',
}

export enum ReferralStatus {
  CREATED = 'CREATED',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED',
  DECLINED = 'DECLINED',
}

export enum TransactionType {
  CREDIT = 'CREDIT',
  WALLET_TOPUP = 'WALLET_TOPUP',
  DEBIT = 'DEBIT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  REFUND = 'REFUND',
  PLATFORM_FEE = 'PLATFORM_FEE',
  CONSULTATION_PAYMENT = 'CONSULTATION_PAYMENT',
  REFERRAL_REDEMPTION = 'REFERRAL_REDEMPTION',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  VOICE_NOTE = 'VOICE_NOTE',
}

export enum CancellationPolicy {
  H24 = 'H24',
  H48 = 'H48',
  NO_REFUND = 'NO_REFUND',
}
