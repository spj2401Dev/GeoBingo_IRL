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
        this.broadcast(`${message}`);
      });
    });

    console.log(
      `WebSocket server is running on port ${this.wss.options.port}`
    );
  }

  broadcast(data, sender) {
    this.wss.clients.forEach((client) => {
      if (client !== sender) {
        client.send(data);
      }
    });
  }
}

const webSocketService = new WebSocketService(port);
export default webSocketService;