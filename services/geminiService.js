// services/geminiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const portfolioPrompt = require("../prompt.js");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Debug environment variables
console.log("🔍 Environment variable debug:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log(
  "Available env vars:",
  Object.keys(process.env).filter(
    (key) =>
      key.includes("GEMINI") || key.includes("API") || key.includes("KEY")
  )
);
console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
console.log("GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length || 0);

// Get API key from environment variables
const apiKey = process.env.GEMINI_API_KEY;

let genAI = null;
let model = null;
let isInitialized = false;

function initializeGemini() {
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY not found in environment variables");
    return false;
  }

  try {
    // Initialize Gemini API
    genAI = new GoogleGenerativeAI(apiKey);
    console.log("Successfully initialized Google Generative AI client");

    model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    console.log("Gemini model initialized with model: gemini-1.5-flash");
    isInitialized = true;
    return true;
  } catch (error) {
    console.error("Failed to initialize Gemini:", error);
    return false;
  }
}

// Try to initialize on module load, but don't throw if it fails
initializeGemini();

/**
 * Generate a response using Gemini API
 * @param {string} message - User's message
 * @param {Array} history - Chat history
 * @returns {Promise<string>} - AI response
 */
exports.generateResponse = async (message, history) => {
  try {
    // Check if Gemini is initialized
    if (!isInitialized || !model) {
      // Try to initialize again
      if (!initializeGemini()) {
        throw new Error(
          "Gemini API is not configured. Please contact the site administrator."
        );
      }
    }

    console.log("Generating response for message:", message);

    // Get system prompt
    const systemPrompt = portfolioPrompt.getSystemPrompt();

    // Format the conversation history as a text prompt
    let conversationContext = "";

    // Include up to 10 previous exchanges for context
    const recentHistory = history.slice(-10);
    if (recentHistory.length > 0) {
      conversationContext = "Previous conversation:\n";
      recentHistory.forEach((msg) => {
        const role = msg.role === "user" ? "User" : "Assistant";
        conversationContext += `${role}: ${msg.content}\n`;
      });
      conversationContext += "\n";
    }

    // Create the full prompt
    const fullPrompt = `${systemPrompt}

${conversationContext}
User: ${message}`;

    // Generate content with the full prompt
    console.log("Calling Gemini API...");

    try {
      const generationResult = await model.generateContent(fullPrompt);

      if (!generationResult || !generationResult.response) {
        throw new Error("Empty response from Gemini API");
      }

      const response = generationResult.response.text();
      console.log("Response received, length:", response.length);

      return response;
    } catch (generationError) {
      console.error("Generation error:", generationError);
      throw generationError;
    }
  } catch (error) {
    console.error("Gemini API error:", error);

    // Check for specific error types
    if (error.message && error.message.includes("API key")) {
      throw new Error("Invalid API key. Please check your configuration.");
    } else if (error.message && error.message.includes("rate limit")) {
      throw new Error("Rate limit exceeded. Please try again later.");
    } else if (error.message && error.message.includes("content filtered")) {
      throw new Error(
        "Content was filtered by safety settings. Please rephrase your message."
      );
    } else if (error.message && error.message.includes("not found")) {
      throw new Error(
        "Model not found. Please check if the model name is correct."
      );
    }

    throw new Error("Failed to generate response from AI: " + error.message);
  }
};

// Optional: Function to list available models (for debugging)
exports.listAvailableModels = async () => {
  try {
    const models = await genAI.listModels();
    console.log("Available models:");
    models.forEach((model) => {
      console.log(`- ${model.name}: ${model.displayName}`);
    });
    return models;
  } catch (error) {
    console.error("Error listing models:", error);
    throw error;
  }
};
