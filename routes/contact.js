const express = require("express");
const SibApiV3Sdk = require("@sendinblue/client");
const rateLimit = require("express-rate-limit");
const router = express.Router();

// Rate limiting
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    error: "Too many contact form submissions, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(contactLimiter);

router.post("/", async (req, res) => {
  try {
    console.log("Contact form submission received");
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    if (name.length < 2 || message.length < 10) {
      return res.status(400).json({
        error:
          "Name must be at least 2 characters and message at least 10 characters",
      });
    }

    if (!process.env.BREVO_API_KEY) {
      return res.status(500).json({ error: "Email service not configured" });
    }

    // Initialize Brevo
    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    let apiKey = apiInstance.authentications["apiKey"];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    console.log("Sending notification email via Brevo...");

    // Email to you (notification) - Windows 11 themed
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = `💼 Portfolio Contact from ${name}: ${subject}`;
    sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Portfolio Contact</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
        
        <div style="max-width: 600px; margin: 0 auto;">
          
          <!-- Header Card -->
          <div style="
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 12px 12px 0 0;
            padding: 30px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
          ">
            <div style="
              background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
              color: white;
              padding: 15px 25px;
              border-radius: 25px;
              display: inline-block;
              margin-bottom: 15px;
              font-weight: 600;
              font-size: 14px;
              letter-spacing: 0.5px;
            ">
              📧 NEW CONTACT MESSAGE
            </div>
            <h1 style="
              margin: 0;
              color: #2c3e50;
              font-size: 28px;
              font-weight: 300;
              letter-spacing: -0.5px;
            ">Portfolio Contact</h1>
            <p style="
              margin: 10px 0 0 0;
              color: #7f8c8d;
              font-size: 14px;
              opacity: 0.8;
            ">From katekanin.github.io</p>
          </div>

          <!-- Contact Details Card -->
          <div style="
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(15px);
            border-left: 4px solid #0078d4;
            padding: 25px;
            margin: 0;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 16px rgba(31, 38, 135, 0.2);
          ">
            <h2 style="
              margin: 0 0 20px 0;
              color: #2c3e50;
              font-size: 18px;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 10px;
            ">
           
              Contact Information
            </h2>
            
            <div style="display: grid; gap: 15px;">
              <div style="
                background: rgba(0, 120, 212, 0.05);
                padding: 15px;
                border-radius: 8px;
                border-left: 3px solid #0078d4;
              ">
                <div style="color: #0078d4; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Name</div>
                <div style="color: #2c3e50; font-size: 16px; font-weight: 500;">${name}</div>
              </div>
              
              <div style="
                background: rgba(0, 120, 212, 0.05);
                padding: 15px;
                border-radius: 8px;
                border-left: 3px solid #0078d4;
              ">
                <div style="color: #0078d4; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Email</div>
                <div style="color: #2c3e50; font-size: 16px;">
                  <a href="mailto:${email}" style="color: #0078d4; text-decoration: none; font-weight: 500;">${email}</a>
                </div>
              </div>
              
              <div style="
                background: rgba(0, 120, 212, 0.05);
                padding: 15px;
                border-radius: 8px;
                border-left: 3px solid #0078d4;
              ">
                <div style="color: #0078d4; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Subject</div>
                <div style="color: #2c3e50; font-size: 16px; font-weight: 500;">${subject}</div>
              </div>
            </div>
          </div>

          <!-- Message Card -->
          <div style="
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            padding: 25px;
            margin: 0;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 16px rgba(31, 38, 135, 0.2);
          ">
            <h3 style="
              margin: 0 0 15px 0;
              color: #2c3e50;
              font-size: 16px;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 10px;
            ">
          
              Message
            </h3>
            <div style="
              background: rgba(248, 249, 250, 0.8);
              padding: 20px;
              border-radius: 8px;
              border: 1px solid rgba(0, 120, 212, 0.1);
              line-height: 1.6;
              color: #2c3e50;
              font-size: 15px;
              white-space: pre-wrap;
            ">${message}</div>
          </div>

          <!-- Footer Card -->
          <div style="
            background: rgba(32, 32, 32, 0.95);
            backdrop-filter: blur(20px);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 12px 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
          ">
            <div style="
              background: rgba(0, 120, 212, 0.2);
              padding: 12px;
              border-radius: 8px;
              margin-bottom: 15px;
            ">
              <div style="font-size: 14px; font-weight: 600; margin-bottom: 5px;">📧 Sent from Portfolio Contact Form</div>
              <div style="font-size: 12px; opacity: 0.8;">🕒 ${new Date().toLocaleString(
                "en-US",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}</div>
            </div>
            
            <div style="font-size: 12px; opacity: 0.6;">
              <a href="https://katekanin.github.io" style="color: #74C0FC; text-decoration: none;">
                🌐 Visit Portfolio
              </a>
              </a>
            </div>
          </div>

        </div>
      </body>
    </html>
  `;

    sendSmtpEmail.sender = {
      name: "Kate's Portfolio Contact Form",
      email: process.env.EMAIL_FROM,
    };
    sendSmtpEmail.to = [
      {
        email: process.env.EMAIL_TO,
        name: "Kate",
      },
    ];
    sendSmtpEmail.replyTo = { email: email, name: name };

    const emailResult = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Notification email sent, ID:", emailResult.body?.messageId);

    let autoReplyEmail = new SibApiV3Sdk.SendSmtpEmail();
    autoReplyEmail.subject = "✨ Thank you for reaching out!";
    autoReplyEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
        
        <div style="max-width: 600px; margin: 0 auto;">
          
          <!-- Header Card -->
          <div style="
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 12px 12px 0 0;
            padding: 40px 30px 30px 30px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
          ">
            <div style="
              background: linear-gradient(135deg, #0078d4 0%, #7b10beff 100%);
              color: white;
              padding: 15px 25px;
              border-radius: 50px;
              display: inline-block;
              margin-bottom: 20px;
              font-weight: 600;
              font-size: 14px;
              letter-spacing: 0.5px;
            ">
               Thank You for Contacting Me!
            </div>
            
            <h1 style="
              margin: 0;
              color: #0078d4;
              font-size: 20px;
              font-weight: 400;
            ">Hi ${name}! 👋</h>
          </div>

          <!-- Main Content Card -->
          <div style="
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(15px);
            padding: 30px;
            margin: 0;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 16px rgba(31, 38, 135, 0.2);
          ">
            <div style="
              background: rgba(0, 120, 212, 0.05);
              padding: 20px;
              border-radius: 12px;
              border-left: 4px solid #0078d4;
              margin-bottom: 25px;
            ">
              <p style="
                margin: 0;
                color: #2c3e50;
                font-size: 16px;
                line-height: 1.6;
              ">
                Thank you for reaching out through my portfolio! I've received your message and will get back to you as soon as possible.
              </p>
            </div>

            <!-- Message Summary Card -->
            <div style="
              background: rgba(248, 249, 250, 0.8);
              border-radius: 12px;
              padding: 20px;
              margin: 25px 0;
              border: 1px solid rgba(0, 120, 212, 0.1);
            ">
              <h3 style="
                margin: 0 0 15px 0;
                color: #0078d4;
                font-size: 16px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10px;
              ">
                Your Message Summary
              </h3>
              
              <div style="margin-bottom: 15px;">
                <div style="color: #0078d4; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; margin-left: 5px;">Subject</div>
                <div style="color: #2c3e50; font-size: 16px; font-weight: 500;">${subject}</div>
              </div>
              
              <div style="
                background: white;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid rgba(0, 120, 212, 0.1);
              ">
                <div style="color: #0078d4; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Message</div>
                <div style="
                  color: #2c3e50;
                  line-height: 1.5;
                  font-size: 14px;
                  white-space: pre-wrap;
                ">${message}</div>
              </div>
            </div>

            <!-- Response Time Card -->
            <div style="
              background: linear-gradient(135deg, rgba(0, 120, 212, 0.1) 0%, rgba(16, 110, 190, 0.1) 100%);
              padding: 20px;
              border-radius: 12px;
              text-align: center;
              margin: 25px 0;
              border: 1px solid rgba(0, 120, 212, 0.2);
            ">
              <div style="
                color: #0078d4;
                font-size: 18px;
                margin-bottom: 5px;
              ">⚡</div>
              <p style="
                margin: 0;
                color: #0078d4;
                font-weight: 600;
                font-size: 16px;
              ">I typically respond within 24 hours</p>
            </div>

            <p style="
              color: #2c3e50;
              line-height: 1.6;
              font-size: 15px;
              text-align: center;
              margin: 25px 0 0 0;
            ">
              In the meantime, feel free to explore more of <a href="https://katekanin.github.io"> my work </a>.
            </p>
            <br>
            <div style="margin-bottom: 20px;">
              <div style="font-size: 18px; color:"#2c3e50" font-weight: 300; margin-bottom: 5px;">Best regards,</div>
              <div style="font-size: 24px; font-weight: 600; color: #0078d4;">Katekani Nyamandi</div> <div style="font-size: 14px; opacity: 0.8; margin-top: 5px;">Junior Developer</div>
            </div>
            
            <div style="
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 5px;
              border-radius: 8px;
              margin-top: 20px;
            ">
              <div style="font-size: 12px; opacity: 0.8; margin-bottom: 10px;">
                🌐 <a href="https://linkedin.com/in/katekanin" style="color: #87ceeb; text-decoration: none;">Let's connect on LinkedIn</a>
              </div>
            </div>
          </div>

        </div>
      </body>
    </html>
  `;

    autoReplyEmail.sender = {
      name: "Katekani Nyamandi - Junior Developer",
      email: process.env.EMAIL_FROM,
    };
    autoReplyEmail.to = [{ email: email, name: name }];

    const autoReplyResult = await apiInstance.sendTransacEmail(autoReplyEmail);
    console.log("Auto-reply sent, ID:", autoReplyResult.body?.messageId);

    res.json({
      success: true,
      message:
        "Message sent successfully! You should receive a confirmation email shortly.",
    });
  } catch (error) {
    console.error("Brevo email error:", error);
    res.status(500).json({
      error: "Failed to send message. Please try again later.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
