import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
  name: "weather-mcp-server",
  version: "1.0.0",
});

server.tool(
  'get-weather',
  'Tool to get the weather for a city',
  {
    city: z.string().describe('The name of the city to get the weather for'),
  },
  async ({ city }) => {
    // get coordinates for the city
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=10&language=en&format=json`);
    const data = await response.json();

    // handle city not found
    if (data.results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `City ${city} not found.`,
          }
        ]
      }
    }

    // get the weather data using the coordinates
    const { latitude, longitude } = data.results[0];

    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,rain,showers,cloud_cover,apparent_temperature`)

    const weatherData = await weatherResponse.json();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(weatherData, null, 2),
        }
      ]
    }
  }
);

const transport = new StdioServerTransport();
server.connect(transport);
