const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

// Replace with your WebSocket server URL and secret key
const wsUrl = 'ws://localhost:3000'; // Modify the port if necessary
const secretKey = 'webKey1'; // The secret key used for JWT
const command = 'exec:68a971930610d70a92bcc3f8588dd2f161c2b35cd4e670e95a7e31a71036b5c1:df'; // Example: "start" command for a specific container

// Generate JWT token for authentication // You can pass user-specific payload instead of an empty object

// Create a WebSocket connection to the server
const ws = new WebSocket(wsUrl);

// Open WebSocket connection
ws.on('open', () => {
    console.log('Connected to server');

    // Send the authentication token and command
    const message = `auth:${secretKey}-${command}`;
    console.log(`Sending: ${message}`);
    ws.send(message);
    console.log(`Sent: ${message}`);
});

// Listen for responses from the server
ws.on('message', (data) => {
    console.log(`Received from server: ${data}`);
});

// Handle WebSocket connection close
ws.on('close', () => {
    console.log('Connection closed');
});

// Handle WebSocket errors
ws.on('error', (err) => {
    console.error(`WebSocket error: ${err.message}`);
});
