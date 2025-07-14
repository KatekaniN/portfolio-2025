class WeatherNewsWidget {
  constructor() {
    this.hoverTimeout = null;
    this.hideTimeout = null;
    this.newsPopup = null;
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

    weather.innerHTML = `<i class="fas fa-spinner fa-spin" style="color: #ffd700;"></i> <span>Loading...</span>`;

    taskbar.appendChild(weather);

    // Fetch weather data
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
      }, 10 * 60 * 1000);
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

  async fetchWeatherData(city = "Johannesburg") {
    try {
      const response = await fetch(`http://localhost:3000/api/weather/${city}`);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching weather:", error);
      throw error;
    }
  }

  async fetchNewsData() {
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
      return data;
    } catch (error) {
      console.error("Error fetching news:", error);
      throw error;
    }
  }

  updateWeatherWidget(weatherElement, data) {
    if (!data) {
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

    weatherElement.title = `${condition} in ${
      location.name
    }\nFeels like ${Math.round(current.feelslike_c)}°C\nHumidity: ${
      current.humidity
    }%`;
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
      console.log("News popup already exists, returning");
      return;
    }

    console.log("Creating news popup");
    this.newsPopup = document.createElement("div");
    this.newsPopup.className = "news-weather-popup";
    this.newsPopup.style.cssText = `
    position: fixed;
    bottom: 60px;
    left: 20px;
    width: 420px;
    height: 550px;
    background: rgba(32, 32, 32, 0.98);
    backdrop-filter: blur(20px);
    color: white;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 10000;
    animation: fadeInUp 0.2s ease-out;
    overflow: hidden;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

    this.newsPopup.innerHTML = `
    <div style="padding: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <i class="fas fa-newspaper" style="color: #0078d4;"></i>
            <span style="font-weight: 600; font-size: 14px;">News and interests</span>
        </div>
        <div id="weatherSummary" style="font-size: 12px; opacity: 0.8;">
            <i class="fas fa-spinner fa-spin"></i> Loading weather...
        </div>
    </div>
    <div style="flex: 1; overflow-y: auto; max-height: 450px;" id="newsContainer">
        <div style="padding: 16px; text-align: center;">
            <i class="fas fa-spinner fa-spin" style="color: #0078d4;"></i>
            <div style="margin-top: 8px; font-size: 12px; opacity: 0.8;">Loading news...</div>
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
      this.updateWeatherSummary(weatherData);

      const newsData = await this.fetchNewsData();
      this.updateNewsContainer(newsData);
    } catch (error) {
      console.error("Error loading popup content:", error);
    }
  }

  updateWeatherSummary(data) {
    const weatherSummary = document.getElementById("weatherSummary");
    if (!weatherSummary || !data) return;

    const { current, location } = data;
    const temp = Math.round(current.temp_c);
    const condition = current.condition.text;

    weatherSummary.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>${location.name} • ${condition}</span>
          <span style="font-weight: 600;">${temp}°C</span>
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
      <div style="padding: 20px; text-align: center; color: #cccccc;">
          <i class="fas fa-newspaper" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
          <div style="font-size: 14px; margin-bottom: 8px;">No news articles available</div>
          <div style="font-size: 12px; opacity: 0.6;">Please try again later</div>
      </div>
  `;
      return;
    }

    const articles = data.articles.slice(0, 5);
    console.log("About to render", articles.length, "articles");

    const fallbackImage =
      "./icons/news.png"

    newsContainer.innerHTML = articles
      .map((article, index) => {
        const imageUrl = article.urlToImage || fallbackImage;

        return `
      <div style="
          padding: 12px 16px; 
          border-bottom: 1px solid rgba(255, 255, 255, 0.05); 
          cursor: pointer; 
          transition: background 0.2s ease;
          border-radius: 4px;
          margin: 2px 4px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
      " 
           onmouseover="this.style.background='rgba(255,255,255,0.08)'" 
           onmouseout="this.style.background='transparent'"
           onclick="window.open('${article.url}', '_blank')">
          
          <div style="
              flex-shrink: 0;
              width: 80px;
              height: 60px;
              border-radius: 6px;
              overflow: hidden;
              background: rgba(255,255,255,0.1);
          ">
              <img src="${imageUrl}" 
                   alt="News thumbnail"
                   style="
                       width: 100%;
                       height: 100%;
                       object-fit: cover;
                       transition: opacity 0.3s ease;
                   "
                   onerror="this.src='${fallbackImage}'"
                   onload="this.style.opacity='1'"
                   onloadstart="this.style.opacity='0.5'">
          </div>
          
          <div style="flex: 1; min-width: 0;">
              <div style="
                  font-size: 13px; 
                  line-height: 1.4; 
                  margin-bottom: 8px; 
                  font-weight: 500;
                  color: #ffffff;
                  display: -webkit-box;
                  -webkit-line-clamp: 2;
                  -webkit-box-orient: vertical;
                  overflow: hidden;
              ">
                  ${article.title}
              </div>
              
              ${
                article.description
                  ? `
                  <div style="
                      font-size: 11px;
                      line-height: 1.3;
                      color: rgba(255,255,255,0.7);
                      margin-bottom: 8px;
                      display: -webkit-box;
                      -webkit-line-clamp: 2;
                      -webkit-box-orient: vertical;
                      overflow: hidden;
                  ">
                      ${
                        article.description.length > 100
                          ? article.description.substring(0, 100) + "..."
                          : article.description
                      }
                  </div>
              `
                  : ""
              }
              
              <div style="
                  font-size: 11px; 
                  opacity: 0.6; 
                  display: flex; 
                  justify-content: space-between;
                  color: #cccccc;
              ">
                  <span>${article.source.name}</span>
                  <span>${this.formatTime(article.publishedAt)}</span>
              </div>
          </div>
      </div>
    `;
      })
      .join("");

    console.log("News container updated with fallback images");
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
    const existingPopup = document.querySelector(".weather-popup");
    if (existingPopup) {
      existingPopup.remove();
    }

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
    this.loadDetailedWeather(popup);

    setTimeout(() => {
      if (popup.parentElement) {
        popup.remove();
      }
    }, 10000);
  }

  async loadDetailedWeather(popup) {
    try {
      const data = await this.fetchWeatherData();
      const content = popup.querySelector(".detailed-weather-content");

      if (content && data) {
        const { current, location } = data;

        content.innerHTML = `
              <div style="text-align: center; margin-bottom: 16px;">
                  <div style="font-size: 24px; margin-bottom: 8px;">
                      ${Math.round(current.temp_f)}°F (${Math.round(
          current.temp_c
        )}°C)
                  </div>
                  <div style="opacity: 0.8;">${current.condition.text}</div>
                  <div style="font-size: 12px; opacity: 0.6;">${
                    location.name
                  }, ${location.country}</div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px;">
                  <div><strong>Feels like:</strong><br>${Math.round(
                    current.feelslike_f
                  )}°F</div>
                  <div><strong>Humidity:</strong><br>${current.humidity}%</div>
                  <div><strong>Wind:</strong><br>${current.wind_mph} mph ${
          current.wind_dir
        }</div>
                  <div><strong>Visibility:</strong><br>${
                    current.vis_miles
                  } miles</div>
                  <div><strong>UV Index:</strong><br>${current.uv}</div>
                  <div><strong>Pressure:</strong><br>${
                    current.pressure_in
                  } in</div>
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
  }
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
@keyframes fadeInUp {
  from {
      opacity: 0;
      transform: translateY(20px);
  }
  to {
      opacity: 1;
      transform: translateY(0);
  }
}

@keyframes fadeOutDown {
  from {
      opacity: 1;
      transform: translateY(0);
  }
  to {
      opacity: 0;
      transform: translateY(20px);
  }
}

@keyframes slideInWeather {
  from {
      opacity: 0;
      transform: translateX(20px);
  }
  to {
      opacity: 1;
      transform: translateX(0);
  }
}
`;
document.head.appendChild(style);

// Initialize the weather news widget
new WeatherNewsWidget();
