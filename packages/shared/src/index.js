"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancellationPolicy = exports.MessageType = exports.PayoutStatus = exports.TransactionStatus = exports.TransactionType = exports.ReferralStatus = exports.DonationStatus = exports.UrgencyLevel = exports.AppointmentType = exports.ConsultationStatus = exports.UserRole = exports.DonationType = void 0;
var DonationType;
(function (DonationType) {
    DonationType["WHOLE_BLOOD"] = "whole_blood";
    DonationType["PLATELET"] = "platelet";
    DonationType["DOUBLE_RED_CELL"] = "double_red_cell";
})(DonationType || (exports.DonationType = DonationType = {}));
var UserRole;
(function (UserRole) {
    UserRole["PATIENT"] = "PATIENT";
    UserRole["SPECIALIST"] = "SPECIALIST";
    UserRole["DONOR"] = "DONOR";
    UserRole["HOSPITAL"] = "HOSPITAL";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var ConsultationStatus;
(function (ConsultationStatus) {
    ConsultationStatus["PENDING"] = "PENDING";
    ConsultationStatus["UPCOMING"] = "UPCOMING";
    ConsultationStatus["CONFIRMED"] = "CONFIRMED";
    ConsultationStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ConsultationStatus["PENDING_PAYOUT"] = "PENDING_PAYOUT";
    ConsultationStatus["COMPLETED"] = "COMPLETED";
    ConsultationStatus["CANCELLED"] = "CANCELLED";
    ConsultationStatus["DECLINED"] = "DECLINED";
    ConsultationStatus["NO_SHOW"] = "NO_SHOW";
    ConsultationStatus["ARCHIVED"] = "ARCHIVED";
    ConsultationStatus["DISPUTED"] = "DISPUTED";
})(ConsultationStatus || (exports.ConsultationStatus = ConsultationStatus = {}));
var AppointmentType;
(function (AppointmentType) {
    AppointmentType["INITIAL"] = "INITIAL";
    AppointmentType["FOLLOWUP"] = "FOLLOWUP";
})(AppointmentType || (exports.AppointmentType = AppointmentType = {}));
var UrgencyLevel;
(function (UrgencyLevel) {
    UrgencyLevel["CRITICAL"] = "CRITICAL";
    UrgencyLevel["URGENT"] = "URGENT";
    UrgencyLevel["NORMAL"] = "NORMAL";
})(UrgencyLevel || (exports.UrgencyLevel = UrgencyLevel = {}));
var DonationStatus;
(function (DonationStatus) {
    DonationStatus["PENDING"] = "PENDING";
    DonationStatus["CONFIRMED"] = "CONFIRMED";
    DonationStatus["ACCEPTED"] = "ACCEPTED";
    DonationStatus["DECLINED"] = "DECLINED";
    DonationStatus["DONATED"] = "DONATED";
    DonationStatus["VERIFIED"] = "VERIFIED";
    DonationStatus["COMPLETED"] = "COMPLETED";
    DonationStatus["CANCELLED"] = "CANCELLED";
})(DonationStatus || (exports.DonationStatus = DonationStatus = {}));
var ReferralStatus;
(function (ReferralStatus) {
    ReferralStatus["CREATED"] = "CREATED";
    ReferralStatus["SENT"] = "SENT";
    ReferralStatus["ACCEPTED"] = "ACCEPTED";
    ReferralStatus["COMPLETED"] = "COMPLETED";
    ReferralStatus["DECLINED"] = "DECLINED";
})(ReferralStatus || (exports.ReferralStatus = ReferralStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["CREDIT"] = "CREDIT";
    TransactionType["DEBIT"] = "DEBIT";
    TransactionType["TRANSFER_IN"] = "TRANSFER_IN";
    TransactionType["TRANSFER_OUT"] = "TRANSFER_OUT";
    TransactionType["REFUND"] = "REFUND";
    TransactionType["PLATFORM_FEE"] = "PLATFORM_FEE";
    TransactionType["CONSULTATION_PAYMENT"] = "CONSULTATION_PAYMENT";
    TransactionType["REFERRAL_REDEMPTION"] = "REFERRAL_REDEMPTION";
    TransactionType["WALLET_TOPUP"] = "WALLET_TOPUP";
    TransactionType["PAYMENT"] = "PAYMENT";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["COMPLETED"] = "COMPLETED";
    TransactionStatus["FAILED"] = "FAILED";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var PayoutStatus;
(function (PayoutStatus) {
    PayoutStatus["PENDING"] = "PENDING";
    PayoutStatus["AUTO_APPROVED"] = "AUTO_APPROVED";
    PayoutStatus["PENDING_REVIEW"] = "PENDING_REVIEW";
    PayoutStatus["PAID"] = "PAID";
    PayoutStatus["HELD"] = "HELD";
    PayoutStatus["CANCELLED"] = "CANCELLED";
    PayoutStatus["REFUNDED"] = "REFUNDED";
})(PayoutStatus || (exports.PayoutStatus = PayoutStatus = {}));
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "TEXT";
    MessageType["IMAGE"] = "IMAGE";
    MessageType["DOCUMENT"] = "DOCUMENT";
    MessageType["VOICE_NOTE"] = "VOICE_NOTE";
})(MessageType || (exports.MessageType = MessageType = {}));
var CancellationPolicy;
(function (CancellationPolicy) {
    CancellationPolicy["H24"] = "H24";
    CancellationPolicy["H48"] = "H48";
    CancellationPolicy["NO_REFUND"] = "NO_REFUND";
})(CancellationPolicy || (exports.CancellationPolicy = CancellationPolicy = {}));
//# sourceMappingURL=index.js.map