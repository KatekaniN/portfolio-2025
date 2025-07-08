// config/config.js
require('dotenv').config();

module.exports = {
 port: process.env.PORT || 3000,
 geminiApiKey: process.env.GEMINI_API_KEY,
 environment: process.env.NODE_ENV || 'development',
 corsOrigins: process.env.CORS_ORIGINS || '*',
 rateLimits: {
   windowMs: 15 * 60 * 1000, // 15 minutes
   max: process.env.NODE_ENV === 'production' ? 50 : 100 // Limit each IP
 }
};
