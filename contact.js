class ContactForm {
  constructor() {
    this.form = document.getElementById("contactForm");
    this.submitButton = document.getElementById("submitButton");
    this.buttonText = document.getElementById("buttonText");
    this.buttonIcon = document.getElementById("buttonIcon");
    this.loadingSpinner = document.getElementById("loadingSpinner");
    this.successMessage = document.getElementById("successMessage");
    this.errorMessage = document.getElementById("errorMessage");
    this.errorText = document.getElementById("errorText");

    this.init();
  }

  init() {
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));

    // Add input validation
    this.form.querySelectorAll("input, textarea").forEach((input) => {
      input.addEventListener("blur", () => this.validateField(input));
      input.addEventListener("input", () => this.clearFieldError(input));
    });
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    this.setLoadingState(true);
    this.hideMessages();

    const formData = new FormData(this.form);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      const response = await fetch(API_CONFIG.getURL('contact'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        this.showSuccess();
        this.form.reset();
      } else {
        this.showError(result.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Contact form error:", error);
      this.showError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      this.setLoadingState(false);
    }
  }

  validateForm() {
    let isValid = true;
    const fields = this.form.querySelectorAll(
      "input[required], textarea[required]"
    );

    fields.forEach((field) => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  }

  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = "";

    // Remove existing error styling
    this.clearFieldError(field);

    if (!value) {
      errorMessage = "This field is required";
      isValid = false;
    } else if (field.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errorMessage = "Please enter a valid email address";
        isValid = false;
      }
    } else if (field.name === "name" && value.length < 2) {
      errorMessage = "Name must be at least 2 characters";
      isValid = false;
    } else if (field.name === "message" && value.length < 10) {
      errorMessage = "Message must be at least 10 characters";
      isValid = false;
    }

    if (!isValid) {
      this.showFieldError(field, errorMessage);
    }

    return isValid;
  }

  showFieldError(field, message) {
    field.style.borderColor = "#e74c3c";
    field.style.background = "rgba(231, 76, 60, 0.05)";

    // Remove existing error message
    const existingError = field.parentNode.querySelector(".field-error");
    if (existingError) {
      existingError.remove();
    }

    // Add new error message
    const errorDiv = document.createElement("div");
    errorDiv.className = "field-error";
    errorDiv.style.cssText = `
          color: #e74c3c;
          font-size: 12px;
          margin-top: 5px;
          display: flex;
          align-items: center;
          gap: 5px;
      `;
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    field.parentNode.appendChild(errorDiv);
  }

  clearFieldError(field) {
    field.style.borderColor = "#e1e8ed";
    field.style.background = "rgba(255, 255, 255, 0.8)";

    const errorDiv = field.parentNode.querySelector(".field-error");
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  setLoadingState(loading) {
    this.submitButton.disabled = loading;

    if (loading) {
      this.buttonText.textContent = "Sending...";
      this.buttonIcon.style.display = "none";
      this.loadingSpinner.style.display = "block";
    } else {
      this.buttonText.textContent = "Send Message";
      this.buttonIcon.style.display = "block";
      this.loadingSpinner.style.display = "none";
    }
  }

  showSuccess() {
    this.successMessage.style.display = "block";
    this.successMessage.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.successMessage.style.display = "none";
    }, 5000);
  }

  showError(message) {
    this.errorText.textContent = message;
    this.errorMessage.style.display = "block";
    this.errorMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  hideMessages() {
    this.successMessage.style.display = "none";
    this.errorMessage.style.display = "none";
  }
}

// Initialize the contact form when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ContactForm();
});
