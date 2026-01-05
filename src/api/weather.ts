import { Router } from "express";
import { clerkMiddleware } from "@clerk/express";

const router = Router();

// Use clerk middleware for authentication
router.use(clerkMiddleware());

const DATA_API_URL = process.env.DATA_API_URL || "http://localhost:8001";

interface WeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    temperature: number;
    humidity: number;
    cloudCover: number;
    windSpeed: number;
    weatherCode: number;
    weatherDescription: string;
  };
  solar: {
    condition: string;
    solarOutput: string;
    advice: string;
  };
  hourly: {
    cloudCover: number[];
    directRadiation: number[];
  };
  timestamp: string;
}

router.get("/", async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: "Latitude and longitude are required",
      });
    }

    // Call Data API to fetch weather data
    // Robustly handle whether /api is included or not in env var
    const envDataApiUrl = DATA_API_URL;
    const cleanUrl = envDataApiUrl.replace(/\/+$/, "");
    const apiBase = cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;

    const dataApiUrl = `${apiBase}/weather?latitude=${latitude}&longitude=${longitude}`;

    const response = await fetch(dataApiUrl);
    if (!response.ok) {
      throw new Error(`Data API error: ${response.statusText}`);
    }

    const weatherData = await response.json() as WeatherResponse;

    // Add backend processing/caching/enrichment here if needed
    const enrichedResponse = {
      ...weatherData,
      // Add any backend-specific data here
      fetchedAt: new Date().toISOString(),
    };

    res.status(200).json(enrichedResponse);
  } catch (error) {
    console.error("Weather endpoint error:", error);
    res.status(500).json({
      error: "Failed to fetch weather data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
