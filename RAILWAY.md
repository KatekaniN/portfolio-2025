# Railway Deployment
This portfolio is deployed on Railway with the following configuration:

## Environment Variables Required:
- GEMINI_API_KEY: Google Gemini AI API key
- WEATHER_API_KEY: Weather API key  
- NEWSDATA_API_KEY: News API key
- BREVO_API_KEY: Brevo email service API key
- EMAIL_FROM: Sender email address
- EMAIL_TO: Recipient email address
- NODE_ENV: Set to 'production'
- PORT: Automatically set by Railway

## Deployment Notes:
- Uses Nixpacks builder
- Health check endpoint: /health
- Auto-restart on failure
- Always-on server (no sleep mode)
