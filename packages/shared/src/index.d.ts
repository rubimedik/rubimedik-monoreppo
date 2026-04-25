export declare enum DonationType {
    WHOLE_BLOOD = "whole_blood",
    PLATELET = "platelet",
    DOUBLE_RED_CELL = "double_red_cell"
}
export declare enum UserRole {
    PATIENT = "PATIENT",
    SPECIALIST = "SPECIALIST",
    DONOR = "DONOR",
    HOSPITAL = "HOSPITAL",
    ADMIN = "ADMIN"
}
export declare enum ConsultationStatus {
    PENDING = "PENDING",
    UPCOMING = "UPCOMING",
    CONFIRMED = "CONFIRMED",
    IN_PROGRESS = "IN_PROGRESS",
    PENDING_PAYOUT = "PENDING_PAYOUT",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    DECLINED = "DECLINED",
    NO_SHOW = "NO_SHOW",
    ARCHIVED = "ARCHIVED",
    DISPUTED = "DISPUTED"
}
export declare enum AppointmentType {
    INITIAL = "INITIAL",
    FOLLOWUP = "FOLLOWUP"
}
export declare enum UrgencyLevel {
    CRITICAL = "CRITICAL",
    URGENT = "URGENT",
    NORMAL = "NORMAL"
}
export declare enum DonationStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    ACCEPTED = "ACCEPTED",
    DECLINED = "DECLINED",
    DONATED = "DONATED",
    VERIFIED = "VERIFIED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum ReferralStatus {
    CREATED = "CREATED",
    SENT = "SENT",
    ACCEPTED = "ACCEPTED",
    COMPLETED = "COMPLETED",
    DECLINED = "DECLINED"
}
export declare enum TransactionType {
    CREDIT = "CREDIT",
    DEBIT = "DEBIT",
    TRANSFER_IN = "TRANSFER_IN",
    TRANSFER_OUT = "TRANSFER_OUT",
    REFUND = "REFUND",
    PLATFORM_FEE = "PLATFORM_FEE",
    CONSULTATION_PAYMENT = "CONSULTATION_PAYMENT",
    REFERRAL_REDEMPTION = "REFERRAL_REDEMPTION",
    WALLET_TOPUP = "WALLET_TOPUP",
    PAYMENT = "PAYMENT"
}
export declare enum TransactionStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare enum PayoutStatus {
    PENDING = "PENDING",
    AUTO_APPROVED = "AUTO_APPROVED",
    PENDING_REVIEW = "PENDING_REVIEW",
    PAID = "PAID",
    HELD = "HELD",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED"
}
export declare enum MessageType {
    TEXT = "TEXT",
    IMAGE = "IMAGE",
    DOCUMENT = "DOCUMENT",
    VOICE_NOTE = "VOICE_NOTE"
}
export declare enum CancellationPolicy {
    H24 = "H24",
    H48 = "H48",
    NO_REFUND = "NO_REFUND"
}
