import { resend, FROM_EMAIL } from "../config/resend.js";

const otpTemplate = (name, otp) => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#F7F5F0;font-family:'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E7E3D9;">
            <tr>
              <td style="background:#0B0B0C;padding:28px 32px;">
                <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:1px;">TEENRAAH</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="color:#0B0B0C;font-size:16px;margin:0 0 8px;">Hi ${name || "there"},</p>
                <p style="color:#4B4A45;font-size:14px;line-height:1.6;margin:0 0 24px;">
                  Use the code below to verify your email and finish setting up your TeenRaah account.
                  This code expires in <strong>10 minutes</strong>.
                </p>
                <div style="background:#F7F5F0;border-radius:10px;padding:18px;text-align:center;margin-bottom:24px;">
                  <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#2F5233;">${otp}</span>
                </div>
                <p style="color:#8A8578;font-size:12px;line-height:1.6;margin:0;">
                  Didn't request this? You can safely ignore this email — no account will be created without verification.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#F7F5F0;padding:16px 32px;text-align:center;">
                <span style="color:#8A8578;font-size:12px;">Find Your Path — TeenRaah</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export const sendOTPEmail = async ({ to, name, otp }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${otp} is your TeenRaah verification code`,
      html: otpTemplate(name, otp),
    });
    if (error) throw new Error(error.message || "Resend failed to send email");
    return data;
  } catch (err) {
    // Never crash the request flow because an email failed to send —
    // log it clearly so it's obvious in dev when RESEND_API_KEY is a placeholder.
    console.error("✉️  Failed to send OTP email:", err.message);
    throw err;
  }
};

const orderStatusTemplate = (name, orderNumber, status) => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#F7F5F0;font-family:'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr><td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E7E3D9;">
          <tr><td style="background:#0B0B0C;padding:28px 32px;">
            <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:1px;">TEENRAAH</span>
          </td></tr>
          <tr><td style="padding:32px;">
            <p style="color:#0B0B0C;font-size:16px;margin:0 0 8px;">Hi ${name || "there"},</p>
            <p style="color:#4B4A45;font-size:14px;line-height:1.6;margin:0 0 16px;">
              Your order <strong>${orderNumber}</strong> is now:
            </p>
            <div style="background:#F7F5F0;border-radius:10px;padding:14px 18px;margin-bottom:20px;">
              <span style="font-size:18px;font-weight:700;color:#2F5233;">${status}</span>
            </div>
            <p style="color:#8A8578;font-size:12px;line-height:1.6;margin:0;">
              Track your order anytime from your TeenRaah account.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
`;

export const sendOrderStatusEmail = async ({ to, name, orderNumber, status }) => {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Order ${orderNumber} — ${status}`,
      html: orderStatusTemplate(name, orderNumber, status),
    });
  } catch (err) {
    console.error("✉️  Failed to send order status email:", err.message);
  }
};
