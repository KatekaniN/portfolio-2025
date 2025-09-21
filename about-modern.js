// Simplified About Me Interactions
(function () {
  // Wait for DOM to be ready
  document.addEventListener("DOMContentLoaded", function () {
    initializeAboutMe();
  });

  function initializeAboutMe() {
    // Add interactive enhancements
    addInteractiveEnhancements();
  }

  function addInteractiveEnhancements() {
    // Add hover effects to explore cards
    const exploreCards = document.querySelectorAll(".explore-card");
    exploreCards.forEach((card) => {
      card.addEventListener("mouseenter", function () {
        this.style.transform = "translateY(-4px)";
        this.style.transition = "transform 0.2s ease";
      });

      card.addEventListener("mouseleave", function () {
        this.style.transform = "translateY(0)";
      });
    });

    // Add click effects to do-items
    const doItems = document.querySelectorAll(".do-item");
    doItems.forEach((item) => {
      item.addEventListener("mouseenter", function () {
        const icon = this.querySelector(".do-icon");
        if (icon) {
          icon.style.transform = "scale(1.1)";
          icon.style.transition = "transform 0.2s ease";
        }
      });

      item.addEventListener("mouseleave", function () {
        const icon = this.querySelector(".do-icon");
        if (icon) {
          icon.style.transform = "scale(1)";
        }
      });
    });

    // Add gentle animation to philosophy items
    const philosophyItems = document.querySelectorAll(".philosophy-item");
    philosophyItems.forEach((item, index) => {
      item.style.opacity = "0";
      item.style.transform = "translateY(20px)";

      setTimeout(() => {
        item.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        item.style.opacity = "1";
        item.style.transform = "translateY(0)";
      }, index * 150);
    });

    // Add subtle pulse to status dot
    const statusDot = document.querySelector(".status-dot.online");
    if (statusDot) {
      setInterval(() => {
        statusDot.style.boxShadow = "0 0 0 0 rgba(16, 185, 129, 0.4)";
        statusDot.style.transition = "box-shadow 0.6s";

        setTimeout(() => {
          statusDot.style.boxShadow = "0 0 0 8px rgba(16, 185, 129, 0)";
        }, 100);
      }, 2000);
    }

    // Add click tracking for explore cards (optional analytics)
    exploreCards.forEach((card) => {
      card.addEventListener("click", function () {
        const windowType = this.getAttribute("onclick")?.match(
          /openWindow\('([^']+)'\)/
        )?.[1];
        if (windowType) {
          // Analytics tracking could be added here
        }
      });
    });
  }

  // Show notification helper function
  function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === "success" ? "#10b981" : "#ef4444"};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      transform: translateX(400px);
      transition: transform 0.3s ease;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 10);

    // Animate out and remove
    setTimeout(() => {
      notification.style.transform = "translateX(400px)";
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Export functions for external use if needed
  window.aboutMeModule = {
    showNotification: showNotification,
    version: "2.0.0",
  };
})();
