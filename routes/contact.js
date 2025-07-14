const express = require("express");
const { Resend } = require("resend");
const rateLimit = require("express-rate-limit");
const router = express.Router();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Rate limiting for contact form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    error: "Too many contact form submissions, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to contact route
router.use(contactLimiter);

// Contact form submission
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email address",
      });
    }

    // Length validation
    if (name.length < 2 || message.length < 10) {
      return res.status(400).json({
        error:
          "Name must be at least 2 characters and message at least 10 characters",
      });
    }

    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return res.status(500).json({
        error: "Email service not configured",
      });
    }

    console.log("Sending email via Resend...");

    // Email to you (notification)
    const emailToYou = await resend.emails.send({
      from: process.env.EMAIL_FROM || "contact@portfolio.dev",
      to: process.env.EMAIL_TO || process.env.EMAIL_FROM,
      subject: `Portfolio Contact: ${subject}`,
      html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 300;">New Contact Message</h1>
        </div>
        
        <div style="padding: 30px;">
          <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 18px;">Contact Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600; width: 80px;">Name:</td>
                <td style="padding: 8px 0; color: #2c3e50;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600;">Email:</td>
                <td style="padding: 8px 0; color: #2c3e50;"><a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600;">Subject:</td>
                <td style="padding: 8px 0; color: #2c3e50; font-weight: 500;">${subject}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e1e8ed;">
            <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 16px;">Message:</h3>
            <div style="line-height: 1.6; color: #555; font-size: 15px; white-space: pre-wrap;">${message}</div>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #e8f4f8; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>📧 Sent from Portfolio Contact Form</strong><br>
              🕒 ${new Date().toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e1e8ed;">
          <p style="margin: 0; color: #999; font-size: 12px;">
            This email was sent from your portfolio contact form
          </p>
        </div>
      </div>
    `,
    });

    console.log("Notification email sent:", emailToYou.data?.id);

    // Auto-reply to sender
    const autoReply = await resend.emails.send({
      from: process.env.EMAIL_FROM || "contact@portfolio.dev",
      to: email,
      subject: "Thank you for reaching out!",
      html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 300;">Thank You!</h1>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #2c3e50; font-size: 20px; margin: 0 0 20px 0;">Hi ${name}! 👋</h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            Thank you for reaching out through my portfolio! I've received your message and will get back to you as soon as possible.
          </p>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #667eea;">
            <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 16px;">Your Message Summary:</h3>
            <p style="margin: 0 0 10px 0; color: #666;"><strong>Subject:</strong> ${subject}</p>
            <div style="background: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e1e8ed;">
              <p style="margin: 0; color: #555; line-height: 1.5; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 25px 0;">
            <p style="margin: 0; color: #667eea; font-weight: 500;">
              ⚡ I typically respond within 24 hours
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            In the meantime, feel free to check out more of my work or connect with me on social media.
          </p>
          
          <p style="color: #555; line-height: 1.6; margin-top: 30px;">
            Best regards,<br>
            <strong style="color: #2c3e50;">Your Name</strong>
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e1e8ed;">
          <p style="margin: 0; color: #999; font-size: 12px;">
            This is an automated response. Please do not reply to this email directly.
          </p>
        </div>
      </div>
    `,
    });

    console.log("Auto-reply sent:", autoReply.data?.id);

    res.json({
      success: true,
      message:
        "Message sent successfully! You should receive a confirmation email shortly.",
    });
  } catch (error) {
    console.error("Resend email error:", error);

    // More specific error handling
    if (error.message?.includes("API key")) {
      return res.status(500).json({
        error: "Email service configuration error",
      });
    }

    if (error.message?.includes("domain")) {
      return res.status(500).json({
        error: "Email domain not verified",
      });
    }

    res.status(500).json({
      error: "Failed to send message. Please try again later.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;

/*const express = require("express");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const router = express.Router();

// Rate limiting for contact form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    error: "Too many contact form submissions, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to contact route
router.use(contactLimiter);

// Contact form submission
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email address",
      });
    }

    // Length validation
    if (name.length < 2 || message.length < 10) {
      return res.status(400).json({
        error:
          "Name must be at least 2 characters and message at least 10 characters",
      });
    }

    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      // Log the contact form submission for now
      console.log("=== CONTACT FORM SUBMISSION ===");
      console.log("Name:", name);
      console.log("Email:", email);
      console.log("Subject:", subject);
      console.log("Message:", message);
      console.log("Time:", new Date().toLocaleString());
      console.log("================================");

      return res.json({
        success: true,
        message: "Message received! (Email service not configured yet)",
      });
    }

    // Create transporter (using Gmail as example)
    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // Your Gmail app password
      },
    });

    // Email to you (notification)
    const mailToYou = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Your email
      subject: `Portfolio Contact: ${subject}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
        </div>
        <div style="background: white; padding: 20px; border-left: 4px solid #667eea;">
          <h3 style="color: #333; margin-top: 0;">Message:</h3>
          <p style="line-height: 1.6; color: #555;">${message.replace(
            /\n/g,
            "<br>"
          )}</p>
        </div>
        <div style="margin-top: 30px; padding: 15px; background: #e8f4f8; border-radius: 5px;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            <strong>Sent from:</strong> Portfolio Contact Form<br>
            <strong>Time:</strong> ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    `,
    };

    // Auto-reply to sender
    const autoReply = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Thank you for contacting me!",
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Thank You, ${name}!</h2>
        <p>I've received your message and will get back to you as soon as possible.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Your Message:</h3>
          <p><strong>Subject:</strong> ${subject}</p>
          <p style="line-height: 1.6; color: #555;">${message.replace(
            /\n/g,
            "<br>"
          )}</p>
        </div>
        
        <p>Best regards,<br>Your Name</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">
          This is an automated response. Please do not reply to this email.
        </p>
      </div>
    `,
    };

    // Send both emails
    await transporter.sendMail(mailToYou);
    await transporter.sendMail(autoReply);

    console.log("Contact form email sent successfully");

    res.json({
      success: true,
      message: "Message sent successfully!",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({
      error: "Failed to send message. Please try again later.",
    });
  }
});

module.exports = router;
*/
