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
    this.notificationHistory = [];
    this.maxNotifications = 10;
    this.currentCalendarDate = null;
    this.selectedCalendarDate = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateClock();
    this.startClockUpdate();
    this.setupWindowSnapping();
    this.addWindows11Animations();
    this.initializeWindowStructure(); // Add this
  }

  initializeWindowStructure() {
    // Ensure all windows are properly attached to body and not nested
    const windows = document.querySelectorAll(".window");
    windows.forEach((window) => {
      if (window.parentElement !== document.body) {
        console.log(
          `Moving window ${window.id} to body level (was nested in ${window.parentElement.tagName})`
        );
        document.body.appendChild(window);
      }
      // Ensure proper initial styling
      window.style.position = "absolute";
    });
    console.log(`Initialized ${windows.length} windows at body level`);
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

  // Get time-appropriate greeting
  getTimeBasedGreeting() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return {
        message: "Good morning! ☀️",
        description: "Portfolio is now awake and ready.",
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        message: "Good afternoon! 🌤️",
        description: "Portfolio is back online.",
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        message: "Good evening! 🌅",
        description: "Portfolio has resumed activity.",
      };
    } else {
      return {
        message: "Good night! 🌙",
        description: "Portfolio is active in night mode.",
      };
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
      const greeting = this.getTimeBasedGreeting();
      personalFeatures.showNotification(
        greeting.message,
        greeting.description,
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
      "Shutting Down...",
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
    background: linear-gradient(135deg, #1e1e1e 0%, #2d2d30 50%, #1e1e1e 100%);
    z-index: 20000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 2s ease;
`;

    shutdownOverlay.innerHTML = `
    <div style="text-align: center; color: white; animation: fadeInUp 1s ease 2s both; max-width: 600px; padding: 40px;">
        <div style="margin-bottom: 30px;">
            <i class="fas fa-user-circle" style="font-size: 64px; color: #0078d4; margin-bottom: 20px;"></i>
        </div>
        
        <div style="font-size: 36px; margin-bottom: 20px; font-weight: 300;">Thanks for exploring my portfolio!</div>
        
        <div style="font-size: 18px; opacity: 0.8; margin-bottom: 30px; line-height: 1.6;">
            I hope you enjoyed discovering my projects, skills, and the interactive Windows 11 experience.<br>
            Feel free to connect with me for opportunities or collaborations.
        </div>
        

        
        <div style="margin-bottom: 30px;">
            <div style="font-size: 16px; margin-bottom: 15px; opacity: 0.9;">Connect with me:</div>
            <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
                <a href="https://github.com/katekanin" target="_blank" style="color: white; text-decoration: none; opacity: 0.8; transition: opacity 0.3s;">
                    <i class="fab fa-github" style="font-size: 24px;"></i>
                </a>
                <a href="https://linkedin.com/in/katekanin" target="_blank" style="color: white; text-decoration: none; opacity: 0.8; transition: opacity 0.3s;">
                    <i class="fab fa-linkedin" style="font-size: 24px;"></i>
                </a>
                <a href="https://calendar.app.google/LnkWXbra3MUtCyQM9" target="_blank" style="color: white; text-decoration: none; opacity: 0.8; transition: opacity 0.3s;">
                    <i class="fas fa-calendar-alt" style="font-size: 24px;"></i>
                </a>
            </div>
        </div>
        
        <button onclick="location.reload()" 
                style="background: linear-gradient(135deg, #0078d4, #106ebe); color: white; border: none; padding: 15px 30px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0, 120, 212, 0.3);"
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 120, 212, 0.4)'"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0, 120, 212, 0.3)'">
            <i class="fas fa-power-off" style="margin-right: 8px;"></i>
            Power On Again
        </button>
        
        <div style="margin-top: 30px; font-size: 14px; opacity: 0.5;">
            <i class="fas fa-heart" style="margin-right: 5px; color: #ff6b6b;"></i>
            Made with love and JavaScript by Katekani Nyamandi
        </div>
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
    setTimeout(
      () => {
        personalFeatures.showNotification(
          "Demo Complete! ✨",
          "Feel free to explore on your own now.",
          "fas fa-check-circle"
        );
      },
      demoSequence.length * 2000 + 2000
    );
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
      setTimeout(
        () => {
          document.getElementById("maintenanceStatus").textContent = step;
          document.getElementById("maintenanceProgress").style.width = `${
            ((index + 1) / steps.length) * 100
          }%`;
        },
        (index + 1) * 800
      );
    });

    setTimeout(
      () => {
        progressOverlay.remove();
        personalFeatures.showNotification(
          "Maintenance Complete! ✅",
          "Portfolio optimized and ready for peak performance.",
          "fas fa-check-circle"
        );
      },
      steps.length * 800 + 1000
    );
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

    const greeting = this.getTimeBasedGreeting();
    personalFeatures.showNotification(
      greeting.message,
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
    console.log(`Opening window: ${windowId}`);
    const window = document.getElementById(windowId);
    if (!window) {
      console.error(`Window not found: ${windowId}`);
      return;
    }

    // CRITICAL: Ensure window is attached to body, not nested inside another window
    if (window.parentElement !== document.body) {
      console.log(
        `Moving window ${windowId} to body (was in ${window.parentElement.id || "unknown"})`
      );
      document.body.appendChild(window);
    }

    // If window is already active, just bring it to front
    if (
      this.activeWindows.includes(windowId) &&
      window.classList.contains("active")
    ) {
      window.style.zIndex = ++this.zIndexCounter;
      this.addFocusEffect(window);
      console.log(`Window ${windowId} brought to front`);
      return;
    }

    // Remove active class from all other windows to unfocus them
    this.activeWindows.forEach((activeId) => {
      const activeWindow = document.getElementById(activeId);
      if (activeWindow && activeId !== windowId) {
        activeWindow.classList.remove("focused");
      }
    });

    // Ensure window is in clean state before opening
    this.resetWindowState(window);

    // Force proper positioning and display
    window.style.position = "absolute";

    // Windows 11 opening animation
    window.classList.add("opening");
    setTimeout(() => window.classList.remove("opening"), 400);

    // Activate the window
    window.classList.add("active");
    window.style.zIndex = ++this.zIndexCounter;

    // Update active windows list
    if (!this.activeWindows.includes(windowId)) {
      this.activeWindows.push(windowId);
    }

    this.updateTaskbar();
    this.centerWindowSmart(window);

    // Add focus ring effect
    this.addFocusEffect(window);

    console.log(
      `Window ${windowId} opened successfully at zIndex ${window.style.zIndex}`
    );
  }

  resetWindowState(window) {
    window.classList.remove("maximized", "focused");

    // Clear minimized state
    delete window.dataset.isMinimized;
    delete window.dataset.wasActive;

    // Reset to original dimensions and position if they exist
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
    window.style.borderRadius = "0px";
    window.style.boxShadow = "";

    // Ensure proper positioning
    window.style.position = "absolute";

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
            height: 740px;
            background: rgba(32, 32, 32, 0.98);
            backdrop-filter: blur(40px) saturate(150%);
            border-radius: 12px;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
            display: none;
            z-index: 9998;
            overflow: hidden;
        }
        
        .start-menu.active {
            display: block;
            animation: startMenuOpen 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .start-menu-container {
            height: 100%;
            display: flex;
            flex-direction: column;
            color: #ffffff;
        }
        
        /* Search Section */
        .start-search-section {
            padding: 24px 24px 16px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .start-search-container {
            position: relative;
            margin-bottom: 16px;
        }
        
        .start-search-input {
            width: 100%;
            height: 44px;
            padding: 0 16px 0 44px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            color: #ffffff;
            font-size: 14px;
            font-family: 'Segoe UI', sans-serif;
            outline: none;
            transition: all 0.2s ease;
        }
        
        .start-search-input::placeholder {
            color: rgba(255, 255, 255, 0.54);
        }
        
        .start-search-input:focus {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(96, 205, 255, 0.8);
            box-shadow: 0 0 0 1px rgba(96, 205, 255, 0.4);
        }
        
        .search-icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: rgba(255, 255, 255, 0.54);
            font-size: 16px;
            pointer-events: none;
        }
        
        .search-suggestions {
            margin-top: 8px;
        }
        
        .suggestions-text {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.54);
            margin-bottom: 8px;
        }
        
        .suggestion-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        
        .suggestion-tag {
            padding: 4px 12px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 12px;
            cursor: pointer;
            transition: all 0.15s ease;
            font-family: 'Segoe UI', sans-serif;
        }
        
        .suggestion-tag:hover {
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 255, 255, 0.16);
        }
        
        /* Pinned Section */
        .start-pinned-section {
            padding: 20px 24px;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            border: none;
            background: none;
            border-bottom: none;
            padding-bottom: 0;
        }
        
        .section-title {
            font-size: 12px;
            font-weight: 600;
            margin: 0;
            color: #ffffff;
            font-family: 'Segoe UI', sans-serif;
            border: none;
            background: none;
            border-bottom: none;
            padding-bottom: 0;
        }
        
        .pinned-apps-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 12px;
        }
        
        .pinned-app {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 8px 8px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.15s ease;
            position: relative;
        }
        
       
        
        .app-icon {
            width: 48px;
            height: 48px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .app-icon img {
            width: 32px;
            height: 32px;
            object-fit: contain;
        }
        
        .app-label {
            font-size: 12px;
            color: #ffffff;
            text-align: center;
            font-family: 'Segoe UI', sans-serif;
            line-height: 1.2;
        }
        
        /* Recommended Section */
        .start-recommended-section {
            padding: 20px 24px;
            flex: 1;
            overflow-y: auto;
        }
        
        .recommended-items {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        
        .recommended-item {
            display: flex;
            align-items: center;
            padding: 8px 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s ease;
            gap: 12px;
        }
        
        .recommended-item:hover {
            background: rgba(255, 255, 255, 0.06);
        }
        
        .recommended-icon {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        
        .recommended-icon img {
            width: 24px;
            height: 24px;
            object-fit: contain;
        }
        
        .recommended-content {
            flex: 1;
            min-width: 0;
        }
        
        .recommended-title {
            font-size: 14px;
            color: #ffffff;
            font-weight: 400;
            margin-bottom: 2px;
            font-family: 'Segoe UI', sans-serif;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .recommended-subtitle {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.54);
            font-family: 'Segoe UI', sans-serif;
        }
        
        .recommended-time {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.54);
            font-family: 'Segoe UI', sans-serif;
            flex-shrink: 0;
        }
        
        /* Account Section */
        .start-account-section {
            padding: 16px 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .account-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .account-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
        }
        
        .account-name {
            font-size: 14px;
            color: #ffffff;
            font-weight: 600;
            font-family: 'Segoe UI', sans-serif;
        }
        
        .power-button {
            width: 32px;
            height: 32px;
            background: none;
            border: none;
            border-radius: 6px;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .power-button:hover {
            background: rgba(255, 255, 255, 0.06);
            color: #ffffff;
        }
        
        /* Search Results */
        .search-results-container {
            margin-top: 12px;
            display: none;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .search-results-container[style*="block"] {
            display: block !important;
        }
        
        /* Search input styling */
        #startMenuSearch {
            transition: all 0.3s ease;
        }
        
        #startMenuSearch:focus {
            outline: none;
            border-color: rgba(0, 120, 212, 0.6) !important;
            box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.2) !important;
            background: rgba(255, 255, 255, 0.15) !important;
        }
        
        /* Search results styling */
        .search-result-item {
            animation: searchResultFadeIn 0.3s ease-out;
        }
        
        @keyframes searchResultFadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Custom scrollbar for search results */
        #searchResults > div:first-child {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }
        
        #searchResults > div:first-child::-webkit-scrollbar {
            width: 6px;
        }
        
        #searchResults > div:first-child::-webkit-scrollbar-track {
            background: transparent;
        }
        
        #searchResults > div:first-child::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
        }
        
        #searchResults > div:first-child::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
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
        <div class="start-menu-container">
            <!-- Search Section -->
            <div class="start-search-section">
                <div class="start-search-container">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" 
                           id="startMenuSearch" 
                           placeholder="Search for apps, settings, and documents" 
                           class="start-search-input"
                           autocomplete="off">
                </div>
                <div id="searchResults" class="search-results-container"></div>
                <div id="searchSuggestions" class="search-suggestions">
                    <div class="suggestions-text">Try searching for:</div>
                    <div class="suggestion-tags">
                        <button onclick="document.getElementById('startMenuSearch').value='hackathon'; windowManager.performSearch('hackathon');" class="suggestion-tag">hackathon</button>
                        <button onclick="document.getElementById('startMenuSearch').value='React'; windowManager.performSearch('React');" class="suggestion-tag">React</button>
                        <button onclick="document.getElementById('startMenuSearch').value='Node'; windowManager.performSearch('Node');" class="suggestion-tag">Node</button>
                        <button onclick="document.getElementById('startMenuSearch').value='JavaScript'; windowManager.performSearch('JavaScript');" class="suggestion-tag">JavaScript</button>
                        <button onclick="document.getElementById('startMenuSearch').value='resume'; windowManager.performSearch('developer');" class="suggestion-tag">developer</button>
                    </div>
                </div>
            </div>

            <!-- Pinned Section -->
            <div class="start-pinned-section">
                <div class="section-header">
                    <h3 class="section-title">Pinned</h3>
                </div>
                <div class="pinned-apps-grid">
                    ${this.createPinnedApps()}
                </div>
            </div>

            <!-- Recommended Section -->
            <div class="start-recommended-section">
                <div class="section-header">
                    <h3 class="section-title">Recommended</h3>
                </div>
                <div class="recommended-items">
                    ${this.createWindowsRecommendedItems()}
                </div>
            </div>

            <!-- Account Section -->
            <div class="start-account-section">
                <div class="account-info">
                    <img src="./icons/avatar.jpg" class="account-avatar" alt="User">
                    <span class="account-name">Katekani Nyamandi</span>
                </div>
                <button class="power-button" onclick="event.stopPropagation(); windowManager.togglePowerMenu()">
                    <i class="fas fa-power-off"></i>
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

    // Set up search functionality
    this.setupStartMenuSearch();

    return startMenu;
  }

  createPinnedApps() {
    const apps = [
      { icon: "home", label: "About", window: "about" },
      {
        icon: "terminal",
        label: "Projects",
        action: "window.open('https://github.com/KatekaniN', '_blank')",
      },
      { icon: "settings", label: "Skills", window: "skills" },
      { icon: "email", label: "Contact", window: "contact" },
      {
        icon: "name-tag/icons8-name-tag-96",
        label: "Personal",
        window: "personal",
      },
      { icon: "folder", label: "Resume", window: "resume" },
      { icon: "kate", label: "AI Assistant", window: "aiChat" },
      {
        icon: "fun-room",
        label: "Games",
        window: "games",
        isFontAwesome: true,
      },
    ];

    return apps
      .map((app) => {
        const clickAction = app.action
          ? `${app.action}; windowManager.closeStartMenu();`
          : `windowManager.openWindow('${app.window}'); windowManager.closeStartMenu();`;

        const iconHtml = app.isFontAwesome
          ? `<i class="fa-solid fa-gamepad" style="color: #2C7EBD; font-size: 24px;"></i>`
          : `<img src="./icons/${app.icon}.png" alt="${app.label}">`;

        return `
        <div class="pinned-app" onclick="${clickAction}">
            <div class="app-icon">
                ${iconHtml}
            </div>
            <span class="app-label">${app.label}</span>
        </div>
    `;
      })
      .join("");
  }

  createWindowsRecommendedItems() {
    const items = [
      {
        icon: "folder",
        title: "katekani nyamandi resume",
        subtitle: "You edited",
        time: "Recently",
        action: "downloadResume",
      },
      {
        icon: "terminal",
        title: "GitHub Projects",
        subtitle: "Recently accessed",
        time: "Today",
        action: "window.open('https://github.com/KatekaniN', '_blank')",
      },
      {
        icon: "kate",
        title: "AI Portfolio Assistant",
        subtitle: "Recently added",
        time: "Today",
        action: "openWindow('aiChat')",
      },
      {
        icon: "email",
        title: "Contact Information",
        subtitle: "You viewed",
        time: "Yesterday",
        action: "openWindow('contact')",
      },
    ];

    return items
      .map(
        (item) => `
        <div class="recommended-item" onclick="windowManager.handleRecommendedAction(\`${item.action}\`)">
            <div class="recommended-icon">
                <img src="./icons/${item.icon}.png" alt="${item.title}">
            </div>
            <div class="recommended-content">
                <div class="recommended-title">${item.title}</div>
                <div class="recommended-subtitle">${item.subtitle}</div>
            </div>
            <div class="recommended-time">${item.time}</div>
        </div>
    `
      )
      .join("");
  }

  createStartMenuItems(f) {
    const items = [
      { icon: "home", label: "About", window: "about", color: "#0078d4" },
      {
        icon: "terminal",
        label: "Projects",
        window: "projects",
        color: "#107c10",
      },
      { icon: "settings", label: "Skills", window: "skills", color: "#ff8c00" },
      { icon: "email", label: "Contact", window: "contact", color: "#d13438" },
      {
        icon: "name-tag/icons8-name-tag-96",
        label: "Personal",
        window: "personal",
        color: "#8764b8",
      },
      { icon: "folder", label: "Resume", window: "resume", color: "#ca5010" },
    ];

    return items
      .map(
        (item) => `
        <div onclick="windowManager.openWindow('${item.window}'); windowManager.closeStartMenu();" 
             style="display: flex; flex-direction: column; align-items: center; padding: 16px 12px; border-radius: 8px; cursor: pointer; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s ease; position: relative; overflow: hidden;"
             onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.15)'"
             onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='translateY(0px)'; this.style.boxShadow='none'">
            <div style="width: 48px; height: 48px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; background: linear-gradient(135deg, ${item.color}20, ${item.color}40); border: 1px solid ${item.color}30;">
                <img src="./icons/${item.icon}.png" alt="${item.label} icon" style="width: 24px; height: 24px; filter: brightness(1.1);">
            </div>
            <span style="font-size: 12px; text-align: center; font-weight: 500;">${item.label}</span>
        </div>
    `
      )
      .join("");
  }

  createRecommendedItems() {
    const items = [
      {
        icon: "fas fa-file-pdf",
        title: "Resume PDF",
        description: "Download my latest resume",
        action: "downloadResume",
      },
      {
        icon: "fas fa-code",
        title: "Latest Projects",
        description: "View my recent development work",
        action: "window.open('https://github.com/KatekaniN', '_blank')",
      },
      {
        icon: "fas fa-robot",
        title: "AI Portfolio Assistant",
        description: "Chat with my AI assistant about my experience",
        action: "openWindow('aiChat')",
      },
      {
        icon: "fas fa-envelope",
        title: "Contact Information",
        description: "Get in touch for opportunities",
        action: "openWindow('contact')",
      },
      {
        icon: "fas fa-route",
        title: "My Development Journey",
        description: "Read about my transition into tech",
        action: "openWindow('personal')",
      },
    ];

    return items
      .map(
        (item) => `
        <div onclick="windowManager.handleRecommendedAction(\`${item.action}\`)" 
             style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);"
             onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateX(2px)'"
             onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.transform='translateX(0px)'">
            <div style="width: 36px; height: 36px; background: rgba(0,120,212,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <i class="${item.icon}" style="font-size: 16px; color: #0078d4;"></i>
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 14px; margin-bottom: 2px;">${item.title}</div>
                <div style="font-size: 12px; opacity: 0.7; line-height: 1.3;">${item.description}</div>
            </div>
            <div style="opacity: 0.4; transition: opacity 0.2s;">
                <i class="fas fa-chevron-right"></i>
            </div>
        </div>
    `
      )
      .join("");
  }

  handleRecommendedAction(action) {
    // Close the start menu first
    this.closeStartMenu();

    if (action === "downloadResume") {
      // Trigger resume download
      const link = document.createElement("a");
      link.href = "./katekani%20nyamandi%20resume.pdf";
      link.download = "Katekani_Nyamandi_Resume.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show notification
      setTimeout(() => {
        personalFeatures.showNotification(
          "Resume Downloaded! 📄",
          "Katekani's resume has been downloaded to your device.",
          "fas fa-download"
        );
      }, 500);
    } else if (action.includes("github.com")) {
      // Handle GitHub link specifically
      window.open("https://github.com/KatekaniN", "_blank");
    } else if (action.startsWith("window.open(")) {
      // Handle other external links
      try {
        // Extract URL from window.open call
        const urlMatch = action.match(/window\.open\(['"`]([^'"`]+)['"`]/);
        if (urlMatch) {
          window.open(urlMatch[1], "_blank");
        }
      } catch (error) {
        console.error("Error opening external link:", error);
      }
    } else if (action.startsWith("openWindow(")) {
      // Extract window ID from the action string
      const windowId = action.match(/openWindow\(['"`]([^'"`]+)['"`]\)/)[1];
      setTimeout(() => {
        this.openWindow(windowId);
      }, 200);
    } else {
      // Unknown action - silently ignore
    }
  }

  setupStartMenuSearch() {
    const searchInput = document.getElementById("startMenuSearch");
    const searchResults = document.getElementById("searchResults");
    const searchSuggestions = document.getElementById("searchSuggestions");

    if (!searchInput || !searchResults) return;

    let searchTimeout;
    let selectedResultIndex = -1;

    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      selectedResultIndex = -1; // Reset selection

      if (query.length === 0) {
        searchResults.style.display = "none";
        searchResults.innerHTML = "";
        if (searchSuggestions) searchSuggestions.style.display = "block";
        return;
      }

      // Hide suggestions when searching
      if (searchSuggestions) searchSuggestions.style.display = "none";

      // Debounce search to avoid too many searches
      searchTimeout = setTimeout(() => {
        this.performSearch(query);
      }, 300);
    });

    searchInput.addEventListener("keydown", (e) => {
      const resultItems = searchResults.querySelectorAll(".search-result-item");

      if (e.key === "Escape") {
        searchInput.value = "";
        searchResults.style.display = "none";
        searchResults.innerHTML = "";
        if (searchSuggestions) searchSuggestions.style.display = "block";
        selectedResultIndex = -1;
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (resultItems.length > 0) {
          selectedResultIndex = Math.min(
            selectedResultIndex + 1,
            resultItems.length - 1
          );
          this.updateResultSelection(resultItems, selectedResultIndex);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (resultItems.length > 0) {
          selectedResultIndex = Math.max(selectedResultIndex - 1, -1);
          this.updateResultSelection(resultItems, selectedResultIndex);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedResultIndex >= 0 && resultItems[selectedResultIndex]) {
          resultItems[selectedResultIndex].click();
        } else if (resultItems.length > 0) {
          resultItems[0].click(); // Open first result if none selected
        }
      }
    });

    // Auto-focus search when start menu opens
    setTimeout(() => {
      if (document.getElementById("startMenu")?.classList.contains("active")) {
        searchInput.focus();
      }
    }, 150);
  }

  updateResultSelection(resultItems, selectedIndex) {
    resultItems.forEach((item, index) => {
      if (index === selectedIndex) {
        item.style.background = "rgba(0, 120, 212, 0.3)";
        item.style.transform = "translateX(4px)";
        item.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        item.style.background = "rgba(255,255,255,0.05)";
        item.style.transform = "translateX(0px)";
      }
    });
  }

  performSearch(query) {
    const searchResults = document.getElementById("searchResults");
    if (!searchResults) return;

    const results = this.searchWindowContent(query);
    this.displaySearchResults(results, query);
  }

  searchWindowContent(query) {
    const results = [];
    const queryLower = query.toLowerCase();

    // Define windows to search through
    const windowsToSearch = [
      {
        id: "about",
        title: "About Me",
        icon: "fas fa-user",
      },
      {
        id: "projects",
        title: "Projects",
        icon: "fas fa-code",
      },
      {
        id: "skills",
        title: "Skills",
        icon: "fas fa-tools",
      },
      {
        id: "contact",
        title: "Contact",
        icon: "fas fa-envelope",
      },
      {
        id: "personal",
        title: "My Journey",
        icon: "fas fa-route",
      },
      {
        id: "resume",
        title: "Resume",
        icon: "fas fa-file-alt",
      },
      {
        id: "aiChat",
        title: "AI Assistant",
        icon: "fas fa-robot",
      },
      {
        id: "games",
        title: "Games",
        icon: "fas fa-gamepad",
      },
    ];

    windowsToSearch.forEach((windowInfo) => {
      const windowElement = document.getElementById(windowInfo.id);
      if (!windowElement) return;

      const windowContent = windowElement.querySelector(".window-content");
      if (!windowContent) return;

      const textContent =
        windowContent.textContent || windowContent.innerText || "";
      const htmlContent = windowContent.innerHTML;

      // Search in text content
      if (textContent.toLowerCase().includes(queryLower)) {
        // Find the specific context where the match occurs
        const matches = this.findContextMatches(textContent, queryLower);

        if (matches.length > 0) {
          results.push({
            windowId: windowInfo.id,
            title: windowInfo.title,
            icon: windowInfo.icon,
            matches: matches,
            score: this.calculateRelevanceScore(
              textContent,
              queryLower,
              windowInfo.title
            ),
          });
        }
      }
    });

    // Sort results by relevance score (higher is better)
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  findContextMatches(text, query) {
    const matches = [];
    const textLower = text.toLowerCase();
    const contextLength = 80; // Characters before and after match

    let searchIndex = 0;
    const maxMatches = 3; // Limit to prevent too many results

    while (searchIndex < textLower.length && matches.length < maxMatches) {
      const matchIndex = textLower.indexOf(query, searchIndex);
      if (matchIndex === -1) break;

      // Get context around the match
      const startContext = Math.max(0, matchIndex - contextLength);
      const endContext = Math.min(
        text.length,
        matchIndex + query.length + contextLength
      );

      let context = text.substring(startContext, endContext);

      // Add ellipsis if we truncated
      if (startContext > 0) context = "..." + context;
      if (endContext < text.length) context = context + "...";

      // Highlight the match
      const matchStart = matchIndex - startContext + (startContext > 0 ? 3 : 0);
      const matchEnd = matchStart + query.length;

      matches.push({
        context: context,
        matchStart: matchStart,
        matchEnd: matchEnd,
        originalMatch: text.substring(matchIndex, matchIndex + query.length),
      });

      searchIndex = matchIndex + query.length;
    }

    return matches;
  }

  calculateRelevanceScore(content, query, title) {
    let score = 0;
    const contentLower = content.toLowerCase();
    const titleLower = title.toLowerCase();
    const queryLower = query.toLowerCase();

    // Title matches are more important
    if (titleLower.includes(queryLower)) {
      score += 100;
    }

    // Count occurrences in content
    const matches = (contentLower.match(new RegExp(queryLower, "g")) || [])
      .length;
    score += matches * 10;

    // Bonus for exact word matches
    const wordBoundaryRegex = new RegExp(`\\b${queryLower}\\b`, "gi");
    const exactMatches = (contentLower.match(wordBoundaryRegex) || []).length;
    score += exactMatches * 20;

    return score;
  }

  displaySearchResults(results, query) {
    const searchResults = document.getElementById("searchResults");
    if (!searchResults) return;

    if (results.length === 0) {
      searchResults.style.display = "block";
      searchResults.innerHTML = `
        <div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.54); font-size: 14px; font-family: 'Segoe UI', sans-serif;">
          <i class="fas fa-search" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
          No results found for "${query}"
        </div>
      `;
      return;
    }

    searchResults.style.display = "block";
    searchResults.innerHTML = `
      <div style="max-height: 400px; overflow-y: auto;">
        <div style="padding: 12px 16px 8px; font-size: 12px; color: rgba(255,255,255,0.54); border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 4px; font-family: 'Segoe UI', sans-serif;">
          Found ${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"
        </div>
        ${results.map((result) => this.createWindowsSearchResultItem(result, query)).join("")}
      </div>
    `;
  }

  createWindowsSearchResultItem(result, query) {
    const primaryMatch = result.matches[0];
    const highlightedContext = this.highlightMatch(
      primaryMatch.context,
      query,
      primaryMatch.matchStart,
      primaryMatch.matchEnd
    );

    return `
      <div class="search-result-item" 
           onclick="windowManager.openWindowFromSearch('${result.windowId}'); windowManager.closeStartMenu();"
           style="display: flex; align-items: center; padding: 12px 16px; border-radius: 6px; cursor: pointer; transition: all 0.15s ease; margin-bottom: 2px; gap: 12px;"
           onmouseover="this.style.background='rgba(255,255,255,0.06)'"
           onmouseout="this.style.background='transparent'">
        <div style="width: 32px; height: 32px; background: rgba(96, 205, 255, 0.1); border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <i class="${result.icon}" style="color: #60cdff; font-size: 16px;"></i>
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 14px; color: #ffffff; font-weight: 400; margin-bottom: 2px; font-family: 'Segoe UI', sans-serif;">
            ${result.title}
          </div>
          <div style="font-size: 12px; line-height: 1.4; color: rgba(255,255,255,0.7); font-family: 'Segoe UI', sans-serif; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${highlightedContext}
          </div>
          ${
            result.matches.length > 1
              ? `
            <div style="font-size: 11px; color: rgba(255,255,255,0.54); margin-top: 4px; font-family: 'Segoe UI', sans-serif;">
              +${result.matches.length - 1} more match${result.matches.length - 1 !== 1 ? "es" : ""}
            </div>
          `
              : ""
          }
        </div>
        <div style="color: rgba(255,255,255,0.3); flex-shrink: 0;">
          <i class="fas fa-external-link-alt" style="font-size: 12px;"></i>
        </div>
      </div>
    `;
  }

  createSearchResultItem(result, query) {
    const primaryMatch = result.matches[0];
    const highlightedContext = this.highlightMatch(
      primaryMatch.context,
      query,
      primaryMatch.matchStart,
      primaryMatch.matchEnd
    );

    return `
      <div class="search-result-item" 
           onclick="windowManager.openWindowFromSearch('${result.windowId}'); windowManager.closeStartMenu();"
           style="padding: 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s; margin-bottom: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);"
           onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.transform='translateX(4px)'"
           onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='translateX(0px)'">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <div style="width: 32px; height: 32px; background: rgba(0,120,212,0.2); border-radius: 6px; display: flex; align-items: center; justify-content: center;">
            <i class="${result.icon}" style="color: #0078d4; font-size: 14px;"></i>
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 14px;">${result.title}</div>
            <div style="font-size: 12px; opacity: 0.7;">${result.matches.length} match${result.matches.length !== 1 ? "es" : ""} found</div>
          </div>
          <div style="opacity: 0.4;">
            <i class="fas fa-external-link-alt" style="font-size: 12px;"></i>
          </div>
        </div>
        <div style="font-size: 13px; line-height: 1.4; opacity: 0.9;">
          ${highlightedContext}
        </div>
        ${
          result.matches.length > 1
            ? `
          <div style="font-size: 11px; opacity: 0.6; margin-top: 6px;">
            +${result.matches.length - 1} more match${result.matches.length - 1 !== 1 ? "es" : ""}
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  highlightMatch(context, query, matchStart, matchEnd) {
    const before = context.substring(0, matchStart);
    const match = context.substring(matchStart, matchEnd);
    const after = context.substring(matchEnd);

    return `${this.escapeHtml(before)}<span style="background: rgba(96, 205, 255, 0.25); color: #60cdff; padding: 1px 3px; border-radius: 2px; font-weight: 600;">${this.escapeHtml(match)}</span>${this.escapeHtml(after)}`;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  openWindowFromSearch(windowId) {
    // Close search results
    const searchInput = document.getElementById("startMenuSearch");
    const searchResults = document.getElementById("searchResults");
    const searchSuggestions = document.getElementById("searchSuggestions");

    if (searchInput) searchInput.value = "";
    if (searchResults) {
      searchResults.style.display = "none";
      searchResults.innerHTML = "";
    }
    if (searchSuggestions) searchSuggestions.style.display = "block";

    // Open the window
    this.openWindow(windowId);
  }

  getWindowTitle(windowId) {
    const titles = {
      about: "About Me",
      projects: "Projects",
      skills: "Skills",
      contact: "Contact",
      personal: "My Journey",
      resume: "Resume",
      aiChat: "AI Assistant",
      games: "Games",
    };
    return titles[windowId] || windowId;
  }

  updateStartMenuTime() {
    const timeElement = document.getElementById("startMenuTime");
    const dateElement = document.getElementById("startMenuDate");

    if (timeElement && dateElement) {
      const now = new Date();
      timeElement.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      dateElement.textContent = now.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
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

    const clockElement = document.getElementById("clock");
    if (clockElement) {
      clockElement.innerHTML = `
        <div style="font-size: 14px; font-weight: 600;">${timeString}</div>
        <div style="font-size: 12px; opacity: 0.8;">${dateString}</div>
      `;

      // Add click handler for notification center
      clockElement.onclick = () => this.toggleNotificationCenter();
      clockElement.style.cursor = "pointer";
    }
  }

  toggleNotificationCenter() {
    const existingCenter = document.getElementById("notificationCenter");
    if (existingCenter) {
      existingCenter.remove();
      return;
    }

    this.createNotificationCenter();
  }

  createNotificationCenter() {
    const now = new Date();
    this.currentCalendarDate = this.currentCalendarDate || new Date();

    const notificationCenter = document.createElement("div");
    notificationCenter.id = "notificationCenter";
    notificationCenter.innerHTML = `
      <div class="notification-center">
        <!-- Header -->
        <div class="notification-center-header">
          <h3>Notifications</h3>
          <div class="notification-actions">
            <button class="notification-action-btn" onclick="windowManager.clearAllNotifications()">
              Clear all
            </button>
          </div>
        </div>

        <!-- Notifications List -->
        <div class="notification-center-content" id="notificationCenterContent">
          ${this.renderNotificationHistory()}
        </div>
      </div>

      <!-- Calendar -->
      <div class="calendar-widget">
        <div class="calendar-header">
          <button class="calendar-nav-btn" onclick="windowManager.changeCalendarMonth(-1)">
            <i class="fas fa-chevron-left"></i>
          </button>
          <div class="calendar-title">
            <div class="calendar-date">${this.currentCalendarDate.toLocaleDateString([], { weekday: "long", day: "numeric" })}</div>
            <div class="calendar-month">${this.currentCalendarDate.toLocaleDateString([], { month: "long", year: "numeric" })}</div>
          </div>
          <button class="calendar-nav-btn" onclick="windowManager.changeCalendarMonth(1)">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        
        <div class="calendar-grid" id="calendarGrid">
          ${this.createCalendarGrid()}
        </div>
      </div>
    `;

    document.body.appendChild(notificationCenter);

    // Close when clicking outside
    setTimeout(() => {
      document.addEventListener(
        "click",
        (e) => {
          if (
            !notificationCenter.contains(e.target) &&
            !document.getElementById("clock").contains(e.target)
          ) {
            notificationCenter.remove();
          }
        },
        { once: true }
      );
    }, 100);
  }

  createCalendarGrid() {
    const now = new Date();
    const calendarDate = this.currentCalendarDate || now;
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const today = now.getDate();
    const isCurrentMonth =
      year === now.getFullYear() && month === now.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    let calendar = `
      <div class="calendar-days-header">
        ${daysOfWeek.map((day) => `<div class="calendar-day-header">${day}</div>`).join("")}
      </div>
      <div class="calendar-days">
    `;

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(
        year,
        month,
        0 - (startingDayOfWeek - 1 - i)
      ).getDate();
      const isSelected =
        this.selectedCalendarDate &&
        this.selectedCalendarDate.getFullYear() === year &&
        this.selectedCalendarDate.getMonth() === month - 1 &&
        this.selectedCalendarDate.getDate() === prevMonthDay;

      let dayClasses = "calendar-day prev-month";
      if (isSelected) dayClasses += " selected";

      calendar += `<div class="${dayClasses}" onclick="windowManager.selectCalendarDay(${year}, ${month - 1}, ${prevMonthDay})">${prevMonthDay}</div>`;
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today && isCurrentMonth;
      const isSelected =
        this.selectedCalendarDate &&
        this.selectedCalendarDate.getFullYear() === year &&
        this.selectedCalendarDate.getMonth() === month &&
        this.selectedCalendarDate.getDate() === day;

      let dayClasses = "calendar-day";
      if (isToday) dayClasses += " today";
      if (isSelected) dayClasses += " selected";

      calendar += `<div class="${dayClasses}" onclick="windowManager.selectCalendarDay(${year}, ${month}, ${day})">${day}</div>`;
    }

    // Add days from next month to fill the grid
    const totalCells = startingDayOfWeek + daysInMonth;
    const remainingCells = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
      const isSelected =
        this.selectedCalendarDate &&
        this.selectedCalendarDate.getFullYear() === year &&
        this.selectedCalendarDate.getMonth() === month + 1 &&
        this.selectedCalendarDate.getDate() === day;

      let dayClasses = "calendar-day next-month";
      if (isSelected) dayClasses += " selected";

      calendar += `<div class="${dayClasses}" onclick="windowManager.selectCalendarDay(${year}, ${month + 1}, ${day})">${day}</div>`;
    }

    calendar += "</div>";
    return calendar;
  }

  changeCalendarMonth(direction) {
    if (!this.currentCalendarDate) {
      this.currentCalendarDate = new Date();
    }

    this.currentCalendarDate.setMonth(
      this.currentCalendarDate.getMonth() + direction
    );

    // Update the calendar display
    const calendarGrid = document.getElementById("calendarGrid");
    const calendarTitle = document.querySelector(".calendar-title");

    if (calendarGrid) {
      calendarGrid.innerHTML = this.createCalendarGrid();
    }

    if (calendarTitle) {
      calendarTitle.innerHTML = `
        <div class="calendar-date">${this.currentCalendarDate.toLocaleDateString([], { weekday: "long", day: "numeric" })}</div>
        <div class="calendar-month">${this.currentCalendarDate.toLocaleDateString([], { month: "long", year: "numeric" })}</div>
      `;
    }
  }

  selectCalendarDay(year, month, day) {
    // Store the selected date
    this.selectedCalendarDate = new Date(year, month, day);

    // Re-render the notification center to update the calendar with the selected date
    const notificationCenter = document.getElementById("notificationCenter");
    if (notificationCenter) {
      const centerContent = notificationCenter.querySelector(
        ".notification-center-content"
      );
      if (centerContent) {
        centerContent.innerHTML = this.createNotificationCenter();
      }
    }
  }

  clearAllNotifications() {
    if (this.notificationHistory.length === 0) {
      return; // No notifications to clear
    }

    this.notificationHistory = [];

    // Update the notification center if it's open
    const notificationContent = document.getElementById(
      "notificationCenterContent"
    );
    if (notificationContent) {
      notificationContent.innerHTML = this.renderNotificationHistory();
    }
  }

  dismissNotification(notificationId) {
    // Convert to string for consistent comparison
    const targetId = notificationId.toString();

    // Add smooth animation before removing
    const notificationItem = document
      .querySelector(`[onclick*="${targetId}"]`)
      ?.closest(".notification-center-item");
    if (notificationItem) {
      notificationItem.style.transform = "translateX(100%)";
      notificationItem.style.opacity = "0";
      notificationItem.style.transition = "all 0.3s ease";

      setTimeout(() => {
        // Remove the specific notification from history
        this.notificationHistory = this.notificationHistory.filter(
          (notification) => notification.id.toString() !== targetId
        );

        // Update the notification center if it's open
        const notificationContent = document.getElementById(
          "notificationCenterContent"
        );
        if (notificationContent) {
          notificationContent.innerHTML = this.renderNotificationHistory();
        }
      }, 300);
    } else {
      // Fallback if animation element not found
      this.notificationHistory = this.notificationHistory.filter(
        (notification) => notification.id.toString() !== targetId
      );

      const notificationContent = document.getElementById(
        "notificationCenterContent"
      );
      if (notificationContent) {
        notificationContent.innerHTML = this.renderNotificationHistory();
      }
    }
  }

  addToNotificationHistory(title, body, icon) {
    const notification = {
      id: Date.now(),
      title,
      body,
      icon,
      timestamp: new Date(),
      read: false,
    };

    this.notificationHistory.unshift(notification);

    // Keep only the last maxNotifications
    if (this.notificationHistory.length > this.maxNotifications) {
      this.notificationHistory = this.notificationHistory.slice(
        0,
        this.maxNotifications
      );
    }

    // Update notification center if it's open
    const notificationContent = document.getElementById(
      "notificationCenterContent"
    );
    if (notificationContent) {
      notificationContent.innerHTML = this.renderNotificationHistory();
    }
  }

  renderNotificationHistory() {
    if (this.notificationHistory.length === 0) {
      return `
        <div class="no-notifications">
          <i class="fas fa-bell-slash" style="font-size: 32px; opacity: 0.3; margin-bottom: 8px;"></i>
          <div style="opacity: 0.6; font-size: 14px;">No notifications</div>
          <div style="opacity: 0.4; font-size: 12px;">You're all caught up!</div>
        </div>
      `;
    }

    return this.notificationHistory
      .map((notification) => {
        const timeAgo = this.getTimeAgo(notification.timestamp);
        const iconSrc = this.getNotificationIcon(notification.icon);
        const isRead = notification.read || false;

        return `
        <div class="notification-center-item ${isRead ? "read" : ""}">
          <div class="notification-item-icon">
            ${iconSrc}
          </div>
          <div class="notification-item-content" onclick="windowManager.markNotificationAsRead('${notification.id}')">
            <div class="notification-item-header">
              <span class="notification-item-title">Portfolio System</span>
              <span class="notification-item-time">${timeAgo} <i class="fas fa-chevron-down"></i></span>
            </div>
            <div class="notification-item-subtitle">Re: ${notification.title}</div>
            <div class="notification-item-body">${notification.body}</div>
            <div class="notification-item-source">Portfolio • Notification</div>
          </div>
          <button class="notification-dismiss-btn" onclick="event.stopPropagation(); windowManager.dismissNotification('${notification.id}')" title="Dismiss">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
      })
      .join("");
  }

  getNotificationIcon(iconClass) {
    // Map Font Awesome icons to appropriate images
    const iconMap = {
      "fas fa-download":
        '<img src="./icons/folder.png" alt="download" style="width: 24px; height: 24px;">',
      "fas fa-check":
        '<img src="./icons/settings.png" alt="success" style="width: 24px; height: 24px;">',
      "fas fa-calendar-check":
        '<img src="./icons/name-tag/icons8-name-tag-48.png" alt="calendar" style="width: 24px; height: 24px;">',
      "fas fa-info-circle":
        '<img src="./icons/kate.png" alt="info" style="width: 24px; height: 24px;">',
      "fas fa-search":
        '<img src="./icons/terminal.png" alt="search" style="width: 24px; height: 24px;">',
    };

    return (
      iconMap[iconClass] ||
      '<img src="./icons/folder.png" alt="notification" style="width: 24px; height: 24px;">'
    );
  }

  getTimeAgo(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  markNotificationAsRead(notificationId) {
    const notification = this.notificationHistory.find(
      (n) => n.id.toString() === notificationId
    );
    if (notification && !notification.read) {
      notification.read = true;

      // Update the notification center if it's open
      const notificationContent = document.getElementById(
        "notificationCenterContent"
      );
      if (notificationContent) {
        notificationContent.innerHTML = this.renderNotificationHistory();
      }
    }
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
    // Disabled for professional portfolio design
    // Keep clean profile name instead of casual greeting
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
    // Random fact display disabled for production
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
          // Location access denied, using default location
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
          // Weather update failed silently
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
            bottom: 80px;
            right: 20px;
            background: rgba(43, 43, 43, 0.95);
            backdrop-filter: blur(30px);
            color: white;
            padding: 0;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.08);
            z-index: 10000;
            width: 364px;
            animation: slideInNotification 0.3s ease-out;
            font-family: 'Segoe UI', system-ui, sans-serif;
        }
        
        @keyframes slideInNotification {
            from {
                opacity: 0;
                transform: translateY(100%);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .notification-header {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px 16px 8px 16px;
        }
        
        .notification-avatar {
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        
        .notification-content {
            flex: 1;
            min-width: 0;
        }
        
        .notification-sender {
            font-weight: 600;
            font-size: 15px;
            color: #ffffff;
            margin-bottom: 2px;
        }
        
        .notification-subject {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 4px;
        }
        
        .notification-body {
            font-size: 14px;
            color: #ffffff;
            line-height: 1.3;
            margin-bottom: 2px;
        }
        
        .notification-source {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        }
        
        .notification-actions {
            display: flex;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.02);
            border-radius: 0 0 8px 8px;
        }
        
        .notification-action {
            flex: 1;
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.8);
            padding: 12px;
            cursor: pointer;
            font-size: 12px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            transition: background-color 0.15s ease;
        }
        
        .notification-action:hover {
            background: rgba(255, 255, 255, 0.08);
        }
        
        .notification-action:not(:last-child) {
            border-right: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .notification-action i {
            font-size: 16px;
            margin-bottom: 2px;
        }

        /* Notification Center & Calendar */
        #notificationCenter {
            position: fixed;
            bottom: 70px;
            right: 20px;
            width: 400px;
            max-height: 80vh;
            background: rgba(43, 43, 43, 0.96);
            backdrop-filter: blur(30px);
            border-radius: 12px;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.08);
            z-index: 10001;
            animation: slideInFromBottom 0.3s ease-out;
            font-family: 'Segoe UI', system-ui, sans-serif;
            color: white;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        @keyframes slideInFromBottom {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .notification-center {
            padding: 20px 20px 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            flex-shrink: 0;
        }

        .notification-center-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }

        .notification-center-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }

        .notification-actions {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .notification-action-btn {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            transition: background-color 0.15s ease;
        }

        .notification-action-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }

        .notification-center-content {
            max-height: 250px;
            overflow-y: auto;
            flex-shrink: 1;
            padding: 0 20px;
            margin: 0 -20px;
        }

        .notification-center-content::-webkit-scrollbar {
            width: 8px;
        }

        .notification-center-content::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
        }

        .notification-center-content::-webkit-scrollbar-thumb {
            background: rgba(96, 165, 250, 0.3);
            border-radius: 4px;
        }

        .notification-center-content::-webkit-scrollbar-thumb:hover {
            background: rgba(96, 165, 250, 0.5);
        }

        .notification-center-item {
            display: flex;
            gap: 12px;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            position: relative;
        }

        .notification-center-item:last-child {
            border-bottom: none;
        }

        .notification-item-icon {
            flex-shrink: 0;
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .notification-item-content {
            flex: 1;
            min-width: 0;
            cursor: pointer;
            padding-right: 30px;
        }

        .notification-dismiss-btn {
            position: absolute;
            top: 12px;
            right: 0;
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            transition: all 0.15s ease;
            opacity: 0;
        }

        .notification-center-item:hover .notification-dismiss-btn {
            opacity: 1;
        }

        .notification-center-item.read {
            opacity: 0.6;
        }

        .notification-center-item.read .notification-item-title,
        .notification-center-item.read .notification-item-subtitle {
            font-weight: normal;
        }

        .notification-dismiss-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ff6b6b;
        }

        .notification-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2px;
        }

        .notification-item-title {
            font-weight: 600;
            font-size: 14px;
        }

        .notification-item-time {
            font-size: 12px;
            opacity: 0.7;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .notification-item-subtitle {
            font-size: 13px;
            opacity: 0.8;
            margin-bottom: 2px;
        }

        .notification-item-body {
            font-size: 13px;
            line-height: 1.3;
            margin-bottom: 4px;
        }

        .notification-item-source {
            font-size: 11px;
            opacity: 0.6;
            margin-bottom: 8px;
        }

        .notification-additional {
            font-size: 11px;
            opacity: 0.7;
            background: rgba(255, 255, 255, 0.08);
            padding: 2px 6px;
            border-radius: 3px;
        }

        .calendar-widget {
            padding: 16px 20px;
            flex-shrink: 0;
        }

        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }

        .calendar-nav-btn {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            padding: 8px;
            border-radius: 6px;
            transition: background-color 0.15s ease;
        }

        .calendar-nav-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }

        .calendar-title {
            text-align: center;
        }

        .calendar-date {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 2px;
        }

        .calendar-month {
            font-size: 12px;
            opacity: 0.8;
        }

        .calendar-days-header {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
            margin-bottom: 8px;
        }

        .calendar-day-header {
            text-align: center;
            font-size: 11px;
            opacity: 0.6;
            padding: 4px;
        }

        .calendar-days {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
        }

        .calendar-day {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.15s ease;
        }

        .calendar-day:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .calendar-day.today {
            background: #0078d4;
            color: white;
            font-weight: 600;
        }

        .calendar-day.selected {
            background: rgba(0, 120, 212, 0.3);
            color: white;
            border: 1px solid #0078d4;
        }

        .calendar-day.prev-month,
        .calendar-day.next-month {
            opacity: 0.3;
        }

        .no-notifications {
            text-align: center;
            padding: 40px 20px;
            opacity: 0.6;
        }

        .notification-center-item {
            cursor: pointer;
            transition: background-color 0.15s ease;
        }

        .notification-center-item:hover {
            background: rgba(255, 255, 255, 0.03);
        }
    `;
    document.head.appendChild(style);
  }

  showNotification(
    title,
    body,
    icon = "fas fa-info-circle",
    saveToHistory = true
  ) {
    // Add to notification history only if requested
    if (saveToHistory && windowManager) {
      windowManager.addToNotificationHistory(title, body, icon);
    }

    const notification = document.createElement("div");
    notification.className = "notification";
    notification.innerHTML = `
        <div class="notification-header">
            <div class="notification-avatar">
                <i class="${icon}" style="color: rgba(255,255,255,0.9); font-size: 18px;"></i>
            </div>
            <div class="notification-content">
                <div class="notification-sender">Portfolio System</div>
                <div class="notification-subject">Re: ${title}</div>
                <div class="notification-body">${body}</div>
                <div class="notification-source">Portfolio • Notification</div>
            </div>
        </div>
        <div class="notification-actions">
            <button class="notification-action" onclick="this.closest('.notification').remove()">
                <i class="fas fa-flag"></i>
                Set flag
            </button>
            <button class="notification-action" onclick="this.closest('.notification').remove()">
                <i class="fas fa-archive"></i>
                Archive
            </button>
            <button class="notification-action" onclick="this.closest('.notification').remove()">
                <i class="fas fa-times"></i>
                Dismiss
            </button>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 6 seconds (longer for Windows-style notifications)
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation =
          "slideInNotification 0.3s ease-out reverse";
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 6000);
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
  // Easter eggs removed for professional portfolio
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
      "Welcome to Katekani's Portfolio!",
      "Double-click icons to open windows, drag to move them. <br> Explore the taskbar and start menu for more features.",
      "fab fa-windows"
    );
  }, 1000);
});
