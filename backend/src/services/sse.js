// TrustBite — Server-Sent Events (SSE) Manager

let clients = [];

/**
 * Register a new SSE client
 * @param {object} req - Express Request
 * @param {object} res - Express Response
 */
function addClient(req, res) {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Add this client to the clients list
  clients.push(res);

  // Send an initial handshake event
  res.write(`event: connected\ndata: {"message": "TrustBite real-time connected"}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
}

/**
 * Broadcast an event to all connected clients
 * @param {string} event - The event name
 * @param {object} data - The event payload
 */
function emitEvent(event, data) {
  const payload = JSON.stringify(data);
  clients.forEach(client => {
    client.write(`event: ${event}\ndata: ${payload}\n\n`);
  });
}

module.exports = {
  addClient,
  emitEvent,
};
