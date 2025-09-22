const geminiService = require("../services/geminiService");

// In-memory chat history (replace with database in production)
const chatSessions = {};

exports.processChat = async (req, res, next) => {
  try {
    const { message, sessionId = "default", history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get or initialize chat history
    if (!chatSessions[sessionId]) {
      chatSessions[sessionId] = [];
    }

    // Combine provided history with stored history if needed
    const chatHistory = history.length > 0 ? history : chatSessions[sessionId];

    // Add user message to history
    const userMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    // Create a new history array with the user message
    const updatedHistory = [...chatHistory, userMessage];

    // Get response from Gemini
    const response = await geminiService.generateResponse(
      message,
      updatedHistory
    );

    // Add AI response to history
    const assistantMessage = {
      role: "assistant",
      content: response,
      timestamp: new Date().toISOString(),
    };

    // Update history with both messages
    updatedHistory.push(assistantMessage);

    // Update session history (keep last 20 messages to manage context window)
    chatSessions[sessionId] = updatedHistory.slice(-20);

    // Send response
    res.status(200).json({
      response,
      sessionId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat processing error:", error);
    next(error);
  }
};

exports.getChatHistory = (req, res) => {
  const { sessionId = "default" } = req.query;
  const history = chatSessions[sessionId] || [];
  res.status(200).json({ history, sessionId });
};
