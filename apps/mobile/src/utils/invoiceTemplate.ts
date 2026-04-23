import { format } from 'date-fns';

export const generateInvoiceHtml = (consultation: any) => {
  const patientName = consultation.patient?.fullName || 'Valued Patient';
  const specialistName = consultation.specialist?.fullName || 'Specialist';
  const date = new Date(consultation.completedAt || consultation.createdAt);
  const totalAmount = Number(consultation.totalFee || 0);
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; padding: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #007AFF; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #007AFF; }
            .invoice-details { text-align: right; }
            .section { margin-top: 40px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .label { color: #888; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
            .value { font-size: 16px; font-weight: 600; }
            table { width: 100%; margin-top: 40px; border-collapse: collapse; }
            th { text-align: left; background: #f8f8f8; padding: 12px; font-size: 12px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #eee; }
            .total-row { margin-top: 40px; text-align: right; }
            .total-label { font-size: 18px; color: #888; }
            .total-value { font-size: 28px; font-weight: bold; color: #007AFF; margin-top: 8px; }
            .footer { margin-top: 100px; text-align: center; color: #888; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">RubiMedik</div>
            <div class="invoice-details">
                <div class="label">Invoice Number</div>
                <div class="value">INV-${consultation.id.slice(0, 8).toUpperCase()}</div>
                <div style="margin-top: 12px;" class="label">Date</div>
                <div class="value">${date.toLocaleDateString()}</div>
            </div>
        </div>

        <div class="section grid">
            <div>
                <div class="label">Issued To</div>
                <div class="value">${patientName}</div>
            </div>
            <div style="text-align: right;">
                <div class="label">Provider</div>
                <div class="value">Dr. ${specialistName}</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Service Type</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Medical Consultation</td>
                    <td>${consultation.consultationType || 'Telemedicine'}</td>
                    <th style="text-align: right;">NGN ${totalAmount.toLocaleString()}</th>
                </tr>
            </tbody>
        </table>

        <div class="total-row">
            <div class="total-label">Grand Total</div>
            <div class="total-value">NGN ${totalAmount.toLocaleString()}</div>
        </div>

        <div class="footer">
            <p>Thank you for choosing RubiMedik for your healthcare needs.</p>
            <p>This is a computer-generated invoice and requires no signature.</p>
        </div>
    </body>
    </html>
  `;
};
