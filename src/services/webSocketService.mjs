import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';

dotenv.config();
const port = Number.parseInt(process.env.WEBSOCKET_PORT || '8080', 10);

class WebSocketService {
  constructor(serverPort) {
    this.wss = new WebSocketServer({ port: serverPort });
    this.initialize();
  }

  initialize() {
    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url, 'http://localhost');
      ws.gameId = url.searchParams.get('gameId') || '';

      ws.on('message', (message) => {
        this.handleMessage(message, ws);
      });
    });

    console.log(`WebSocket server is running on port ${this.wss.options.port}`);
  }

  handleMessage(message, ws) {
    let parsed;
    try {
      parsed = JSON.parse(message);
    } catch {
      return;
    }

    if (!parsed || parsed.event !== 'CHAT_MESSAGE' || !ws.gameId) {
      return;
    }

    const username = String(parsed.data?.username || 'Anonymous').trim().slice(0, 20) || 'Anonymous';
    const text = String(parsed.data?.text || '').trim().slice(0, 500);

    if (!text) {
      return;
    }

    this.sendToGame(ws.gameId, 'CHAT_MESSAGE', { username, text });
  }

  sendToGame(gameId, event, data) {
    const payload = JSON.stringify({ event, data });
    this.wss.clients.forEach((client) => {
      if (client.gameId === gameId && client.readyState === 1) {
        client.send(payload);
      }
    });
  }
}

const webSocketService = new WebSocketService(port);
export default webSocketService;
