import { WebSocketServer } from "ws";
import config from '../../config.json' assert { type: 'json' };

class WebSocketService {
  constructor(port) {
    this.wss = new WebSocketServer({ port });
    this.initialize();
  }

  initialize() {
    this.wss.on("connection", (ws) => {
      ws.on("message", (message) => {
        console.log("Received:", message);
        this.broadcast(`Broadcast: ${message}`);
      });
    });

    console.log(
      `WebSocket server is running on ws://${config.WebSocket.Ip}:${this.wss.options.port}`
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

const webSocketService = new WebSocketService(config.WebSocket.Port);
export default webSocketService;