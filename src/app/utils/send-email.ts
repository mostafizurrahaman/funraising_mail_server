import nodemailer from "nodemailer";
import { configs } from "../configs";

export const transporter = nodemailer.createTransport({
   host: configs.nodemailerHost,
   port: configs.nodemailerPort,
   secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
   auth: {
      user: configs.nodemailerEmail,
      pass: configs.nodemailerPassword,
   },
});

export const sendEmail = async ({
   to,
   subject,
   text,
   html,
}: {
   to: string;
   subject: string;
   text?: string;
   html?: string;
}) => {
   try {
      const info = await transporter.sendMail({
         from: `"Medical Booking Portal" <${configs.nodemailerEmail}>`, // sender address matches authenticated user
         to: to, // list of recipients
         subject: subject, // subject line
         text: text || "Please enable HTML to view this email.", // plain text fallback is required by many spam filters
         html: html,
      });

      console.log("Message sent: %s", info.messageId);
      // Preview URL is only available when using an Ethereal test account
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
   } catch (err) {
      console.error("Error while sending mail:", err);
   }
};

export const driverPasswordChangedTemplate = ({
   driverName,
   email,
   password,
   companyName,
}: {
   driverName: string;
   email: string;
   password: string;
   companyName: string;
}) => {
   const text = `Hallo ${driverName},

Ihr Passwort für Ihr Fahrerkonto wurde von Ihrem Unternehmensadministrator geändert.
Sie können sich mit den folgenden Zugangsdaten anmelden:

Neues Passwort: ${password}

Hinweis: Aus Sicherheitsgründen empfehlen wir Ihnen, das Passwort nach der ersten Anmeldung zu ändern.
Falls Sie Fragen haben, wenden Sie sich bitte an Ihren Unternehmensadministrator.

Mit freundlichen Grüßen,
${companyName}

Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese Nachricht.`;

   const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Passwort geändert</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:40px 0;background:#f4f4f4;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:#1f2937;color:#fff;padding:24px;text-align:center;font-size:24px;font-weight:bold;">
              Passwort geändert
            </td>
          </tr>

          <tr>
            <td style="padding:32px;color:#333;font-size:16px;line-height:1.7;">
              <p>Hallo <strong>${driverName}</strong>,</p>

              <p>
                Ihr Passwort für Ihr Fahrerkonto wurde von Ihrem Unternehmensadministrator geändert.
              </p>

              <p>Sie können sich mit den folgenden Zugangsdaten anmelden:</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:6px;">
                <tr>
                  <td style="padding:16px;">
                   
                    <p style="margin:0;">
                      <strong>Neues Passwort:</strong>
                      <span style="font-family:monospace;background:#eef2ff;padding:4px 8px;border-radius:4px;">
                        ${password}
                      </span>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin-top:24px;">
                <strong>Hinweis:</strong> Aus Sicherheitsgründen empfehlen wir Ihnen,
                das Passwort nach der ersten Anmeldung zu ändern.
              </p>

              <p>
                Falls Sie Fragen haben, wenden Sie sich bitte an Ihren Unternehmensadministrator.
              </p>

              <p style="margin-top:32px;">
                Mit freundlichen Grüßen,<br />
                <strong>${companyName}</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px;text-align:center;font-size:12px;color:#6b7280;background:#f9fafb;">
              Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese Nachricht.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

   return { text, html };
};

export const emailVerificationTemplate = ({
   name,
   verificationLink,
}: {
   name: string;
   verificationLink: string;
}) => {
   const text = `Hello ${name},

Thank you for registering. Please open the link below to verify your email address and activate your account:
${verificationLink}

If you didn't create an account, you can safely ignore this email.`;

   const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Verification</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:40px 0;background:#f4f4f4;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:#1f2937;color:#fff;padding:24px;text-align:center;font-size:24px;font-weight:bold;">
              Verify Your Email Address
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#333;font-size:16px;line-height:1.7;">
              <p>Hello <strong>${name}</strong>,</p>
              <p>Thank you for registering. Please click the button below to verify your email address and activate your account.</p>
              <p style="text-align:center;margin-top:24px;margin-bottom:24px;">
                <a href="${verificationLink}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;font-weight:bold;border-radius:4px;">
                  Verify Email
                </a>
              </p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
              <p style="margin-top:24px;font-size:14px;color:#666;">Or copy and paste this link into your browser:<br/><a href="${verificationLink}">${verificationLink}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

   return { text, html };
};

export const forgetPasswordTemplate = ({
   name,
   resetLink,
}: {
   name: string;
   resetLink: string;
}) => {
   const text = `Hello ${name},

You have requested to reset your password. Please open the link below to reset it:
${resetLink}

If you didn't request a password reset, you can safely ignore this email.`;

   const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Password</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:40px 0;background:#f4f4f4;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:#1f2937;color:#fff;padding:24px;text-align:center;font-size:24px;font-weight:bold;">
              Reset Your Password
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#333;font-size:16px;line-height:1.7;">
              <p>Hello <strong>${name}</strong>,</p>
              <p>You recently requested to reset your password. Please click the button below to proceed.</p>
              <p style="text-align:center;margin-top:24px;margin-bottom:24px;">
                <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#ef4444;color:#fff;text-decoration:none;font-weight:bold;border-radius:4px;">
                  Reset Password
                </a>
              </p>
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
              <p style="margin-top:24px;font-size:14px;color:#666;">Or copy and paste this link into your browser:<br/><a href="${resetLink}">${resetLink}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

   return { text, html };
};
