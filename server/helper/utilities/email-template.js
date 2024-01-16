const constants = require("./constants")
const messages = require("./message")
module.exports.getEmailTemplate = (type, options) => {
  switch (type) {
    case constants.emailTemplateType.REMINDER_EMAIL:
      const emailTemplate = `
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reminder</title>
              </head>
              <body style="font-family: Arial, sans-serif;">
                  <div style="height: auto; width: 70%; margin: auto;  background-color: #f2f2f2; color: #444;">
                      <div style="height: 50px; background: linear-gradient(45deg, #FFB921, #FFD301);text-align: center;">
                          <p style="margin-bottom: 0; font-size: 18px; font-weight: 700;margin-top: 0; padding: 15px 0px;">Lead2Cloze</p>
                      </div>
                      <div style="margin: auto 20%;">
                          <div style="padding: 30px 0px;">
                              <p style="margin-top: 0; ">Dear ${options.firstName} ${options.lastName},</p>
                              <p style="margin-top: 0;">Reminder For Task.</p>
                              <p style="margin-top: 0;">Lead Details:</p>
                              <ul>
                                  <li style="margin-top: 0; margin-bottom: 10px;">Lead Name: ${options.leadName}</li>
                                  <li style="margin-top: 0; margin-bottom: 10px;">Email: ${options.email}</li>
                                  <li style="margin-top: 0; margin-bottom: 10px;">Mobile Number: ${options.mobileNumber}</li>
                                  <li style="margin-top: 0; margin-bottom: 10px;">Industry: ${options.industry}</li>
                                  <li style="margin-top: 0; margin-bottom: 10px;">Country: ${options.country}</li>
                                  <li style="margin-top: 0; margin-bottom: 10px;">Website URL: <a href="${options.websiteUrl}">${options.websiteUrl}</a> </li>
                                  <li style="margin-top: 0; margin-bottom: 10px;">Country: ${options.country}</li>
                                  <li style="margin-top: 0; margin-bottom: 10px;">Social Media URL: <a href="${options.socialMediaUrl}">${options.socialMediaUrl}</a></li>
                                </ul>
                                <p style="margin-top: 0;">Thanks,</p>
                                <p style="margin-top: 0;">Team Lead2Cloze</p>
                          </div>
                      </div>
                      <div style="height: auto; background: #c3c3c3; text-align: center;">
                          <p style="margin-bottom: 0; font-size: 14px; font-weight: 300;margin-top: 0; padding: 15px 10px;">If you received this in error, simply ignore this email and do not click the button.</p>
                      </div>
                  </div>
              </body>
            </html>
            `;

      return {
        subject: messages.emailSubject.REMINDER,
        emailTemplate: emailTemplate,
      }
    case constants.emailTemplateType.FORGET_PASSWORD:
      const forgetPassword = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Forgot Password</title>
            </head>
            <body style="font-family: Arial, sans-serif;">
                <div style="width: 70%; margin: auto; background-color: #f2f2f2; color: #444;">
                    <div style="height: 50px; background: linear-gradient(45deg, #FFB921, #FFD301);text-align: center;">
                        <p style="margin-bottom: 0; font-size: 24px; font-weight: 700;margin-top: 0; padding: 12px 0px;">Lead2Cloze</p>
                    </div>

                    <div style="margin: auto 20%;">
                        <div style="padding: 30px 0px;">
                            <h2 style="color: #FFB921; margin-top: 0px;">Forgot Password</h2>
                            <p>Hello ${options.firstName} ${options.lastName},</p>
                            <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
                            <p>To reset your password, click the link below:</p>
                            <p style="padding: 10px 0px;"><a href="${options.url}/forget-password?uid=${options.id}" style="text-decoration: none; color: #000000; background-color: #FFB921; border-radius: 10px; padding: 10px 30px; margin: 15px 0px;">Reset Password</a></p>
                            <p>If the above link doesn't work, copy and paste the following URL into your browser:</p>
                            <p>${options.url}/forget-password?uid=${options.id}</p>
                            <p>If you need any assistance, please contact our support team at ${CONFIG.SUPPORT_EMAIL}.</p>
                            <p>Best regards,<br>
                            Team Lead2Cloze</p>
                        </div>
                    </div>
                    <div style="height: auto; background: #c3c3c3; text-align: center;">
                        <p style="margin-bottom: 0; font-size: 14px; font-weight: 300;margin-top: 0; padding: 15px 10px;">If you received this in error, simply ignore this email and do not click the button.</p>
                    </div>
                </div>
            </body> 
            </html>`
      return {
        subject: messages.emailSubject.FORGET_PASSWORD,
        emailTemplate: forgetPassword,
      }
    default:
      break;
  }
}