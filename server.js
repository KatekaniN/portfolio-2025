// server.js
const express = require("express");
const cors = require("cors");
const contactRoutes = require("./routes/contact.js");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const chatRoutes = require("./routes/chat.js");
const weatherNewsRoutes = require("./routes/weather-news.js"); // Add this

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",")
      : ["http://localhost:8080", "http://127.0.0.1:5500"];

    // Allow Railway domains
    if (origin.includes(".railway.app") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(".")); // Serve static files from current directory

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api", limiter);

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api", weatherNewsRoutes);
app.use("/api/contact", contactRoutes);
// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    apiKeyConfigured: !!process.env.GEMINI_API_KEY,
    weatherApiConfigured: !!process.env.WEATHER_API_KEY, // Add this
    newsApiConfigured: !!process.env.NEWS_API_KEY, // Add this
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
      status: err.status || 500,
    },
  });
});

/*
app.get("/test-brevo", async (req, res) => {
  try {
    // Testing Brevo email configuration
    
    const SibApiV3Sdk = require("@sendinblue/client");

    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    let apiKey = apiInstance.authentications["apiKey"];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = "Test Email from Portfolio";
    sendSmtpEmail.htmlContent =
      "<h1>Test successful!</h1><p>Brevo is working with your GitHub Pages domain!</p>";
    sendSmtpEmail.sender = {
      name: "Katekani Nyamandi",
      email: process.env.EMAIL_FROM ,
    };
    sendSmtpEmail.to = [{ email: "knyamandi99@gmail.com", name: "Kate" }];

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    res.json({
      success: true,
      result: result,
      messageId: result.messageId || result.response?.messageId || "sent",
    });
  } catch (error) {
    console.error("Brevo test error:", error);
    console.error("Error response:", error.response?.body || error.response);

    res.status(500).json({
      error: error.message,
      statusCode: error.response?.status,
      details: error.response?.body || error.response,
      fullError: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
});*/

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Portfolio server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(
    `🤖 Gemini API: ${process.env.GEMINI_API_KEY ? "✅ Configured" : "❌ Missing"}`
  );
  console.log(
    `🌤️ Weather API: ${process.env.WEATHER_API_KEY ? "✅ Configured" : "❌ Missing"}`
  );
  console.log(
    `📧 Email API: ${process.env.BREVO_API_KEY ? "✅ Configured" : "❌ Missing"}`
  );
});
