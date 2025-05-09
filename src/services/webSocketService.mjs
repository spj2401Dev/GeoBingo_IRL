import { WebSocketServer } from "ws";
import dotenv from 'dotenv';

dotenv.config();
const port = process.env.WEBSOCKET_PORT || 8000;

class WebSocketService {
  constructor(port) {
    this.wss = new WebSocketServer({ port });
    this.initialize();
  }

  initialize() {
    this.wss.on("connection", (ws) => {
      ws.on("message", (message) => {
        let parsed;
        try {
          parsed = JSON.parse(message);
        } catch {
          return;
        }
        if (parsed && parsed.event) {
          this.handleEvent(parsed.event, parsed.data, ws);
        }
      });
    });
    console.log(
      `WebSocket server is running on port ${this.wss.options.port}`
    );
  }

  handleEvent(event, data, ws) {
    if (event === 'CHAT_MESSAGE') {
      this.sendToAll('CHAT_MESSAGE', data);
      return;
    }
    // Default: broadcast to all except sender
    this.broadcastEvent(event, data, ws);
  }

  broadcastEvent(event, data, sender) {
    const payload = JSON.stringify({ event, data });
    this.wss.clients.forEach((client) => {
      if (client !== sender && client.readyState === 1) {
        client.send(payload);
      }
    });
  }

  sendToAll(event, data) {
    const payload = JSON.stringify({ event, data });
    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(payload);
      }
    });
  }
}

const webSocketService = new WebSocketService(port);
export default webSocketService;