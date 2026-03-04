import { describe, expect, it } from "vitest";
import axios from "axios";

describe("Football Data API", () => {
  it("should fetch standings from football-data.org with valid token", async () => {
    const token = process.env.FOOTBALL_DATA_API_KEY;
    expect(token).toBeDefined();

    try {
      const response = await axios.get(
        "https://api.football-data.org/v4/competitions/BSA/standings",
        {
          headers: {
            "X-Auth-Token": token,
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.standings).toBeDefined();
      expect(Array.isArray(response.data.standings)).toBe(true);
      expect(response.data.standings.length).toBeGreaterThan(0);
      expect(response.data.standings[0].table).toBeDefined();
      expect(Array.isArray(response.data.standings[0].table)).toBe(true);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `API request failed: ${error.response?.status} - ${error.response?.statusText}`
        );
      }
      throw error;
    }
  });

  it("should fetch matches from football-data.org with valid token", async () => {
    const token = process.env.FOOTBALL_DATA_API_KEY;
    expect(token).toBeDefined();

    try {
      const response = await axios.get(
        "https://api.football-data.org/v4/competitions/BSA/matches",
        {
          params: {
            status: "SCHEDULED",
          },
          headers: {
            "X-Auth-Token": token,
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.matches).toBeDefined();
      expect(Array.isArray(response.data.matches)).toBe(true);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `API request failed: ${error.response?.status} - ${error.response?.statusText}`
        );
      }
      throw error;
    }
  });
});
