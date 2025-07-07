import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ExpressServerTransport } from '@modelcontextprotocol/sdk/server/express.js';
import { z } from 'zod';
import express from 'express';

// Create an Express web server application
const app = express();
// This is the port Render will give your service
const port = process.env.PORT || 3000;

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
    const geocodeResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
    const geocodeData = await geocodeResponse.json();

    if (!geocodeData.results || geocodeData.results.length === 0) {
      return { content: [{ type: 'text', text: `City ${city} not found.` }] };
    }

    const { latitude, longitude } = geocodeData.results[0];
    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,rain,showers,cloud_cover,apparent_temperature`);
    const weatherData = await weatherResponse.json();

    return { content: [{ type: 'text', text: JSON.stringify(weatherData.current, null, 2) }] };
  }
);

// Use the Express transport instead of the Stdio transport
const transport = new ExpressServerTransport();
server.connect(transport);

// Tell the Express app to use the MCP transport's middleware at the /mcp endpoint
app.use('/mcp', transport.middleware);

// Add a health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Start listening for web requests
app.listen(port, () => {
  console.log(`Weather MCP server listening on port ${port}`);
});
