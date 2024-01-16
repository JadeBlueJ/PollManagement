const nodemailer = require('nodemailer')
const emailTemplate = require("../utilities/email-template");
module.exports.createTransportHelper = (config) => {
    const transporter = nodemailer.createTransport(config);
    return transporter;
};

module.exports.sendVerificationEmail = async (email, verificationToken,url) => {
    try {
        // Prepare the email content
        // Function to send the verification email
        const transporter = exports.createTransportHelper(CONFIG.smtpConfig)
        const emailSender = "admin@agamicommunications.com";
        let href = `${url}/verify?uid=${verificationToken}`;
        const mailOptions = {
            from: emailSender,
            to: email,
            subject: "Email Verification",
            html: `<div style="height: 350px; width: 70%; margin: auto; background-color: #f2f2f2; color: #444;">
             <div style="height: 50px; background: linear-gradient(45deg, #FFB921, #FFD301);text-align: center;">
                 <p style="margin-bottom: 0; font-size: 24px; font-weight: 700;margin-top: 0; padding: 12px 0px;">Lead2Cloze</p>
             </div>
              <div style="margin: auto 20%;">
                 <div style="padding: 30px 0px;">
                     <p style="margin-top: 0; ">Dear user,</p>
                     <p style="margin-top: 0;">Please click the button below to verify your email address and activate your account.</p>
                     <div style="margin: 20px 0px;"><a style="text-decoration: none; color: #FFB921; border: 1px solid #FFB921; border-radius: 10px; padding: 10px 30px; margin: 15px 0px;" href='${href}'><span >Verify Email</span></a></div>
                 </div>
              </div>
              <div style="height: 50px; background: #c3c3c3; text-align: center;">
                 <p style="margin-bottom: 0; font-size: 14px; font-weight: 300;margin-top: 0; padding: 15px 0px;">If you received this in error, simply ignore this email and do not click the button.</p>
             </div>
         </div> `,
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        return;
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error("Failed to send verification email");
    }
};

module.exports.sendEmail = async (type, templateDetails, emailTo = [], emailBcc = [], emailCc = []) => {
    let template = emailTemplate.getEmailTemplate(type, templateDetails);
    const transporter = exports.createTransportHelper(CONFIG.smtpConfig);
    const emailSender = "admin@agamicommunications.com";
    const mailOptions = {
        from: emailSender,
        to: emailTo,
        subject: template.subject,
        bcc: emailBcc,
        cc: emailCc,
        html: template.emailTemplate,
    };
    // Send the email
    await transporter.sendMail(mailOptions);
}