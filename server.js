// Import the Express.js framework
const express = require('express');

// Define server configuration constants
const hostname = '127.0.0.1';
const port = 3000;

// Create an Express application instance
const app = express();

// Disable the 'x-powered-by' header for security best practices
app.disable('x-powered-by');

// Define route handler for the root endpoint ('/')
// This endpoint returns 'Hello, World!' as specified in F-002-RQ-003
app.get('/', (req, res) => {
  res.status(200);
  res.setHeader('Content-Type', 'text/plain');
  res.send('Hello, World!\n');
});

// Define route handler for the evening endpoint ('/evening')
// This endpoint returns 'Good evening' as specified in F-002-RQ-004
app.get('/evening', (req, res) => {
  res.status(200);
  res.setHeader('Content-Type', 'text/plain');
  res.send('Good evening');
});

// Start the server and listen on the specified hostname and port
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});