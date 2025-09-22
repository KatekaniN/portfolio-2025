// services/openaiService.js
const OpenAI = require("openai");
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
      key.includes("OPENAI") || key.includes("API") || key.includes("KEY")
  )
);
console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
console.log("OPENAI_API_KEY length:", process.env.OPENAI_API_KEY?.length || 0);

// Get API key from environment variables
const apiKey = process.env.OPENAI_API_KEY;

let openai = null;
let isInitialized = false;

function initializeOpenAI() {
  if (!apiKey) {
    console.error("Error: OPENAI_API_KEY not found in environment variables");
    return false;
  }

  try {
    // Initialize OpenAI API
    openai = new OpenAI({
      apiKey: apiKey,
    });
    console.log("Successfully initialized OpenAI client");
    isInitialized = true;
    return true;
  } catch (error) {
    console.error("Failed to initialize OpenAI:", error);
    return false;
  }
}

// Try to initialize on module load, but don't throw if it fails
initializeOpenAI();

/**
 * Generate a response using OpenAI API
 * @param {string} message - User's message
 * @param {Array} history - Chat history
 * @returns {Promise<string>} - AI response
 */
exports.generateResponse = async (message, history) => {
  try {
    // Check if OpenAI is initialized
    if (!isInitialized || !openai) {
      // Try to initialize again
      if (!initializeOpenAI()) {
        throw new Error(
          "OpenAI API is not configured. Please contact the site administrator."
        );
      }
    }

    console.log("Generating response for message:", message);

    // Get system prompt
    const systemPrompt = portfolioPrompt.getSystemPrompt();

    // Format the conversation history for OpenAI messages format
    const messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    // Include up to 10 previous exchanges for context
    const recentHistory = history.slice(-10);
    recentHistory.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Add the current user message
    messages.push({
      role: "user",
      content: message
    });

    // Generate content with OpenAI
    console.log("Calling OpenAI API...");

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Lightweight and efficient model
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      if (!completion.choices || completion.choices.length === 0) {
        throw new Error("Empty response from OpenAI API");
      }

      const response = completion.choices[0].message.content;
      console.log("Response received, length:", response.length);

      return response;
    } catch (generationError) {
      console.error("Generation error:", generationError);
      throw generationError;
    }
  } catch (error) {
    console.error("OpenAI API error:", error);

    // Check for specific error types
    if (error.message && error.message.includes("API key")) {
      throw new Error("Invalid API key. Please check your configuration.");
    } else if (error.message && error.message.includes("rate limit")) {
      throw new Error("Rate limit exceeded. Please try again later.");
    } else if (error.message && error.message.includes("content filtered")) {
      throw new Error(
        "Content was filtered by safety settings. Please rephrase your message."
      );
    } else if (error.message && error.message.includes("model not found")) {
      throw new Error(
        "Model not found. Please check if the model name is correct."
      );
    } else if (error.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    } else if (error.status === 401) {
      throw new Error("Invalid API key. Please check your configuration.");
    }

    throw new Error("Failed to generate response from AI: " + error.message);
  }
};

// Optional: Function to list available models (for debugging)
exports.listAvailableModels = async () => {
  try {
    if (!openai) {
      throw new Error("OpenAI client not initialized");
    }
    
    const models = await openai.models.list();
    console.log("Available models:");
    models.data.forEach((model) => {
      console.log(`- ${model.id}: ${model.owned_by}`);
    });
    return models.data;
  } catch (error) {
    console.error("Error listing models:", error);
    throw error;
  }
};
