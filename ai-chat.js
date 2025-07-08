class AIPortfolioChat {
  constructor() {
    this.messageCount = 1; // Start with 1 for welcome message
    this.isTyping = false;
    this.chatHistory = [];

    // Initialize elements and event listeners
    this.initializeElements();
    this.attachEventListeners();
    this.updateMessageCount();

    // Store initial welcome message in history
    this.chatHistory.push({
      role: "assistant",
      content: document.querySelector(".ai-message-text").innerHTML,
      timestamp: new Date().toISOString(),
    });
  }

  initializeElements() {
    this.chatMessages = document.getElementById("chatMessages");
    this.messageInput = document.getElementById("messageInput");
    this.sendButton = document.getElementById("sendButton");
    this.typingIndicator = document.getElementById("typingIndicator");
    this.messageCountDisplay = document.getElementById("messageCount");
    this.charCount = document.getElementById("charCount");
    this.statusIndicator = document.querySelector(".ai-status-indicator");
  }

  attachEventListeners() {
    // Send message events
    this.sendButton.addEventListener("click", () => this.sendMessage());
    this.messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Character count
    this.messageInput.addEventListener("input", () => {
      const length = this.messageInput.value.length;
      this.charCount.textContent = `${length}/500`;
      this.charCount.style.color = length > 450 ? "#dc3545" : "#666";
    });

    // Focus input when window is clicked
    document.getElementById("aiChat").addEventListener("click", (e) => {
      if (!window.getSelection().toString()) {
        this.messageInput.focus();
      }
    });
  }

  async sendMessage() {
    const message = this.messageInput.value.trim();
    if (!message || this.isTyping) return;

    // Add user message to UI
    this.addMessage(message, "user");

    // Clear input field
    this.messageInput.value = "";
    this.charCount.textContent = "0/500";
    this.charCount.style.color = "#666";

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // This will be replaced with actual API call to your Node.js backend
      const response = await this.callBackendAPI(message);

      // Hide typing indicator and show response
      this.hideTypingIndicator();
      this.addMessage(response, "bot");
    } catch (error) {
      console.error("Error calling backend:", error);
      this.hideTypingIndicator();
      this.setOnlineStatus(false);

      // Show error message
      this.addMessage(
        "I'm having trouble connecting to my brain right now. Please try again in a moment.",
        "bot"
      );

      // Reset status after a delay
      setTimeout(() => this.setOnlineStatus(true), 3000);
    }
  }

  addMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `ai-message ${sender}-message`;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const avatar =
      sender === "bot"
        ? '<img class="ai-avatar" src="./icons/kate.png"></img>'
        : '<img class="ai-avatar" src="./icons/user.png"></img>';
    const authorName = sender === "bot" ? "AI Assistant" : "You";

    messageDiv.innerHTML = `
     <div class="ai-message-avatar">
       <div class="ai-avatar ${sender}-avatar">${avatar}</div>
     </div>
     <div class="ai-message-content">
       <div class="ai-message-header">
         <span class="ai-message-author">${authorName}</span>
         <span class="ai-message-timestamp">${timestamp}</span>
       </div>
       <div class="ai-message-text">${this.formatMessage(text)}</div>
     </div>
   `;

    this.chatMessages.appendChild(messageDiv);
    this.scrollToBottom();
    this.messageCount++;
    this.updateMessageCount();

    // Store in chat history for context
    this.chatHistory.push({
      role: sender === "user" ? "user" : "assistant",
      content: text,
      timestamp: new Date().toISOString(),
    });
  }

  formatMessage(text) {
    // Basic formatting for messages
    return text
      .replace(/\n/g, "<br>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
  }

  showTypingIndicator() {
    this.isTyping = true;
    this.typingIndicator.style.display = "block";
    this.sendButton.disabled = true;
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    this.isTyping = false;
    this.typingIndicator.style.display = "none";
    this.sendButton.disabled = false;
  }

  scrollToBottom() {
    setTimeout(() => {
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }, 100);
  }

  updateMessageCount() {
    this.messageCountDisplay.textContent = `Messages: ${this.messageCount}`;
  }

  setOnlineStatus(isOnline) {
    this.statusIndicator.className = `ai-status-indicator ${
      isOnline ? "online" : "offline"
    }`;
    const statusText = this.statusIndicator.nextElementSibling;
    statusText.textContent = `AI Assistant: ${isOnline ? "Online" : "Offline"}`;
  }

  /**
   * This method will be replaced with actual API call to your Node.js backend
   * For now, it returns a placeholder response
   */
  async callBackendAPI(message) {
    try {
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          history: this.chatHistory.slice(-10), // Send last 10 messages for context
          sessionId: "default", // You can generate unique session IDs for multiple users
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("API call failed:", error);
      throw error;
    }
  }
}

// Initialize the AI Chat when the document is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize the AI Chat
  window.aiChat = new AIPortfolioChat();

  // Add click event for the AI Chat icon
  const aiChatIcon = document.querySelector(".ai-chat-icon");
  if (aiChatIcon) {
    aiChatIcon.addEventListener("click", function () {
      const windowId = this.getAttribute("data-window");
      if (windowId && window.windowManager) {
        // Use the existing window manager to open the window
        window.windowManager.openWindow(windowId);

        // Focus on input after a short delay
        setTimeout(() => {
          document.getElementById("messageInput").focus();
        }, 300);
      }
    });
  }
});
