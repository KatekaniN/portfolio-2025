// routes/weather-news.js
const express = require("express");
const router = express.Router();

// Weather endpoint
router.get("/weather/:city?", async (req, res) => {
  try {
    const city = req.params.city || "Johannesburg";
    const weatherApiKey = process.env.WEATHER_API_KEY;

    if (!weatherApiKey) {
      return res.status(500).json({
        error: "Weather API key not configured",
      });
    }

    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${city}&aqi=no`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Weather API error:", error);
    res.status(500).json({
      error: "Failed to fetch weather data",
      message: error.message,
    });
  }
});

// News endpoint using NewsData.io
router.get("/news", async (req, res) => {
  try {
    const newsDataApiKey = process.env.NEWSDATA_API_KEY;
    const country = req.query.country || "za";
    const pageSize = req.query.pageSize || 7;

    console.log(`NewsData.io request for country: ${country}`);

    if (!newsDataApiKey) {
      return res.status(500).json({
        error: "NewsData API key not configured",
      });
    }

    // NewsData.io API endpoint
    const apiUrl = `https://newsdata.io/api/1/latest?apikey=${newsDataApiKey}&country=${country}&size=${pageSize}&category= world,top,business,technology`;

    console.log("Calling NewsData.io API...");

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NewsData.io API error response:", errorText);
      throw new Error(
        `NewsData.io API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    console.log(
      "NewsData.io response:",
      data.status,
      "Total results:",
      data.totalResults
    );


    const convertedData = {
      status: "ok",
      totalResults: data.totalResults || 0,
      articles:
        data.results?.map((article) => ({
          source: {
            id: article.source_id || null,
            name: article.source_id || "Unknown Source",
          },
          title: article.title || "No title",
          description: article.description || article.content || "",
          url: article.link || "#",
          publishedAt: article.pubDate || new Date().toISOString(),
          urlToImage: article.image_url || null,
          author: article.creator ? article.creator.join(", ") : null,
        })) || [],
    };

    console.log("Converted articles:", convertedData.articles.length);
    res.json(convertedData);
  } catch (error) {
    console.error("NewsData.io API error:", error);
    res.status(500).json({
      error: "Failed to fetch news data",
      message: error.message,
    });
  }
});

module.exports = router;
