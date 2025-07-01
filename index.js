// Window Management System
class WindowManager {
  constructor() {
    this.activeWindows = [];
    this.draggedWindow = null;
    this.dragOffset = { x: 0, y: 0 };
    this.zIndexCounter = 1000;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateClock();
    this.startClockUpdate();
  }

  setupEventListeners() {
    // Desktop icon handlers
    document.querySelectorAll(".desktop-icon").forEach((icon) => {
      icon.addEventListener("dblclick", (e) => {
        e.preventDefault();
        const windowId = icon.getAttribute("data-window");
        this.openWindow(windowId);
      });

      icon.addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectIcon(icon);
      });
    });

    // Desktop click handler
    document.getElementById("desktop").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        this.deselectAllIcons();
      }
    });

    // Window dragging setup
    this.setupWindowDragging();

    // Prevent context menu
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      this.handleKeyboardShortcuts(e);
    });
  }

  selectIcon(icon) {
    this.deselectAllIcons();
    icon.classList.add("selected");
  }

  deselectAllIcons() {
    document
      .querySelectorAll(".desktop-icon")
      .forEach((i) => i.classList.remove("selected"));
  }

  openWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;

    // Add opening animation
    window.classList.add("opening");
    setTimeout(() => window.classList.remove("opening"), 300);

    window.classList.add("active");
    window.style.zIndex = ++this.zIndexCounter;

    if (!this.activeWindows.includes(windowId)) {
      this.activeWindows.push(windowId);
    }

    this.updateTaskbar();
    this.centerWindow(window);
  }

  closeWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;

    window.classList.remove("active");
    this.activeWindows = this.activeWindows.filter((id) => id !== windowId);
    this.updateTaskbar();
  }

  centerWindow(window) {
    const rect = window.getBoundingClientRect();
    const centerX = (window.innerWidth - rect.width) / 2;
    const centerY = (window.innerHeight - rect.height) / 2;

    window.style.left = Math.max(0, centerX) + "px";
    window.style.top = Math.max(0, centerY) + "px";
  }

  setupWindowDragging() {
    document.querySelectorAll(".window-header").forEach((header) => {
      header.addEventListener("mousedown", (e) => {
        if (e.target.classList.contains("window-control")) return;

        this.draggedWindow = e.target.closest(".window");
        const rect = this.draggedWindow.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;

        // Bring to front
        this.draggedWindow.style.zIndex = ++this.zIndexCounter;

        // Add dragging class for visual feedback
        this.draggedWindow.classList.add("dragging");
      });
    });

    document.addEventListener("mousemove", (e) => {
      if (this.draggedWindow) {
        const newX = Math.max(
          0,
          Math.min(
            window.innerWidth - this.draggedWindow.offsetWidth,
            e.clientX - this.dragOffset.x
          )
        );
        const newY = Math.max(
          0,
          Math.min(
            window.innerHeight - this.draggedWindow.offsetHeight - 48, // Account for taskbar
            e.clientY - this.dragOffset.y
          )
        );

        this.draggedWindow.style.left = newX + "px";
        this.draggedWindow.style.top = newY + "px";
      }
    });

    document.addEventListener("mouseup", () => {
      if (this.draggedWindow) {
        this.draggedWindow.classList.remove("dragging");
        this.draggedWindow = null;
      }
    });
  }

  updateTaskbar() {
    const taskbarWindows = document.getElementById("openWindows");
    taskbarWindows.innerHTML = "";

    this.activeWindows.forEach((windowId) => {
      const window = document.getElementById(windowId);
      const title = window.querySelector(".window-title").textContent;

      const taskbarItem = document.createElement("div");
      taskbarItem.className = "taskbar-window";
      taskbarItem.textContent = title;
      taskbarItem.onclick = () => this.focusWindow(windowId);

      taskbarWindows.appendChild(taskbarItem);
    });
  }

  focusWindow(windowId) {
    const window = document.getElementById(windowId);
    window.style.zIndex = ++this.zIndexCounter;

    // Update taskbar active state
    document.querySelectorAll(".taskbar-window").forEach((item) => {
      item.classList.remove("active");
    });
    event.target.classList.add("active");
  }

  handleKeyboardShortcuts(e) {
    // Alt + Tab for window switching
    if (e.altKey && e.key === "Tab") {
      e.preventDefault();
      this.switchToNextWindow();
    }

    // Escape to close focused window
    if (e.key === "Escape" && this.activeWindows.length > 0) {
      const lastWindow = this.activeWindows[this.activeWindows.length - 1];
      this.closeWindow(lastWindow);
    }
  }

  switchToNextWindow() {
    if (this.activeWindows.length <= 1) return;

    const currentIndex = this.activeWindows.length - 1;
    const nextIndex = (currentIndex + 1) % this.activeWindows.length;
    const nextWindowId = this.activeWindows[nextIndex];

    this.focusWindow(nextWindowId);
  }

  updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    const dateString = now.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    document.getElementById("clock").innerHTML = `
        <div style="font-size: 12px; opacity: 0.8;">${dateString}</div>
        <div>${timeString}</div>
    `;
  }

  startClockUpdate() {
    setInterval(() => this.updateClock(), 1000);
  }
}

// Personal touches and interactive elements
class PersonalFeatures {
  constructor() {
    this.init();
  }

  init() {
    this.addPersonalTouches();
    this.setupInteractiveElements();
  }

  addPersonalTouches() {
    // Add dynamic greeting based on time
    this.updateGreeting();

    // Add typing effect to tagline
    this.addTypingEffect();

    // Add random tech facts
    this.addTechFacts();
  }

  updateGreeting() {
    const hour = new Date().getHours();
    let greeting = "Hello!";

    if (hour < 12) greeting = "Good morning!";
    else if (hour < 18) greeting = "Good afternoon!";
    else greeting = "Good evening!";

    // Update greeting in about section
    setTimeout(() => {
      const aboutTitle = document.querySelector("#about h2");
      if (aboutTitle) {
        aboutTitle.textContent = `${greeting} I'm Alex Johnson`;
      }
    }, 1000);
  }

  addTypingEffect() {
    const tagline = document.querySelector(".tagline");
    if (!tagline) return;

    const text = tagline.textContent;
    tagline.textContent = "";

    let i = 0;
    const typeWriter = () => {
      if (i < text.length) {
        tagline.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 100);
      }
    };

    setTimeout(typeWriter, 2000);
  }

  addTechFacts() {
    const facts = [
      "💡 Did you know? The first computer bug was an actual bug found in 1947!",
      "🚀 Fun fact: The average person checks their phone 96 times per day!",
      "⚡ Cool: JavaScript was created in just 10 days!",
      "🎯 Interesting: There are over 700 programming languages!",
      "🌟 Amazing: The first website is still online: info.cern.ch",
    ];

    // Randomly show a fact in console
    console.log(facts[Math.floor(Math.random() * facts.length)]);
  }

  setupInteractiveElements() {
    // Add hover effects for project cards
    document.querySelectorAll(".project-card").forEach((card) => {
      card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-8px) scale(1.02)";
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "translateY(0) scale(1)";
      });
    });

    // Add click effects for personal items
    document.querySelectorAll(".personal-item").forEach((item) => {
      item.addEventListener("click", () => {
        item.style.animation = "pulse 0.5s ease";
        setTimeout(() => {
          item.style.animation = "";
        }, 500);
      });
    });
  }
}

// Easter eggs and fun interactions
class EasterEggs {
  constructor() {
    this.konamiCode = [];
    this.konamiSequence = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "KeyB",
      "KeyA",
    ];
    this.init();
  }

  init() {
    this.setupKonamiCode();
    this.setupSecretClicks();
  }

  setupKonamiCode() {
    document.addEventListener("keydown", (e) => {
      this.konamiCode.push(e.code);

      if (this.konamiCode.length > this.konamiSequence.length) {
        this.konamiCode.shift();
      }

      if (this.konamiCode.join(",") === this.konamiSequence.join(",")) {
        this.triggerKonamiEasterEgg();
      }
    });
  }

  triggerKonamiEasterEgg() {
    // Add rainbow effect to desktop
    document.body.style.filter = "hue-rotate(0deg)";
    let hue = 0;

    const rainbow = setInterval(() => {
      hue = (hue + 10) % 360;
      document.body.style.filter = `hue-rotate(${hue}deg)`;
    }, 100);

    setTimeout(() => {
      clearInterval(rainbow);
      document.body.style.filter = "";
    }, 5000);

    console.log("🎉 Konami Code activated! You found the rainbow mode!");
  }

  setupSecretClicks() {
    let clickCount = 0;
    const logo = document.querySelector(".start-button");

    logo.addEventListener("click", () => {
      clickCount++;
      if (clickCount === 10) {
        this.showSecretMessage();
        clickCount = 0;
      }
    });
  }

  showSecretMessage() {
    const messages = [
      "🕵️ You're quite the detective!",
      "🎮 Gaming skills detected!",
      "👨‍💻 Fellow developer spotted!",
      "🎯 Persistence level: Expert!",
      "🌟 You've unlocked the secret club!",
    ];

    const message = messages[Math.floor(Math.random() * messages.length)];

    // Create temporary notification
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        z-index: 9999;
        animation: slideIn 0.5s ease;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const windowManager = new WindowManager();
  const personalFeatures = new PersonalFeatures();
  const easterEggs = new EasterEggs();

  // Make closeWindow globally accessible
  window.closeWindow = (windowId) => windowManager.closeWindow(windowId);
  window.showStartMenu = () => {
    console.log(
      "🚀 Start menu coming soon! This could open a custom menu with shortcuts, recent files, or system info."
    );
  };

  console.log("🎉 Desktop Portfolio loaded successfully!");
  console.log("💡 Try the Konami Code for a surprise!");
  console.log("🎯 Click the Start button 10 times for another easter egg!");
});
