// Suppress browser extension errors that don't affect the portfolio functionality
window.addEventListener("error", (e) => {
  if (e.filename && e.filename.includes("contentscript.bundle.js")) {
    e.preventDefault();
    return false;
  }
});

window.addEventListener("unhandledrejection", (e) => {
  if (
    e.reason &&
    e.reason.message &&
    e.reason.message.includes("message port closed")
  ) {
    e.preventDefault();
    return false;
  }
});

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

  showPowerOptions() {
    // Close any existing power menu first
    const existingMenu = document.getElementById("powerMenu");
    if (existingMenu) {
      existingMenu.remove();
    }

    // Create power options menu
    const powerMenu = document.createElement("div");
    powerMenu.id = "powerMenu";
    powerMenu.className = "power-menu";
    powerMenu.style.cssText = `
    position: fixed;
    bottom: 70px;
    left: 50%;
    transform: translateX(-50%);
    width: 300px;
    background: rgba(32, 32, 32, 0.95);
    backdrop-filter: blur(40px);
    color: white;
    border-radius: 12px;
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 10002;
    animation: powerMenuSlide 0.3s ease-out;
    overflow: hidden;
`;

    powerMenu.innerHTML = `
    <div style="padding: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div style="display: flex; align-items: center; gap: 12px;">
                <i class="fas fa-power-off" style="color: #0078d4; font-size: 20px;"></i>
                <h3 style="margin: 0; font-size: 16px;">Power Options</h3>
            </div>
            <button onclick="windowManager.closePowerMenu()" 
                    style="background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; font-size: 18px; padding: 4px; border-radius: 4px; transition: color 0.2s;"
                    onmouseover="this.style.color='white'"
                    onmouseout="this.style.color='rgba(255,255,255,0.6)'">×</button>
        </div>
        
        <div class="power-options-grid">
            ${this.createPowerOption(
              "sleep",
              "fas fa-moon",
              "Sleep Mode",
              "Dim the lights and save your session",
              "#4a90e2"
            )}
            ${this.createPowerOption(
              "restart",
              "fas fa-redo-alt",
              "Restart",
              "Refresh the experience with new animations",
              "#FFB908"
            )}
            ${this.createPowerOption(
              "shutdown",
              "fas fa-power-off",
              "Shut Down",
              "Clean shutdown with farewell message",
              ""
            )}
            ${this.createPowerOption(
              "hibernate",
              "fas fa-pause-circle",
              "Hibernate",
              "Freeze current state and minimize all",
              "#938EDF"
            )}
            ${this.createPowerOption(
              "maintenance",
              "fas fa-tools",
              "Maintenance",
              "Clear cache and optimize performance",
              "#95a5a6"
            )}
        </div>
        
        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; opacity: 0.7; text-align: center;">
            <i class="fas fa-info-circle"></i> Portfolio will remember your session
        </div>
    </div>
`;

    document.body.appendChild(powerMenu);

    // Prevent immediate closing by stopping event propagation
    powerMenu.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Set up click-outside-to-close with a delay
    setTimeout(() => {
      const closeHandler = (e) => {
        if (
          !powerMenu.contains(e.target) &&
          !e.target.closest(".start-button")
        ) {
          this.closePowerMenu();
          document.removeEventListener("click", closeHandler);
        }
      };
      document.addEventListener("click", closeHandler);
    }, 100);

    // Also close with Escape key
    const escapeHandler = (e) => {
      if (e.key === "Escape") {
        this.closePowerMenu();
        document.removeEventListener("keydown", escapeHandler);
      }
    };
    document.addEventListener("keydown", escapeHandler);
  }

  // Update the createPowerOption method to prevent event bubbling
  createPowerOption(action, icon, title, description, color) {
    return `
    <div class="power-option" data-action="${action}" 
         style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; margin-bottom: 8px;"
         onmouseover="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='translateX(4px)'"
         onmouseout="this.style.background='transparent'; this.style.transform='translateX(0px)'"
         onclick="event.stopPropagation(); windowManager.executePowerAction('${action}');">
        <div style="width: 40px; height: 40px; background: ${color}; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
            <i class="${icon}" style="color: white; font-size: 18px;"></i>
        </div>
        <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 2px;">${title}</div>
            <div style="font-size: 12px; opacity: 0.8; line-height: 1.3;">${description}</div>
        </div>
        <div style="opacity: 0.4; transition: opacity 0.2s;">
            <i class="fas fa-chevron-right"></i>
        </div>
    </div>
`;
  }

  // Update the closePowerMenu method
  closePowerMenu() {
    const powerMenu = document.getElementById("powerMenu");
    if (powerMenu) {
      powerMenu.style.animation = "powerMenuSlide 0.2s ease-out reverse";
      setTimeout(() => {
        if (powerMenu.parentElement) {
          powerMenu.remove();
        }
      }, 200);
    }
  }

  // Update executePowerAction to ensure menu closes properly
  executePowerAction(action) {
    // Close menu immediately
    const powerMenu = document.getElementById("powerMenu");
    if (powerMenu) {
      powerMenu.remove();
    }

    // Small delay before executing action to ensure menu is gone
    setTimeout(() => {
      switch (action) {
        case "sleep":
          this.sleepMode();
          break;
        case "restart":
          this.restartSystem();
          break;
        case "shutdown":
          this.shutdownSystem();
          break;
        case "hibernate":
          this.hibernateSystem();
          break;
        case "demo":
          this.demoMode();
          break;
        case "maintenance":
          this.maintenanceMode();
          break;
      }
    }, 100);
  }

  // Add this method to toggle power menu (for the start menu button)
  togglePowerMenu() {
    const existingMenu = document.getElementById("powerMenu");
    if (existingMenu) {
      this.closePowerMenu();
    } else {
      this.showPowerOptions();
    }
  }

  // Create individual power option
  createPowerOption(action, icon, title, description, color) {
    return `
    <div class="power-option" data-action="${action}" 
         style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; margin-bottom: 8px;"
         onmouseover="this.style.background='rgba(255,255,255,0.05)'"
         onmouseout="this.style.background='transparent'"
         onclick="windowManager.executePowerAction('${action}');">
        <div style="width: 40px; height: 40px; background: ${color}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <i class="${icon}" style="color: white; font-size: 18px;"></i>
        </div>
        <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 2px;">${title}</div>
            <div style="font-size: 12px; opacity: 0.8; line-height: 1.3;">${description}</div>
        </div>
    </div>
`;
  }

  // Execute power actions
  executePowerAction(action) {
    this.closePowerMenu();

    switch (action) {
      case "sleep":
        this.sleepMode();
        break;
      case "restart":
        this.restartSystem();
        break;
      case "shutdown":
        this.shutdownSystem();
        break;
      case "hibernate":
        this.hibernateSystem();
        break;
      case "demo":
        this.demoMode();
        break;
      case "maintenance":
        this.maintenanceMode();
        break;
    }
  }

  // Sleep Mode - Dim everything and show screensaver
  sleepMode() {
    personalFeatures.showNotification(
      "Entering Sleep Mode 🌙",
      "Portfolio is going to sleep. Click anywhere to wake up.",
      "fas fa-moon"
    );

    // Dim the entire screen
    const sleepOverlay = document.createElement("div");
    sleepOverlay.id = "sleepOverlay";
    sleepOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    z-index: 15000;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    animation: fadeIn 2s ease;
`;

    sleepOverlay.innerHTML = `
    <div style="text-align: center; color: white;">
        <div style="font-size: 48px; margin-bottom: 16px; animation: pulse 2s infinite;">🌙</div>
        <div style="font-size: 24px; margin-bottom: 8px;">Sleep Mode</div>
        <div style="font-size: 14px; opacity: 0.7;">Click anywhere to wake up</div>
        <div id="sleepTime" style="font-size: 32px; margin-top: 20px; font-family: monospace;"></div>
    </div>
`;

    document.body.appendChild(sleepOverlay);

    // Show current time
    const updateSleepTime = () => {
      const timeElement = document.getElementById("sleepTime");
      if (timeElement) {
        timeElement.textContent = new Date().toLocaleTimeString();
      }
    };

    const sleepInterval = setInterval(updateSleepTime, 1000);
    updateSleepTime();

    // Wake up on click
    sleepOverlay.addEventListener("click", () => {
      clearInterval(sleepInterval);
      sleepOverlay.remove();
      personalFeatures.showNotification(
        "Good morning! ☀️",
        "Portfolio is now awake and ready.",
        "fas fa-sun"
      );
    });
  }

  // Restart - Reload with animation
  restartSystem() {
    personalFeatures.showNotification(
      "Restarting... 🔄",
      "Portfolio will restart with fresh animations.",
      "fas fa-redo-alt"
    );

    // Create restart animation
    const restartOverlay = document.createElement("div");
    restartOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #0078d4;
    z-index: 20000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 1s ease;
`;

    restartOverlay.innerHTML = `
    <div style="text-align: center; color: white;">
        <div style="width: 60px; height: 60px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <div style="font-size: 24px; margin-bottom: 8px;">Restarting</div>
        <div style="font-size: 14px; opacity: 0.8;">Please wait...</div>
    </div>
`;

    document.body.appendChild(restartOverlay);

    setTimeout(() => {
      location.reload();
    }, 3000);
  }

  // Shutdown - Farewell message and blank screen
  shutdownSystem() {
    personalFeatures.showNotification(
      "Shutting Down... 👋",
      "Thanks for visiting! See you next time.",
      "fas fa-power-off"
    );

    const shutdownOverlay = document.createElement("div");
    shutdownOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: black;
    z-index: 20000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 2s ease;
`;

    shutdownOverlay.innerHTML = `
    <div style="text-align: center; color: white; animation: fadeInUp 1s ease 2s both;">
        <div style="font-size: 48px; margin-bottom: 20px;">👋</div>
        <div style="font-size: 32px; margin-bottom: 16px;">Thanks for visiting!</div>
        <div style="font-size: 18px; opacity: 0.7; margin-bottom: 30px;">Hope you enjoyed exploring my portfolio</div>
        <button onclick="location.reload()" 
                style="background: #0078d4; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">
            Power On Again
        </button>
    </div>
`;

    document.body.appendChild(shutdownOverlay);
  }

  // Hibernate - Minimize all windows and show desktop
  hibernateSystem() {
    personalFeatures.showNotification(
      "Hibernating... ⏸️",
      "All windows minimized. State saved for later.",
      "fas fa-pause-circle"
    );

    // Store current window states
    const windowStates = this.activeWindows.map((windowId) => {
      const window = document.getElementById(windowId);
      return {
        id: windowId,
        left: window.style.left,
        top: window.style.top,
        width: window.style.width,
        height: window.style.height,
        zIndex: window.style.zIndex,
      };
    });

    localStorage.setItem("hibernatedWindows", JSON.stringify(windowStates));

    // Minimize all windows with animation
    document.querySelectorAll(".window.active").forEach((window, index) => {
      setTimeout(() => {
        window.style.animation = "windowMinimize 0.5s ease-out forwards";
        setTimeout(() => {
          window.classList.remove("active");
          window.style.animation = "";
        }, 500);
      }, index * 100);
    });

    this.activeWindows = [];
    this.updateTaskbar();

    // Add restore button to desktop
    setTimeout(() => {
      const restoreButton = document.createElement("button");
      restoreButton.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 120, 212, 0.9);
        color: white;
        border: none;
        padding: 16px 32px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        animation: pulse 2s infinite;
    `;
      restoreButton.innerHTML = '<i class="fas fa-play"></i> Restore Session';
      restoreButton.onclick = () =>
        this.restoreHibernatedSession(restoreButton);

      document.body.appendChild(restoreButton);
    }, 1000);
  }

  // Demo Mode - Auto showcase features
  demoMode() {
    personalFeatures.showNotification(
      "Demo Mode Activated! 🎬",
      "Sit back and watch the automated showcase.",
      "fas fa-play-circle"
    );

    const demoSequence = [
      () => this.openWindow("about"),
      () => this.openWindow("projects"),
      () => this.openWindow("skills"),
      () => this.openWindow("contact"),
      () => this.openWindow("personal"),
      () => this.openWindow("resume"),
      () => this.showStartMenu(),
      () => this.closeStartMenu(),
      () => {
        // Close all windows
        [...this.activeWindows].forEach((windowId) => {
          this.closeWindow(windowId);
        });
      },
    ];

    demoSequence.forEach((action, index) => {
      setTimeout(action, (index + 1) * 2000);
    });

    // End demo
    setTimeout(() => {
      personalFeatures.showNotification(
        "Demo Complete! ✨",
        "Feel free to explore on your own now.",
        "fas fa-check-circle"
      );
    }, demoSequence.length * 2000 + 2000);
  }

  // Maintenance Mode - Clear cache and optimize
  maintenanceMode() {
    personalFeatures.showNotification(
      "Maintenance Mode 🔧",
      "Optimizing performance and clearing cache...",
      "fas fa-tools"
    );

    // Clear localStorage
    const keysToKeep = ["hibernatedWindows"];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach((key) => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    // Close all windows
    [...this.activeWindows].forEach((windowId) => {
      this.closeWindow(windowId);
    });

    // Reset icon positions
    document.querySelectorAll(".desktop-icon").forEach((icon) => {
      icon.style.transform = "";
      icon.classList.remove("selected");
    });

    // Show maintenance progress
    const progressOverlay = document.createElement("div");
    progressOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    z-index: 15000;
    display: flex;
    align-items: center;
    justify-content: center;
`;

    progressOverlay.innerHTML = `
    <div style="text-align: center; color: white;">
        <div style="font-size: 48px; margin-bottom: 20px;">🔧</div>
        <div style="font-size: 24px; margin-bottom: 20px;">Maintenance in Progress</div>
        <div style="width: 300px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; overflow: hidden;">
            <div id="maintenanceProgress" style="width: 0%; height: 100%; background: #0078d4; border-radius: 2px; transition: width 0.3s ease;"></div>
        </div>
        <div id="maintenanceStatus" style="margin-top: 12px; font-size: 14px; opacity: 0.8;">Starting maintenance...</div>
    </div>
`;

    document.body.appendChild(progressOverlay);

    const steps = [
      "Clearing temporary files...",
      "Optimizing animations...",
      "Refreshing components...",
      "Updating cache...",
      "Finalizing...",
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        document.getElementById("maintenanceStatus").textContent = step;
        document.getElementById("maintenanceProgress").style.width = `${
          ((index + 1) / steps.length) * 100
        }%`;
      }, (index + 1) * 800);
    });

    setTimeout(() => {
      progressOverlay.remove();
      personalFeatures.showNotification(
        "Maintenance Complete! ✅",
        "Portfolio optimized and ready for peak performance.",
        "fas fa-check-circle"
      );
    }, steps.length * 800 + 1000);
  }

  // Close power menu
  closePowerMenu() {
    const powerMenu = document.getElementById("powerMenu");
    if (powerMenu) {
      powerMenu.style.animation = "powerMenuSlide 0.3s ease-out reverse";
      setTimeout(() => powerMenu.remove(), 300);
    }
  }

  // Restore hibernated session
  restoreHibernatedSession(button) {
    const hibernatedWindows = JSON.parse(
      localStorage.getItem("hibernatedWindows") || "[]"
    );

    button.remove();

    hibernatedWindows.forEach((windowState, index) => {
      setTimeout(() => {
        this.openWindow(windowState.id);
        const window = document.getElementById(windowState.id);
        if (window) {
          window.style.left = windowState.left;
          window.style.top = windowState.top;
          window.style.width = windowState.width;
          window.style.height = windowState.height;
          window.style.zIndex = windowState.zIndex;
        }
      }, index * 200);
    });

    personalFeatures.showNotification(
      "Session Restored! 🎉",
      "All your windows are back where you left them.",
      "fas fa-window-restore"
    );

    localStorage.removeItem("hibernatedWindows");
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

    // Ensure window is in clean state before opening
    this.resetWindowState(window);

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

  resetWindowState(window) {
    window.classList.remove("maximized", "focused");

    // Clear minimized state
    delete window.dataset.isMinimized;
    delete window.dataset.wasActive;

    // Reset to original dimensions and position
    if (window.dataset.originalWidth) {
      window.style.width = window.dataset.originalWidth;
      window.style.height = window.dataset.originalHeight;
      window.style.left = window.dataset.originalLeft;
      window.style.top = window.dataset.originalTop;
    }

    // Clear stored original dimensions
    delete window.dataset.originalWidth;
    delete window.dataset.originalHeight;
    delete window.dataset.originalLeft;
    delete window.dataset.originalTop;

    // Reset visual properties
    window.style.transform = "";
    window.style.opacity = "";
    window.style.pointerEvents = "";
    window.style.display = "";
    window.style.borderRadius = "0px";
    window.style.boxShadow = "";

    // Reset maximize button
    const maximizeBtn = window.querySelector(".window-control.maximize");
    if (maximizeBtn) {
      maximizeBtn.innerHTML = "🗖"; // Default maximize symbol
      maximizeBtn.title = "Maximize";
    }
  }

  closeWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;

    // Windows 11 closing animation
    window.style.animation = "windowClose 0.2s ease-in forwards";

    setTimeout(() => {
      window.classList.remove("active");
      window.style.animation = "";

      // RESET WINDOW STATE - Add these lines
      this.resetWindowState(window);

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
      const isMinimized = window.dataset.isMinimized === "true";

      const taskbarItem = document.createElement("div");
      taskbarItem.className = `taskbar-window ${
        isMinimized ? "minimized" : ""
      }`;
      taskbarItem.innerHTML = `<i class="fas fa-window-maximize"></i> ${title}`;

      // Handle taskbar click - restore if minimized, focus if not
      taskbarItem.onclick = () => {
        if (isMinimized) {
          this.restoreMinimizedWindow(windowId);
        } else {
          this.focusWindow(windowId);
        }
      };

      // Add active state for currently focused window (not minimized)
      if (!isMinimized && window.style.zIndex == this.zIndexCounter) {
        taskbarItem.classList.add("active");
      }

      taskbarWindows.appendChild(taskbarItem);
    });
  }

  focusWindow(windowId) {
    const window = document.getElementById(windowId);
    const isMinimized = window.dataset.isMinimized === "true";

    if (isMinimized) {
      // If window is minimized, restore it
      this.restoreMinimizedWindow(windowId);
    } else {
      // If window is not minimized, just bring to front
      window.style.zIndex = ++this.zIndexCounter;
      this.addFocusEffect(window);
      this.updateTaskbar();
    }
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
        
        @keyframes windowRestore {
            from {
                opacity: 0;
                transform: scale(0.1) translateY(100vh);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
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
        
        .taskbar-window.minimized {
            opacity: 0.6;
            font-style: italic;
        }
        
        .taskbar-window.minimized::before {
            background: #1E9BE4;
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
                <img src="./icons/avatar.png" 
                     style="width: 48px; height: 54px; border-radius: 50%;" alt="User">
                <div>
                    <div style="font-weight: 600;">Katekani Nyamandi</div>
                    <div style="font-size: 12px; opacity: 0.7;">knyamandi99@gmail.com</div>
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
              

                <button onclick="event.stopPropagation(); windowManager.togglePowerMenu()" 
    style="background: none; border: none; color: white; padding: 8px; border-radius: 4px; cursor: pointer; transition: background 0.2s;"
    onmouseover="this.style.background='rgba(255,255,255,0.1)'"
    onmouseout="this.style.background='transparent'">
<i class="fas fa-power-off"></i>  Power
</button>

<button onclick="event.stopPropagation(); windowManager.demoMode()"
 style="background: none; border: none; color: white; padding: 8px; border-radius: 4px; cursor: pointer; transition: background 0.2s;"
    onmouseover="this.style.background='rgba(255,255,255,0.1)'"
    onmouseout="this.style.background='transparent'">
<i class="fas fa-play-circle"></i>  Demo Portfolio
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

  createStartMenuItems(f) {
    const items = [
      { icon: "home", label: "About", window: "about" },
      { icon: "terminal", label: "Projects", window: "projects" },
      { icon: "settings", label: "Skills", window: "skills" },
      { icon: "email", label: "Contact", window: "contact" },
      {
        icon: "name-tag/icons8-name-tag-96",
        label: "Personal",
        window: "personal",
      },
      { icon: "folder", label: "Resume", window: "resume" },
    ];

    return items
      .map(
        (item) => `
        <div onclick="windowManager.openWindow('${item.window}'); windowManager.closeStartMenu();" 
             style="display: flex; flex-direction: column; align-items: center; padding: 12px; border-radius: 8px; cursor: pointer; background:rgba(255,255,255,0.1);  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); transition: background 0.2s;"
             onmouseover="this.style.background='rgba(161, 140, 140, 0.1)'"
             onmouseout="this.style.background='transparent'">
            <div style="width: 40px; height: 40px; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                <img src="./icons/${item.icon}.png" alt="${item.label} icon" style="width: 1.5em; height: 1.4em; ">
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
      hour12: false,
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
  minimizeWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;

    // Mark as minimized but keep in activeWindows
    window.dataset.isMinimized = "true";

    // Animate minimize
    window.style.animation = "windowMinimize 0.3s ease-out forwards";

    setTimeout(() => {
      window.classList.remove("active");
      window.style.animation = "";
      window.style.transform = "scale(0.1)";
      window.style.opacity = "0";
      window.style.pointerEvents = "none";

      // Keep window in activeWindows array but mark as minimized
      // This way it stays in the taskbar for restoration
      this.updateTaskbar();
    }, 300);
  }

  maximizeWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;

    if (window.classList.contains("maximized")) {
      // Restore window
      this.restoreWindow(windowId);
    } else {
      // Maximize window
      this.doMaximizeWindow(windowId);
    }
  }

  doMaximizeWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;

    // Only store original dimensions if not already stored
    if (!window.dataset.originalWidth) {
      window.dataset.originalWidth = window.style.width || "600px";
      window.dataset.originalHeight = window.style.height || "400px";
      window.dataset.originalLeft = window.style.left || "100px";
      window.dataset.originalTop = window.style.top || "100px";
    }

    // Maximize
    window.classList.add("maximized");
    window.style.width = "100vw";
    window.style.height = "calc(100vh - 56px)";
    window.style.left = "0px";
    window.style.top = "0px";
    window.style.borderRadius = "0px";

    // Update maximize button symbol
    const maximizeBtn = window.querySelector(".window-control.maximize");
    if (maximizeBtn) {
      maximizeBtn.innerHTML = "🗗";
      maximizeBtn.title = "Restore";
    }
  }

  restoreWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;

    // Restore original dimensions
    window.classList.remove("maximized");
    window.style.width = window.dataset.originalWidth || "600px";
    window.style.height = window.dataset.originalHeight || "400px";
    window.style.left = window.dataset.originalLeft || "100px";
    window.style.top = window.dataset.originalTop || "100px";
    window.style.borderRadius = "0px";

    // Update maximize button symbol
    const maximizeBtn = window.querySelector(".window-control.maximize");
    if (maximizeBtn) {
      maximizeBtn.innerHTML = "🗖"; // Maximize symbol
      maximizeBtn.title = "Maximize";
    }
  }

  restoreMinimizedWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;

    // Remove minimized state
    delete window.dataset.isMinimized;

    // Show the window with restore animation
    window.style.display = "block";
    window.classList.add("active");
    window.style.animation = "windowRestore 0.3s ease-out";

    // Reset styles after animation
    setTimeout(() => {
      window.style.animation = "";
      window.style.transform = "";
      window.style.opacity = "";
      window.style.pointerEvents = "";
    }, 300);

    // Bring to front
    window.style.zIndex = ++this.zIndexCounter;
    this.addFocusEffect(window);
    this.updateTaskbar();
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
    //this.addWeatherWidget();
  }

  updateGreeting() {
    const hour = new Date().getHours();
    let greeting = "Hello!";
    let emoji = "👋";

    if (hour < 6) {
      greeting = "Hey there,";
      emoji = "🌙";
    } else if (hour < 12) {
      greeting = "Hey there, early bird!";
      emoji = "🌅";
    } else if (hour < 18) {
      greeting = "Hey there,";
      emoji = "🌸";
    } else {
      greeting = "Hey,";
      emoji = "🌙";
    }

    setTimeout(() => {
      const aboutTitle = document.querySelector("#about h2");
      aboutTitle.style.textAlign = "center";
      if (aboutTitle) {
        aboutTitle.innerHTML = `${greeting} <br> I'm Katekani Nyamandi ${emoji}`;
      }
    }, 1000);
  }

  addTypingEffect() {
    const tagline = document.querySelector(".tagline");
    if (!tagline) return;

    const text = tagline.textContent;
    tagline.textContent = "";
    tagline.style.whiteSpace = "nowrap";
    tagline.style.setProperty(
      "font-family",
      "Segoe UI, sans-serif",
      "important"
    );
    tagline.style.overflow = "hidden";
    tagline.style.display = "inline-block";
    tagline.style.fontSize = "1.2em";
    tagline.style.fontWeight = "bold";

    let i = 0;
    const typeWriter = () => {
      if (i < text.length) {
        tagline.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 50);
      } else {
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
      "color: #DE0077; font-size: 14px; font-weight: bold;"
    );
  }

  async getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation not supported");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve(`${latitude},${longitude}`);
        },
        (error) => {
          console.log("Location access denied, using default location");
          resolve("Johannesburg"); //
        },
        { timeout: 5000 }
      );
    });
  }

  /*
  async addWeatherWidget() {
    const weather = document.createElement("div");
    weather.id = "weatherWidget";
    weather.style.cssText = `
    position: absolute;
    left: 1em;
    top: 50%;
    transform: translateY(-50%);
    color: white;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.2s ease;
`;

    // Add loading state
    weather.innerHTML = `<i class="fas fa-spinner fa-spin" style="color: #ffd700;"></i> <span>Loading...</span>`;

    document.querySelector(".taskbar").appendChild(weather);

    // Fetch weather data only once
    try {
      const weatherData = await this.fetchWeatherData();
      this.updateWeatherWidget(weather, weatherData);

      // Update weather every 10 minutes
      setInterval(async () => {
        try {
          const updatedData = await this.fetchWeatherData();
          this.updateWeatherWidget(weather, updatedData);
        } catch (error) {
          console.log("Weather update failed:", error);
        }
      }, 10 * 60 * 1000); // 10 minutes
    } catch (error) {
      console.error("Weather fetch failed:", error);
      this.updateWeatherWidget(weather, null);
    }

    // Add click handler for detailed weather
    weather.addEventListener("click", () => {
      this.showDetailedWeather();
    });
  }

  async fetchWeatherData(city = "Johannesburg") {
    const API_KEY = "6d12123f7e334c2e887173005250107";
    const API_URL = `http://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}&aqi=no`;

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching weather:", error);
      throw error;
    }
  }

  // Add this method to update the weather widget
  updateWeatherWidget(weatherElement, data) {
    if (!data) {
      // Fallback if API fails
      weatherElement.innerHTML = `<i class="fas fa-cloud" style="color: #ccc;"></i> <span>Weather unavailable</span>`;
      return;
    }

    const { current, location } = data;
    const temp = Math.round(current.temp_c);
    const condition = current.condition.text;
    const icon = this.getWeatherIcon(current.condition.code, current.is_day);

    weatherElement.innerHTML = `
    <i class="${icon.class}" style="color: ${icon.color};"></i>
    <span>${temp}°C</span>
    <span style="opacity: 0.8; font-size: 1em;">${location.name}</span>
`;

    // Add tooltip
    weatherElement.title = `${condition} in ${
      location.name
    }\nFeels like ${Math.round(current.feelslike_c)}°C\nHumidity: ${
      current.humidity
    }%`;
  }

  // Add this method to get appropriate weather icons
  getWeatherIcon(conditionCode, isDay) {
    const icons = {
      // Sunny/Clear
      1000: {
        day: { class: "fas fa-sun", color: "#ffd700" },
        night: { class: "fas fa-moon", color: "#f0f0f0" },
      },
      // Partly cloudy
      1003: {
        day: { class: "fas fa-cloud-sun", color: "#87ceeb" },
        night: { class: "fas fa-cloud-moon", color: "#d3d3d3" },
      },
      // Cloudy
      1006: { class: "fas fa-cloud", color: "#87ceeb" },
      1009: { class: "fas fa-cloud", color: "#696969" },
      // Rain
      1063: { class: "fas fa-cloud-rain", color: "#4682b4" },
      1180: { class: "fas fa-cloud-rain", color: "#4682b4" },
      1183: { class: "fas fa-cloud-rain", color: "#4682b4" },
      1186: { class: "fas fa-cloud-rain", color: "#4682b4" },
      1189: { class: "fas fa-cloud-rain", color: "#4682b4" },
      1192: { class: "fas fa-cloud-showers-heavy", color: "#191970" },
      1195: { class: "fas fa-cloud-showers-heavy", color: "#191970" },
      // Snow
      1066: { class: "fas fa-snowflake", color: "#e0e0e0" },
      1210: { class: "fas fa-snowflake", color: "#e0e0e0" },
      1213: { class: "fas fa-snowflake", color: "#e0e0e0" },
      1216: { class: "fas fa-snowflake", color: "#e0e0e0" },
      1219: { class: "fas fa-snowflake", color: "#e0e0e0" },
      1222: { class: "fas fa-snowflake", color: "#e0e0e0" },
      1225: { class: "fas fa-snowflake", color: "#e0e0e0" },
      // Thunderstorm
      1087: { class: "fas fa-bolt", color: "#ffd700" },
      1273: { class: "fas fa-bolt", color: "#ffd700" },
      1276: { class: "fas fa-bolt", color: "#ffd700" },
      // Fog/Mist
      1135: { class: "fas fa-smog", color: "#d3d3d3" },
      1147: { class: "fas fa-smog", color: "#d3d3d3" },
    };

    const iconData = icons[conditionCode];

    if (iconData) {
      // If day/night specific icons exist
      if (iconData.day && iconData.night) {
        return isDay ? iconData.day : iconData.night;
      }
      // Otherwise use the general icon
      return iconData;
    }

    // Default icon
    return { class: "fas fa-cloud", color: "#87ceeb" };
  }

  showDetailedWeather() {
    // Remove any existing weather popup first
    const existingPopup = document.querySelector(".weather-popup");
    if (existingPopup) {
      existingPopup.remove();
    }

    // Create detailed weather popup
    const popup = document.createElement("div");
    popup.className = "weather-popup";
    popup.style.cssText = `
    position: fixed;
    bottom: 70px;
    right: 20px;
    width: 300px;
    background: rgba(32, 32, 32, 0.95);
    backdrop-filter: blur(40px);
    color: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 10001;
    animation: slideInWeather 0.3s ease-out;
`;

    popup.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0; font-size: 16px;">Weather Details</h3>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0; width: 24px; height: 24px;">×</button>
    </div>
    <div class="detailed-weather-content">
        <i class="fas fa-spinner fa-spin" style="color: #ffd700;"></i> Loading detailed weather...
    </div>
`;

    document.body.appendChild(popup);

    // Fetch and display detailed weather - pass the popup reference
    this.loadDetailedWeather(popup);

    // Auto-close after 10 seconds
    setTimeout(() => {
      if (popup.parentElement) {
        popup.remove();
      }
    }, 10000);
  }

  // Modify this method to accept popup reference
  async loadDetailedWeather(popup) {
    try {
      const data = await this.fetchWeatherData();
      const content = popup.querySelector(".detailed-weather-content");

      if (content && data) {
        const { current, location } = data;

        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 16px;">
                <div style="font-size: 24px; margin-bottom: 8px;">
                   ${Math.round(current.temp_c)}°C
                </div>
                <div style="opacity: 0.8;">${current.condition.text}</div>
                <div style="font-size: 12px; opacity: 0.6;">${location.name}, ${
          location.country
        }</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px;">
                <div>
                    <strong>Feels like:</strong><br>
                    ${Math.round(current.feelslike_c)}°C
                </div>
                <div>
                    <strong>Humidity:</strong><br>
                    ${current.humidity}%
                </div>
                <div>
                    <strong>Wind:</strong><br>
                    ${current.wind_mph} km/h ${current.wind_dir}
                </div>
                <div>
                    <strong>Visibility:</strong><br>
                    ${current.vis_km} km
                </div>
                <div>
                    <strong>UV Index:</strong><br>
                    ${current.uv}
                </div>
                <div>
                    <strong>Pressure:</strong><br>
                    ${current.pressure_in} in
                </div>
            </div>
            
            <div style="margin-top: 12px; font-size: 11px; opacity: 0.6; text-align: center;">
                Last updated: ${new Date(
                  current.last_updated
                ).toLocaleTimeString()}
            </div>
        `;
      }
    } catch (error) {
      const content = popup.querySelector(".detailed-weather-content");
      if (content) {
        content.innerHTML = `
            <div style="color: #ff6b6b; text-align: center;">
                <i class="fas fa-exclamation-triangle"></i><br>
                Unable to load weather data
            </div>
        `;
      }
    }
  }*/

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

  minimizeWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;

    // Mark as minimized but keep in activeWindows for taskbar
    window.dataset.isMinimized = "true";

    // Animate minimize to taskbar
    window.style.animation = "windowMinimize 0.3s ease-out forwards";

    setTimeout(() => {
      // Hide the window but keep it in DOM
      window.style.display = "none";
      window.style.animation = "";

      // Don't remove from activeWindows - keep it for taskbar
      // this.activeWindows = this.activeWindows.filter(id => id !== windowId); // Remove this line

      // Update taskbar to show minimized state
      this.updateTaskbar();
    }, 300);
  }

  maximizeWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;

    // Check if already maximized
    const isMaximized =
      window.style.width === "100vw" || window.classList.contains("maximized");

    if (isMaximized) {
      // Restore to original size
      window.style.left = "300px";
      window.style.top = "120px";
      window.style.width = "650px";
      window.style.height = "500px";
      window.classList.remove("maximized");
    } else {
      // Maximize
      window.style.left = "0px";
      window.style.top = "0px";
      window.style.width = "100vw";
      window.style.height = "calc(100vh - 56px)";
      window.classList.add("maximized");
    }

    // Add Windows 11 animation effect
    window.style.transition = "all 0.2s ease-out";
    setTimeout(() => {
      window.style.transition = "";
    }, 200);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  windowManager = new Windows11Manager();
  window.windowManager = windowManager;
  window.personalFeatures = new Windows11PersonalFeatures();
  window.easterEggs = new Windows11EasterEggs();
  // kanbanManager = new KanbanManager();
  // window.kanbanManager = kanbanManager;

  // Make functions globally accessible
  window.closeWindow = (windowId) => windowManager.closeWindow(windowId);
  window.minimizeWindow = (windowId) => windowManager.minimizeWindow(windowId);
  window.maximizeWindow = (windowId) => windowManager.maximizeWindow(windowId);
  window.showStartMenu = () => windowManager.toggleStartMenu();

  // Welcome notification
  setTimeout(() => {
    personalFeatures.showNotification(
      "Welcome to Windows 11 Portfolio! 👋",
      "Double-click icons to open windows, drag to move them, and try the Project Board!",
      "fab fa-windows"
    );
  }, 1000);
});

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
