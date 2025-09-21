class WeatherNewsWidget {
  constructor() {
    this.hoverTimeout = null;
    this.hideTimeout = null;
    this.newsPopup = null;

    // Cache configuration
    this.cache = {
      weather: {
        data: null,
        timestamp: null,
        expiry: 30 * 60 * 1000, // 10 minutes for weather
      },
      news: {
        data: null,
        timestamp: null,
        expiry: 30 * 60 * 1000, // 30 minutes for news
      },
    };

    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.addWeatherWidget()
      );
    } else {
      this.addWeatherWidget();
    }
  }

  async addWeatherWidget() {
    // Make sure taskbar exists
    const taskbar = document.querySelector(".taskbar");
    if (!taskbar) {
      setTimeout(() => this.addWeatherWidget(), 100);
      return;
    }

    // Load cache from localStorage on initialization
    this.loadCacheFromStorage();

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
      padding: 6px 12px;
      border-radius: 8px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
     
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      font-weight: 500;
  `;

    weather.innerHTML = `
      <div style="
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
      ">
        <i class="fas fa-spinner fa-spin" style="color: white; font-size: 10px;"></i>
      </div>
      <span style="font-weight: 500;">Loading...</span>
    `;

    taskbar.appendChild(weather);

    // Fetch weather data (will use cache if available)
    try {
      const weatherData = await this.fetchWeatherData();
      this.updateWeatherWidget(weather, weatherData);

      // Set up periodic updates (but still respect cache)
      setInterval(
        async () => {
          try {
            const updatedData = await this.fetchWeatherData();
            this.updateWeatherWidget(weather, updatedData);
          } catch (error) {
            console.log("Weather update failed:", error);
          }
        },
        15 * 60 * 1000 // Check every 15 minutes (cache will prevent unnecessary API calls)
      );
    } catch (error) {
      console.error("Weather fetch failed:", error);
      this.updateWeatherWidget(weather, null);
    }

    // Add hover event listeners for news popup
    weather.addEventListener("mouseenter", () => {
      clearTimeout(this.hideTimeout);
      this.hoverTimeout = setTimeout(() => {
        this.showNewsPopup();
      }, 500);
    });

    weather.addEventListener("mouseleave", () => {
      clearTimeout(this.hoverTimeout);
      this.hideTimeout = setTimeout(() => {
        this.hideNewsPopup();
      }, 300);
    });

    // Add click handler for detailed weather
    weather.addEventListener("click", () => {
      this.showDetailedWeather();
    });
  }

  // Cache management methods
  isCacheValid(cacheType) {
    const cache = this.cache[cacheType];
    if (!cache.data || !cache.timestamp) {
      return false;
    }

    const now = Date.now();
    return now - cache.timestamp < cache.expiry;
  }

  setCache(cacheType, data) {
    this.cache[cacheType].data = data;
    this.cache[cacheType].timestamp = Date.now();

    // Also store in localStorage for persistence across page reloads
    try {
      const cacheData = {
        data: data,
        timestamp: this.cache[cacheType].timestamp,
      };
      localStorage.setItem(
        `weatherWidget_${cacheType}`,
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.log("Failed to store cache in localStorage:", error);
    }
  }

  loadCacheFromStorage() {
    try {
      ["weather", "news"].forEach((cacheType) => {
        const stored = localStorage.getItem(`weatherWidget_${cacheType}`);
        if (stored) {
          const cacheData = JSON.parse(stored);
          const now = Date.now();

          // Check if stored cache is still valid
          if (now - cacheData.timestamp < this.cache[cacheType].expiry) {
            this.cache[cacheType].data = cacheData.data;
            this.cache[cacheType].timestamp = cacheData.timestamp;
          } else {
            // Remove expired cache from localStorage
            localStorage.removeItem(`weatherWidget_${cacheType}`);
          }
        }
      });
    } catch (error) {
      console.log("Failed to load cache from localStorage:", error);
    }
  }

  async fetchWeatherData(city = "Johannesburg") {
    // Check cache first
    if (this.isCacheValid("weather")) {
      console.log("Using cached weather data");
      return this.cache.weather.data;
    }

    console.log("Fetching fresh weather data from API");
    try {
      const response = await fetch(`http://localhost:3000/api/weather/${city}`);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      const data = await response.json();

      // Cache the fresh data
      this.setCache("weather", data);

      return data;
    } catch (error) {
      console.error("Error fetching weather:", error);

      // If we have expired cache data, use it as fallback
      if (this.cache.weather.data) {
        console.log("Using expired cache as fallback");
        return this.cache.weather.data;
      }

      throw error;
    }
  }

  async fetchNewsData() {
    // Check cache first
    if (this.isCacheValid("news")) {
      console.log("Using cached news data");
      return this.cache.news.data;
    }

    console.log("Fetching fresh news data from API");
    try {
      const response = await fetch(
        "http://localhost:3000/api/news?country=za&pageSize=5"
      );
      console.log("News API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("News API error response:", errorText);
        throw new Error(`News API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("News data received:", data);

      // Cache the fresh data
      this.setCache("news", data);

      return data;
    } catch (error) {
      console.error("Error fetching news:", error);

      // If we have expired cache data, use it as fallback
      if (this.cache.news.data) {
        console.log("Using expired news cache as fallback");
        return this.cache.news.data;
      }

      throw error;
    }
  }

  updateWeatherWidget(weatherElement, data) {
    if (!data) {
      weatherElement.innerHTML = `
        <div style="
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, rgba(156, 163, 175, 0.3) 0%, rgba(107, 114, 128, 0.2) 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <i class="fas fa-cloud" style="color: #9ca3af; font-size: 10px;"></i>
        </div>
        <span style="color: rgba(255, 255, 255, 0.7);">Weather unavailable</span>
      `;
      return;
    }

    const { current, location } = data;
    const temp = Math.round(current.temp_c);
    const condition = current.condition.text;
    const icon = this.getWeatherIcon(current.condition.code, current.is_day);

    weatherElement.innerHTML = `
      <div style="
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(96, 165, 250, 0.3);
      ">
        <i class="${icon.class}" style="color: ${icon.color}; font-size: 10px;"></i>
      </div>
      <span style="font-weight: 500;">${temp}°C</span>
      <span style="opacity: 0.8; font-weight: 400;">${location.name}</span>
  `;

    weatherElement.title = `${condition} in ${
      location.name
    }\nFeels like ${Math.round(current.feelslike_c)}°C\nHumidity: ${
      current.humidity
    }%\nClick for detailed weather`;
  }

  getWeatherIcon(conditionCode, isDay) {
    const icons = {
      1000: {
        day: { class: "fas fa-sun", color: "#ffd700" },
        night: { class: "fas fa-moon", color: "#f0f0f0" },
      },
      1003: {
        day: { class: "fas fa-cloud-sun", color: "#87ceeb" },
        night: { class: "fas fa-cloud-moon", color: "#d3d3d3" },
      },
      1006: { class: "fas fa-cloud", color: "#87ceeb" },
      1009: { class: "fas fa-cloud", color: "#696969" },
      1063: { class: "fas fa-cloud-rain", color: "#4682b4" },
      1180: { class: "fas fa-cloud-rain", color: "#4682b4" },
      1183: { class: "fas fa-cloud-rain", color: "#4682b4" },
      1186: { class: "fas fa-cloud-rain", color: "#4682b4" },
      1189: { class: "fas fa-cloud-rain", color: "#4682b4" },
      1192: { class: "fas fa-cloud-showers-heavy", color: "#191970" },
      1195: { class: "fas fa-cloud-showers-heavy", color: "#191970" },
      1066: { class: "fas fa-snowflake", color: "#e0e0e0" },
      1210: { class: "fas fa-snowflake", color: "#e0e0e0" },
      1213: { class: "fas fa-snowflake", color: "#e0e0e0" },
      1216: { class: "fas fa-snowflake", color: "#e0e0e0" },
      1219: { class: "fas fa-snowflake", color: "#e0e0e0" },
      1222: { class: "fas fa-snowflake", color: "#e0e0e0" },
      1225: { class: "fas fa-snowflake", color: "#e0e0e0" },
      1087: { class: "fas fa-bolt", color: "#ffd700" },
      1273: { class: "fas fa-bolt", color: "#ffd700" },
      1276: { class: "fas fa-bolt", color: "#ffd700" },
      1135: { class: "fas fa-smog", color: "#d3d3d3" },
      1147: { class: "fas fa-smog", color: "#d3d3d3" },
    };

    const iconData = icons[conditionCode];
    if (iconData) {
      if (iconData.day && iconData.night) {
        return isDay ? iconData.day : iconData.night;
      }
      return iconData;
    }
    return { class: "fas fa-cloud", color: "#87ceeb" };
  }

  async showNewsPopup() {
    console.log("showNewsPopup called");
    if (this.newsPopup) {
      console.log("Weather details popup already exists, returning");
      return;
    }

    console.log("Creating comprehensive weather details popup");
    this.newsPopup = document.createElement("div");
    this.newsPopup.className = "weather-details-popup";
    this.newsPopup.style.cssText = `
    position: fixed;
    bottom: 70px;
    left: 20px;
    width: 680px;
    height: 520px;
    background: linear-gradient(135deg, rgba(28, 32, 38, 0.95) 0%, rgba(20, 24, 28, 0.98) 100%);
    backdrop-filter: blur(30px) saturate(150%);
    color: #ffffff;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 10000;
    animation: fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    display: flex;
    flex-direction: column;
`;

    this.newsPopup.innerHTML = `
    <!-- Close button -->
    <div style="
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 100;
    ">
        <button onclick="this.parentElement.parentElement.remove()" style="
            background: rgba(255, 255, 255, 0.08);
            border: none;
            color: rgba(255, 255, 255, 0.6);
            width: 28px;
            height: 28px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        " onmouseover="this.style.background='rgba(255, 255, 255, 0.12)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.08)'">
            <i class="fas fa-times" style="font-size: 11px;"></i>
        </button>
    </div>

    <!-- Main Content -->
    <div style="
        padding: 20px;
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: 20px;
    ">
        <!-- Weather Section -->
        <div style="
            display: flex;
            gap: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        ">
            <!-- Left: Current Weather -->
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 180px;
            ">
                <div id="mainWeatherDisplay" style="text-align: center;">
                    <div style="
                        width: 64px;
                        height: 64px;
                        background: rgba(96, 165, 250, 0.1);
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 12px auto;
                    ">
                        <i class="fas fa-spinner fa-spin" style="color: #60a5fa; font-size: 24px;"></i>
                    </div>
                    <div style="font-size: 32px; font-weight: 300; margin-bottom: 4px; color: #ffffff;">
                        --°C
                    </div>
                    <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 2px;">
                        Loading...
                    </div>
                    <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5);">
                        Johannesburg
                    </div>
                </div>
            </div>

            <!-- Right: Weather Details Grid -->
            <div id="weatherDetailsGrid" style="
                flex: 1;
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                align-content: start;
            ">
                <div style="
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    padding: 12px;
                    text-align: center;
                ">
                    <div style="font-size: 10px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px; text-transform: uppercase;">FEELS LIKE</div>
                    <div style="font-size: 16px; font-weight: 600; color: #ffffff;">--°C</div>
                </div>
                <div style="
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    padding: 12px;
                    text-align: center;
                ">
                    <div style="font-size: 10px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px; text-transform: uppercase;">HUMIDITY</div>
                    <div style="font-size: 16px; font-weight: 600; color: #ffffff;">--%</div>
                </div>
                <div style="
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    padding: 12px;
                    text-align: center;
                ">
                    <div style="font-size: 10px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px; text-transform: uppercase;">WIND</div>
                    <div style="font-size: 16px; font-weight: 600; color: #ffffff;">-- km/h</div>
                </div>
                <div style="
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    padding: 12px;
                    text-align: center;
                ">
                    <div style="font-size: 10px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px; text-transform: uppercase;">VISIBILITY</div>
                    <div style="font-size: 16px; font-weight: 600; color: #ffffff;">-- km</div>
                </div>
                <div style="
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    padding: 12px;
                    text-align: center;
                ">
                    <div style="font-size: 10px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px; text-transform: uppercase;">UV INDEX</div>
                    <div style="font-size: 16px; font-weight: 600; color: #ffffff;">-</div>
                </div>
                <div style="
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    padding: 12px;
                    text-align: center;
                ">
                    <div style="font-size: 10px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px; text-transform: uppercase;">PRESSURE</div>
                    <div style="font-size: 16px; font-weight: 600; color: #ffffff;">---- mb</div>
                </div>
            </div>
        </div>

        <!-- News Section -->
        <div style="
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        ">
            <!-- News Header -->
            <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
            ">
                <div style="
                    width: 20px; 
                    height: 20px; 
                    background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <i class="fas fa-newspaper" style="color: white; font-size: 9px;"></i>
                </div>
                <span style="font-weight: 600; font-size: 15px; color: #ffffff;">Latest News</span>
                <span style="font-size: 11px; color: rgba(255, 255, 255, 0.4); margin-left: auto;" id="newsUpdateTime">Updated now</span>
            </div>
            
            <!-- News Content -->
            <div id="newsContainer" style="
                flex: 1;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 8px;
            ">
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 200px;
                    flex-direction: column;
                    gap: 12px;
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        background: rgba(96, 165, 250, 0.1);
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <i class="fas fa-spinner fa-spin" style="color: #60a5fa; font-size: 16px;"></i>
                    </div>
                    <div style="font-size: 13px; font-weight: 500; color: rgba(255, 255, 255, 0.8);">
                        Loading latest news...
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

    document.body.appendChild(this.newsPopup);
    console.log("News popup added to document");

    setTimeout(() => {
      this.loadPopupContent();
    }, 50);

    this.newsPopup.addEventListener("mouseenter", () => {
      clearTimeout(this.hideTimeout);
    });

    this.newsPopup.addEventListener("mouseleave", () => {
      this.hideTimeout = setTimeout(() => {
        this.hideNewsPopup();
      }, 300);
    });
  }

  async loadPopupContent() {
    try {
      const weatherData = await this.fetchWeatherData();
      this.updateComprehensiveWeatherDisplay(weatherData);

      const newsData = await this.fetchNewsData();
      this.updateNewsContainer(newsData);
    } catch (error) {
      console.error("Error loading popup content:", error);
    }
  }

  updateComprehensiveWeatherDisplay(data) {
    const mainDisplay = document.getElementById("mainWeatherDisplay");
    const detailsGrid = document.getElementById("weatherDetailsGrid");

    if (!mainDisplay || !detailsGrid || !data) return;

    const { current, location } = data;
    const temp = Math.round(current.temp_c);
    const condition = current.condition.text;
    const icon = this.getWeatherIcon(current.condition.code, current.is_day);

    // Update main display
    mainDisplay.innerHTML = `
        <div style="
            width: 64px;
            height: 64px;
            background: rgba(96, 165, 250, 0.1);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 12px auto;
        ">
            <i class="${icon.class}" style="color: ${icon.color}; font-size: 24px;"></i>
        </div>
        <div style="font-size: 32px; font-weight: 300; margin-bottom: 4px; color: #ffffff;">
            ${temp}°C
        </div>
        <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 2px;">
            ${condition}
        </div>
        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5);">
            ${location.name}
        </div>
    `;

    // Update details grid
    detailsGrid.innerHTML = `
        <div style="
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            padding: 12px;
            text-align: center;
        ">
            <div style="font-size: 10px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px; text-transform: uppercase;">FEELS LIKE</div>
            <div style="font-size: 16px; font-weight: 600; color: #ffffff;">${Math.round(current.feelslike_c)}°C</div>
        </div>
        <div style="
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            padding: 12px;
            text-align: center;
        ">
            <div style="font-size: 10px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px; text-transform: uppercase;">HUMIDITY</div>
            <div style="font-size: 16px; font-weight: 600; color: #ffffff;">${current.humidity}%</div>
        </div>
        <div style="
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            padding: 12px;
            text-align: center;
        ">
            <div style="font-size: 10px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px; text-transform: uppercase;">WIND</div>
            <div style="font-size: 16px; font-weight: 600; color: #ffffff;">${Math.round(current.wind_kph)} km/h</div>
        </div>
        <div style="
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            padding: 12px;
            text-align: center;
        ">
            <div style="font-size: 10px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px; text-transform: uppercase;">VISIBILITY</div>
            <div style="font-size: 16px; font-weight: 600; color: #ffffff;">${Math.round(current.vis_km)} km</div>
        </div>
        <div style="
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            padding: 12px;
            text-align: center;
        ">
            <div style="font-size: 10px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px; text-transform: uppercase;">UV INDEX</div>
            <div style="font-size: 16px; font-weight: 600; color: #ffffff;">${current.uv || 0}</div>
        </div>
        <div style="
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            padding: 12px;
            text-align: center;
        ">
            <div style="font-size: 10px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px; text-transform: uppercase;">PRESSURE</div>
            <div style="font-size: 16px; font-weight: 600; color: #ffffff;">${Math.round(current.pressure_mb)} mb</div>
        </div>
    `;
  }

  updateNewsContainer(data) {
    console.log(
      "updateNewsContainer called with articles:",
      data?.articles?.length
    );

    const newsContainer = this.newsPopup?.querySelector("#newsContainer");
    console.log("newsContainer element found:", !!newsContainer);

    if (!newsContainer) {
      console.log("Missing newsContainer element");
      return;
    }

    if (!data || !data.articles || data.articles.length === 0) {
      console.log("No articles available");
      newsContainer.innerHTML = `
      <div style="padding: 40px 24px; text-align: center;">
          <div style="
              width: 48px;
              height: 48px;
              background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%);
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 16px auto;
              border: 1px solid rgba(239, 68, 68, 0.2);
          ">
              <i class="fas fa-newspaper" style="color: #f87171; font-size: 18px;"></i>
          </div>
          <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; color: #ffffff;">
              No news available
          </div>
          <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">
              Please check your connection and try again
          </div>
      </div>
  `;
      return;
    }

    const articles = data.articles.slice(0, 8); 
    console.log("About to render", articles.length, "articles");

    const fallbackImage = "./icons/news.png";

    newsContainer.innerHTML = articles
      .map((article, index) => {
        const imageUrl = article.urlToImage || fallbackImage;

        return `
      <div class="news-article" style="
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 8px;
      " 
           onmouseover="this.style.background='rgba(255, 255, 255, 0.04)'" 
           onmouseout="this.style.background='rgba(255, 255, 255, 0.02)'"
           onclick="window.open('${article.url}', '_blank')">
          
          <!-- Thumbnail -->
          <div style="
              flex-shrink: 0;
              width: 56px;
              height: 56px;
              border-radius: 6px;
              overflow: hidden;
              background: rgba(96, 165, 250, 0.05);
          ">
              <img src="${imageUrl}" 
                   alt="News thumbnail"
                   style="
                       width: 100%;
                       height: 100%;
                       object-fit: cover;
                   "
                   onerror="this.src='${fallbackImage}'">
          </div>
          
          <!-- Content -->
          <div style="flex: 1; min-width: 0;">
              <div style="
                  font-size: 13px; 
                  line-height: 1.3; 
                  margin-bottom: 6px; 
                  font-weight: 500;
                  color: #ffffff;
                  display: -webkit-box;
                  -webkit-line-clamp: 2;
                  -webkit-box-orient: vertical;
                  overflow: hidden;
              ">
                  ${article.title}
              </div>
              
              <!-- Meta info -->
              <div style="
                  display: flex; 
                  align-items: center;
                  gap: 8px;
                  font-size: 11px; 
                  color: rgba(255, 255, 255, 0.4);
              ">
                  <span style="font-weight: 500;">${article.source.name}</span>
                  <span>•</span>
                  <span>${this.formatTime(article.publishedAt)}</span>
              </div>
          </div>
      </div>
    `;
      })
      .join("");

    // Update news header timestamp
    const newsUpdateElement = document.getElementById("newsUpdateTime");
    if (newsUpdateElement) {
      const now = new Date();
      newsUpdateElement.textContent = `Updated ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    console.log("News container updated with comprehensive design");
  }

  formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 24) {
      return date.toLocaleDateString();
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return "Just now";
    }
  }

  hideNewsPopup() {
    if (this.newsPopup) {
      this.newsPopup.style.animation = "fadeOutDown 0.2s ease-out";
      setTimeout(() => {
        if (this.newsPopup && this.newsPopup.parentElement) {
          this.newsPopup.remove();
          this.newsPopup = null;
        }
      }, 200);
    }
  }

  showDetailedWeather() {
    // Since we now have a comprehensive popup, just trigger the news popup
    this.showNewsPopup();
  }
}

const style = document.createElement("style");
style.textContent = `
@keyframes fadeInUp {
  from {
      opacity: 0;
      transform: translateY(24px) scale(0.95);
  }
  to {
      opacity: 1;
      transform: translateY(0) scale(1);
  }
}

@keyframes fadeOutDown {
  from {
      opacity: 1;
      transform: translateY(0) scale(1);
  }
  to {
      opacity: 0;
      transform: translateY(24px) scale(0.95);
  }
}

@keyframes slideInWeather {
  from {
      opacity: 0;
      transform: translateX(20px) scale(0.95);
  }
  to {
      opacity: 1;
      transform: translateX(0) scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
      opacity: 1;
  }
  50% {
      opacity: 0.5;
  }
}
`;
document.head.appendChild(style);

// Initialize the widget when the script loads
new WeatherNewsWidget();
