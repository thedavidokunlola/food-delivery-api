// Server entry point — starts Express on the configured port

import app from './app';
import { CONFIG } from './config';

const port = CONFIG.api.port;

app.listen(port, () => {
  console.log(`🚀 Lagos Food Delivery API running on port ${port}`);
  console.log(`📍 Base URL: http://localhost:${port}/api/${CONFIG.api.version}`);
  console.log(`💚 Health check: http://localhost:${port}/health`);
});
