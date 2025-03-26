const express = require('express');

const hostname = '127.0.0.1';
const port = 3000;

// Initialize Express application
const app = express();

// Define route handler for root path ('/')
app.get('/', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello, World!\n');
});

// Define route handler for '/evening' path
app.get('/evening', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Good evening');
});

// Start the server
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});