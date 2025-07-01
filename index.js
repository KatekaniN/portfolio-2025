// Windows 11 Style Window Manager
class Windows11Manager {
  constructor() {
    this.activeWindows = [];
    this.draggedWindow = null;
    this.dragOffset = { x: 0, y: 0 };
    this.zIndexCounter = 1000;
    this.isStartMenuOpen = false;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateClock();
    this.startClockUpdate();
    this.setupWindowSnapping();
    this.addWindows11Animations();
  }

  setupEventListeners() {
    // Desktop icon handlers with Windows 11 interactions
    document.querySelectorAll(".desktop-icon").forEach((icon) => {
      icon.addEventListener("dblclick", (e) => {
        e.preventDefault();
        const windowId = icon.getAttribute("data-window");
        this.openWindow(windowId);
        this.addOpenAnimation(icon);
      });

      icon.addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectIcon(icon);
      });

      // Add hover sound effect (visual feedback)
      icon.addEventListener("mouseenter", () => {
        icon.style.transform = "translateY(-2px) scale(1.02)";
      });

      icon.addEventListener("mouseleave", () => {
        if (!icon.classList.contains("selected")) {
          icon.style.transform = "";
        }
      });
    });

    // Desktop click handler
    document.getElementById("desktop").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        this.deselectAllIcons();
        this.closeStartMenu();
      }
    });

    // Window dragging setup
    this.setupWindowDragging();

    // Keyboard shortcuts (Windows 11 style)
    document.addEventListener("keydown", (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Prevent context menu (we'll add our own later)
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  }

  addOpenAnimation(icon) {
    icon.style.animation = "none";
    icon.offsetHeight; // Trigger reflow
    icon.style.animation = "pulse 0.3s ease-out";
    setTimeout(() => {
      icon.style.animation = "";
    }, 300);
  }

  selectIcon(icon) {
    this.deselectAllIcons();
    icon.classList.add("selected");
    icon.style.transform = "translateY(-2px) scale(1.02)";
  }

  deselectAllIcons() {
    document.querySelectorAll(".desktop-icon").forEach((i) => {
      i.classList.remove("selected");
      i.style.transform = "";
    });
  }

  openWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;

    // Windows 11 opening animation
    window.classList.add("opening");
    setTimeout(() => window.classList.remove("opening"), 400);

    window.classList.add("active");
    window.style.zIndex = ++this.zIndexCounter;

    if (!this.activeWindows.includes(windowId)) {
      this.activeWindows.push(windowId);
    }

    this.updateTaskbar();
    this.centerWindowSmart(window);

    // Add focus ring effect
    this.addFocusEffect(window);
  }

  closeWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;

    // Windows 11 closing animation
    window.style.animation = "windowClose 0.2s ease-in forwards";

    setTimeout(() => {
      window.classList.remove("active");
      window.style.animation = "";
      this.activeWindows = this.activeWindows.filter((id) => id !== windowId);
      this.updateTaskbar();
    }, 200);
  }

  centerWindowSmart(window) {
    const rect = window.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - 56; // Account for taskbar

    // Smart positioning - avoid overlapping too much
    const baseX = Math.max(50, (screenWidth - rect.width) / 2);
    const baseY = Math.max(50, (screenHeight - rect.height) / 2);

    // Offset for multiple windows
    const offset = this.activeWindows.length * 30;

    window.style.left =
      Math.min(baseX + offset, screenWidth - rect.width - 50) + "px";
    window.style.top =
      Math.min(baseY + offset, screenHeight - rect.height - 50) + "px";
  }

  addFocusEffect(window) {
    // Remove focus from other windows
    document.querySelectorAll(".window").forEach((w) => {
      w.classList.remove("focused");
    });

    window.classList.add("focused");

    // Add subtle glow effect
    window.style.boxShadow = `
        0 32px 64px rgba(0, 120, 212, 0.15),
        0 16px 32px rgba(0, 0, 0, 0.15),
        0 0 0 1px rgba(0, 120, 212, 0.2)
    `;

    setTimeout(() => {
      window.style.boxShadow = "";
    }, 1000);
  }

  setupWindowDragging() {
    document.querySelectorAll(".window-header").forEach((header) => {
      header.addEventListener("mousedown", (e) => {
        if (e.target.classList.contains("window-control")) return;

        this.draggedWindow = e.target.closest(".window");
        const rect = this.draggedWindow.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;

        // Bring to front and add dragging state
        this.draggedWindow.style.zIndex = ++this.zIndexCounter;
        this.draggedWindow.classList.add("dragging");

        // Change cursor
        document.body.style.cursor = "grabbing";
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
            window.innerHeight - this.draggedWindow.offsetHeight - 56,
            e.clientY - this.dragOffset.y
          )
        );

        this.draggedWindow.style.left = newX + "px";
        this.draggedWindow.style.top = newY + "px";

        // Show snap zones when near edges
        this.showSnapZones(e.clientX, e.clientY);
      }
    });

    document.addEventListener("mouseup", (e) => {
      if (this.draggedWindow) {
        this.draggedWindow.classList.remove("dragging");
        document.body.style.cursor = "";

        // Handle window snapping
        this.handleWindowSnap(e.clientX, e.clientY);
        this.hideSnapZones();

        this.draggedWindow = null;
      }
    });
  }

  setupWindowSnapping() {
    this.snapZones = document.createElement("div");
    this.snapZones.className = "snap-zones";
    this.snapZones.style.display = "none";
    document.body.appendChild(this.snapZones);
  }

  showSnapZones(mouseX, mouseY) {
    const threshold = 20;
    const showLeft = mouseX < threshold;
    const showRight = mouseX > window.innerWidth - threshold;
    const showTop = mouseY < threshold;

    if (showLeft || showRight || showTop) {
      this.snapZones.style.display = "block";
      this.snapZones.innerHTML = `
            ${showLeft ? '<div class="snap-zone left"></div>' : ""}
            ${showRight ? '<div class="snap-zone right"></div>' : ""}
            ${showTop ? '<div class="snap-zone top"></div>' : ""}
        `;
    } else {
      this.snapZones.style.display = "none";
    }
  }

  hideSnapZones() {
    this.snapZones.style.display = "none";
  }

  handleWindowSnap(mouseX, mouseY) {
    if (!this.draggedWindow) return;

    const threshold = 20;
    const window = this.draggedWindow;

    if (mouseX < threshold) {
      // Snap to left half
      window.style.left = "0px";
      window.style.top = "0px";
      window.style.width = "50vw";
      window.style.height = "calc(100vh - 56px)";
    } else if (mouseX > window.innerWidth - threshold) {
      // Snap to right half
      window.style.left = "50vw";
      window.style.top = "0px";
      window.style.width = "50vw";
      window.style.height = "calc(100vh - 56px)";
    } else if (mouseY < threshold) {
      // Snap to maximize
      window.style.left = "0px";
      window.style.top = "0px";
      window.style.width = "100vw";
      window.style.height = "calc(100vh - 56px)";
    }
  }

  updateTaskbar() {
    const taskbarWindows = document.getElementById("openWindows");
    taskbarWindows.innerHTML = "";

    this.activeWindows.forEach((windowId) => {
      const window = document.getElementById(windowId);
      const title = window.querySelector(".window-title").textContent.trim();

      const taskbarItem = document.createElement("div");
      taskbarItem.className = "taskbar-window";
      taskbarItem.innerHTML = `<i class="fas fa-window-maximize"></i> ${title}`;
      taskbarItem.onclick = () => this.focusWindow(windowId);

      // Add active state for currently focused window
      if (window.style.zIndex == this.zIndexCounter) {
        taskbarItem.classList.add("active");
      }

      taskbarWindows.appendChild(taskbarItem);
    });
  }

  focusWindow(windowId) {
    const window = document.getElementById(windowId);
    window.style.zIndex = ++this.zIndexCounter;
    this.addFocusEffect(window);

    // Update taskbar active state
    this.updateTaskbar();
  }

  handleKeyboardShortcuts(e) {
    // Windows key + D (show desktop)
    if (e.metaKey && e.key === "d") {
      e.preventDefault();
      this.minimizeAllWindows();
    }

    // Alt + Tab (window switching)
    if (e.altKey && e.key === "Tab") {
      e.preventDefault();
      this.switchToNextWindow();
    }

    // Alt + F4 (close window)
    if (e.altKey && e.key === "F4") {
      e.preventDefault();
      if (this.activeWindows.length > 0) {
        const lastWindow = this.activeWindows[this.activeWindows.length - 1];
        this.closeWindow(lastWindow);
      }
    }

    // Windows key (toggle start menu)
    if (e.key === "Meta") {
      e.preventDefault();
      this.toggleStartMenu();
    }
  }

  minimizeAllWindows() {
    document.querySelectorAll(".window.active").forEach((window) => {
      window.style.animation = "windowMinimize 0.3s ease-out forwards";
      setTimeout(() => {
        window.style.animation = "";
        window.style.transform = "scale(0.1)";
        window.style.opacity = "0";
      }, 300);
    });

    // Restore after 2 seconds
    setTimeout(() => {
      document.querySelectorAll(".window.active").forEach((window) => {
        window.style.transform = "";
        window.style.opacity = "";
      });
    }, 2000);
  }

  switchToNextWindow() {
    if (this.activeWindows.length <= 1) return;

    const currentIndex = this.activeWindows.findIndex((id) => {
      const window = document.getElementById(id);
      return window.style.zIndex == this.zIndexCounter;
    });

    const nextIndex = (currentIndex + 1) % this.activeWindows.length;
    const nextWindowId = this.activeWindows[nextIndex];

    this.focusWindow(nextWindowId);
  }

  addWindows11Animations() {
    // Add CSS animations for Windows 11 effects
    const style = document.createElement("style");
    style.textContent = `
        @keyframes windowClose {
            to {
                opacity: 0;
                transform: scale(0.9) translateY(20px);
            }
        }
        
        @keyframes windowMinimize {
            to {
                opacity: 0;
                transform: scale(0.1) translateY(100vh);
            }
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .snap-zones {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 9999;
        }
        
        .snap-zone {
            position: absolute;
            background: rgba(0, 120, 212, 0.3);
            border: 2px solid rgba(0, 120, 212, 0.6);
            border-radius: 8px;
            pointer-events: none;
        }
        
        .snap-zone.left {
            left: 0;
            top: 0;
            width: 50vw;
            height: calc(100vh - 56px);
        }
        
        .snap-zone.right {
            right: 0;
            top: 0;
            width: 50vw;
            height: calc(100vh - 56px);
        }
        
        .snap-zone.top {
            left: 0;
            top: 0;
            width: 100vw;
            height: calc(100vh - 56px);
        }
        
        .window.focused {
            transition: box-shadow 0.3s ease;
        }
        
        .taskbar-window {
            position: relative;
            overflow: hidden;
        }
        
        .taskbar-window::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background: #0078d4;
            transform: scaleX(0);
            transition: transform 0.2s ease;
        }
        
        .taskbar-window.active::before {
            transform: scaleX(1);
        }
        
        .start-menu {
            position: fixed;
            bottom: 64px;
            left: 50%;
            transform: translateX(-50%);
            width: 600px;
            height: 700px;
            background: rgba(32, 32, 32, 0.95);
            backdrop-filter: blur(40px);
            border-radius: 12px;
            box-shadow: 0 32px 64px rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: none;
            z-index: 9998;
        }
        
        .start-menu.active {
            display: block;
            animation: startMenuOpen 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        @keyframes startMenuOpen {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0) scale(1);
            }
        }
    `;
    document.head.appendChild(style);
  }

  toggleStartMenu() {
    this.isStartMenuOpen = !this.isStartMenuOpen;

    if (this.isStartMenuOpen) {
      this.showStartMenu();
    } else {
      this.closeStartMenu();
    }
  }

  showStartMenu() {
    // Create start menu if it doesn't exist
    let startMenu = document.getElementById("startMenu");
    if (!startMenu) {
      startMenu = this.createStartMenu();
    }

    startMenu.classList.add("active");
    this.isStartMenuOpen = true;
  }

  closeStartMenu() {
    const startMenu = document.getElementById("startMenu");
    if (startMenu) {
      startMenu.classList.remove("active");
    }
    this.isStartMenuOpen = false;
  }

  createStartMenu() {
    const startMenu = document.createElement("div");
    startMenu.id = "startMenu";
    startMenu.className = "start-menu";
    startMenu.innerHTML = `
        <div style="padding: 24px; color: white;">
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face&auto=format" 
                     style="width: 40px; height: 40px; border-radius: 50%;" alt="User">
                <div>
                    <div style="font-weight: 600;">Alex Johnson</div>
                    <div style="font-size: 12px; opacity: 0.7;">alex.johnson@email.com</div>
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 16px; font-size: 16px;">Pinned</h3>
                <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px;">
                    ${this.createStartMenuItems()}
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 16px; font-size: 16px;">Recommended</h3>
                <div style="display: grid; gap: 8px;">
                    ${this.createRecommendedItems()}
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
              

                <button onclick="alert('Power options coming soon!')" style="background: none; border: none; color: white; padding: 8px; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-power-off"></i> Power
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(startMenu);

    // Close start menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!startMenu.contains(e.target) && !e.target.closest(".start-button")) {
        this.closeStartMenu();
      }
    });

    return startMenu;
  }

  createStartMenuItems() {
    const items = [
      { icon: "home", label: "About", window: "about" },
      { icon: "terminal", label: "Projects", window: "projects" },
      { icon: "settings", label: "Skills", window: "skills" },
      { icon: "email", label: "Contact", window: "contact" },
      { icon: "name-tag/icons8-name-tag-96", label: "Personal", window: "personal" },
      { icon: "folder", label: "Resume", window: "resume" },
    ];

    return items
      .map(
        (item) => `
        <div onclick="windowManager.openWindow('${item.window}'); windowManager.closeStartMenu();" 
             style="display: flex; flex-direction: column; align-items: center; padding: 12px; border-radius: 8px; cursor: pointer; transition: background 0.2s;"
             onmouseover="this.style.background='rgba(255,255,255,0.1)'"
             onmouseout="this.style.background='transparent'">
            <div style="width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                <img src="./icons/${item.icon}.png" alt="${item.label} icon" style="width: 1.2em; height: 1.2em; ">
            </div>
            <span style="font-size: 12px; text-align: center;">${item.label}</span>
        </div>
    `
      )
      .join("");
  }

  createRecommendedItems() {
    const items = [
      "Recently opened: EcoShop Platform project",
      "Recently modified: Resume.pdf",
      "Recently viewed: Coffee brewing notes",
      "Recently added: Yosemite photography collection",
    ];

    return items
      .map(
        (item) => `
        <div style="display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: background 0.2s;"
             onmouseover="this.style.background='rgba(255,255,255,0.1)'"
             onmouseout="this.style.background='transparent'">
            <i class="fas fa-file" style="font-size: 16px; opacity: 0.7;"></i>
            <span style="font-size: 14px;">${item}</span>
        </div>
    `
      )
      .join("");
  }

  updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const dateString = now.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    document.getElementById("clock").innerHTML = `
        <div style="font-size: 14px; font-weight: 600;">${timeString}</div>
        <div style="font-size: 12px; opacity: 0.8;">${dateString}</div>
    `;
  }

  startClockUpdate() {
    setInterval(() => this.updateClock(), 1000);
  }
}

// Enhanced Personal Features for Windows 11
class Windows11PersonalFeatures {
  constructor() {
    this.init();
  }

  init() {
    this.addPersonalTouches();
    this.setupInteractiveElements();
    this.addNotificationSystem();
  }

  addPersonalTouches() {
    // Dynamic greeting based on time
    this.updateGreeting();

    // Add typing effect to tagline
    setTimeout(() => this.addTypingEffect(), 2000);

    // Add random tech facts to console
    this.addTechFacts();

    // Add weather widget (mock)
    this.addWeatherWidget();
  }

  updateGreeting() {
    const hour = new Date().getHours();
    let greeting = "Hello!";
    let emoji = "👋";

    if (hour < 6) {
      greeting = "Working late?";
      emoji = "🌙";
    } else if (hour < 12) {
      greeting = "Good morning!";
      emoji = "🌅";
    } else if (hour < 18) {
      greeting = "Good afternoon!";
      emoji = "☀️";
    } else if (hour < 22) {
      greeting = "Good evening!";
      emoji = "🌆";
    } else {
      greeting = "Burning the midnight oil?";
      emoji = "🌙";
    }

    setTimeout(() => {
      const aboutTitle = document.querySelector("#about h2");
      if (aboutTitle) {
        aboutTitle.innerHTML = `${greeting} I'm Alex Johnson ${emoji}`;
      }
    }, 1000);
  }

  addTypingEffect() {
    const tagline = document.querySelector(".tagline");
    if (!tagline) return;

    const text = tagline.textContent;
    tagline.textContent = "";
    tagline.style.borderRight = "2px solid #0078d4";

    let i = 0;
    const typeWriter = () => {
      if (i < text.length) {
        tagline.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 50);
      } else {
        // Remove cursor after typing
        setTimeout(() => {
          tagline.style.borderRight = "none";
        }, 1000);
      }
    };

    typeWriter();
  }

  addTechFacts() {
    const facts = [
      "💡 Fun fact: The first computer bug was literally a bug - a moth found in a relay!",
      "🚀 Did you know: JavaScript was created in just 10 days by Brendan Eich!",
      "⚡ Cool: The term 'debugging' was coined by Grace Hopper in 1947!",
      "🎯 Amazing: There are over 700 programming languages in existence!",
      "🌟 Interesting: The first website ever created is still online: info.cern.ch",
      "🔥 Mind-blowing: Google processes over 8.5 billion searches per day!",
      "💻 Wild: The average person checks their phone 96 times per day!",
    ];

    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    console.log(
      `%c${randomFact}`,
      "color: #0078d4; font-size: 14px; font-weight: bold;"
    );
  }

  addWeatherWidget() {
    // Mock weather widget in taskbar
    const weather = document.createElement("div");
    weather.style.cssText = `
        position: absolute;
        right: 200px;
        top: 50%;
        transform: translateY(-50%);
        color: white;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    weather.innerHTML = `
        <i class="fas fa-sun" style="color: #ffd700;"></i>
        <span>72°F</span>
    `;
    document.querySelector(".taskbar").appendChild(weather);
  }

  setupInteractiveElements() {
    // Enhanced hover effects for project cards
    document.querySelectorAll(".project-card").forEach((card) => {
      card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-8px) scale(1.02)";
        card.style.boxShadow = "0 16px 48px rgba(0, 0, 0, 0.15)";
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
        card.style.boxShadow = "";
      });
    });

    // Add ripple effect to buttons
    document
      .querySelectorAll(".project-link, .personal-link, .download-resume")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          this.createRipple(e);
        });
      });
  }

  createRipple(event) {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    `;

    button.style.position = "relative";
    button.style.overflow = "hidden";
    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  }

  addNotificationSystem() {
    // Add CSS for notifications
    const style = document.createElement("style");
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(32, 32, 32, 0.95);
            backdrop-filter: blur(40px);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 10000;
            min-width: 300px;
            animation: slideInNotification 0.3s ease-out;
        }
        
        @keyframes slideInNotification {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        .notification-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
        }
        
        .notification-icon {
            width: 32px;
            height: 32px;
            background: #0078d4;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .notification-title {
            font-weight: 600;
            font-size: 14px;
        }
        
        .notification-body {
            font-size: 13px;
            opacity: 0.9;
            line-height: 1.4;
        }
    `;
    document.head.appendChild(style);
  }

  showNotification(title, body, icon = "fas fa-info-circle") {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.innerHTML = `
        <div class="notification-header">
            <div class="notification-icon">
                <i class="${icon}" style="color: white; font-size: 16px;"></i>
            </div>
            <div class="notification-title">${title}</div>
        </div>
        <div class="notification-body">${body}</div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 4 seconds
    setTimeout(() => {
      notification.style.animation =
        "slideInNotification 0.3s ease-out reverse";
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
}

// Enhanced Easter Eggs for Windows 11
class Windows11EasterEggs {
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
    this.secretClickCount = 0;
    this.init();
  }

  init() {
    this.setupKonamiCode();
    this.setupSecretClicks();
    this.setupHiddenFeatures();
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
    // Windows 11 style rainbow effect
    document.body.style.filter = "hue-rotate(0deg)";
    let hue = 0;

    const rainbow = setInterval(() => {
      hue = (hue + 5) % 360;
      document.body.style.filter = `hue-rotate(${hue}deg) saturate(1.2)`;
    }, 50);

    // Show special notification
    personalFeatures.showNotification(
      "Konami Code Activated! 🌈",
      "You've unlocked the Windows 11 rainbow mode! Enjoy the colorful experience.",
      "fas fa-rainbow"
    );

    setTimeout(() => {
      clearInterval(rainbow);
      document.body.style.filter = "";
    }, 8000);
  }

  setupSecretClicks() {
    const startButton = document.querySelector(".start-button");

    startButton.addEventListener("click", () => {
      this.secretClickCount++;
      if (this.secretClickCount === 11) {
        // Windows 11 theme
        this.showSecretMessage();
        this.secretClickCount = 0;
      }
    });
  }

  showSecretMessage() {
    const messages = [
      "You found the Windows 11 secret! 🪟",
      "Persistence level: Windows 11! 💪",
      "You've mastered the art of clicking! 🖱️",
      "Secret developer mode activated! 👨‍💻",
      "You're now part of the Windows 11 insider club! 🎉",
    ];

    const message = messages[Math.floor(Math.random() * messages.length)];

    personalFeatures.showNotification(
      "Secret Unlocked!",
      message,
      "fab fa-windows"
    );

    // Add special effect to desktop
    document.querySelector(".desktop").style.animation = "pulse 2s ease-in-out";
    setTimeout(() => {
      document.querySelector(".desktop").style.animation = "";
    }, 2000);
  }

  setupHiddenFeatures() {
    // Triple-click on desktop for hidden menu
    let clickCount = 0;
    let clickTimer = null;

    document.querySelector(".desktop").addEventListener("click", () => {
      clickCount++;

      if (clickTimer) clearTimeout(clickTimer);

      clickTimer = setTimeout(() => {
        if (clickCount === 3) {
          this.showHiddenMenu();
        }
        clickCount = 0;
      }, 500);
    });
  }

  showHiddenMenu() {
    personalFeatures.showNotification(
      "Developer Menu",
      "Hidden features: Press Ctrl+Shift+D for debug mode, or Ctrl+Shift+T for theme switcher!",
      "fas fa-code"
    );
  }
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.windowManager = new Windows11Manager();
  window.personalFeatures = new Windows11PersonalFeatures();
  window.easterEggs = new Windows11EasterEggs();

  // Make functions globally accessible
  window.closeWindow = (windowId) => windowManager.closeWindow(windowId);
  window.showStartMenu = () => windowManager.toggleStartMenu();

  // Welcome notification
  setTimeout(() => {
    personalFeatures.showNotification(
      "Welcome to Windows 11 Portfolio! 👋",
      "Double-click icons to open windows, drag to move them, and try the start menu!",
      "fab fa-windows"
    );
  }, 1000);

  console.log("🎉 Windows 11 Desktop Portfolio loaded successfully!");
  console.log("💡 Try the Konami Code for a colorful surprise!");
  console.log("🎯 Click the Start button 11 times for another easter egg!");
  console.log("🔍 Triple-click the desktop for developer options!");
});
